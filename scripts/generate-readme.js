/**
 * generate-readme.js
 *
 * Fetches all public repos for GH_USERNAME, groups them by GitHub "topic" tags,
 * and injects a stack-sorted dashboard + stats into README.md between the
 * <!-- STACKS:START --> / <!-- STACKS:END --> markers.
 *
 * Run by .github/workflows/update-readme.yml — you shouldn't need to run this
 * manually, but you can test locally with:
 *   GH_USERNAME=yourname GH_TOKEN=ghp_xxx node scripts/generate-readme.js
 */

const fs = require("fs");
const path = require("path");

const USERNAME = process.env.GH_USERNAME;
const TOKEN = process.env.GH_TOKEN;
const README_PATH = path.join(__dirname, "..", "README.md");

if (!USERNAME || !TOKEN) {
  console.error("Missing GH_USERNAME or GH_TOKEN environment variables.");
  process.exit(1);
}

// Map of known topic tags -> pretty label + emoji.
// Add to this list as you invent new stack tags. Anything not listed
// here still shows up, just grouped under "Other".
const STACK_LABELS = {
  nextjs: "▲ Next.js",
  react: "⚛️ React",
  reactnative: "📱 React Native",
  java: "☕ Java",
  python: "🐍 Python",
  typescript: "🔷 TypeScript",
  javascript: "🟨 JavaScript",
  nodejs: "🟢 Node.js",
  flutter: "🐦 Flutter",
  django: "🎸 Django",
  flask: "🧪 Flask",
  express: "🚂 Express",
  mongodb: "🍃 MongoDB",
  postgresql: "🐘 PostgreSQL",
  mysql: "🐬 MySQL",
  docker: "🐳 Docker",
  aws: "☁️ AWS",
  golang: "🐹 Go",
  rust: "🦀 Rust",
  cpp: "➕ C++",
  csharp: "🔵 C#",
  machinelearning: "🤖 Machine Learning",
  androidapp: "🤖 Android",
};

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}: ${await res.text()}`);
  }
  return res.json();
}

async function fetchAllRepos() {
  let page = 1;
  let all = [];
  while (true) {
    const batch = await ghFetch(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}&type=owner&sort=updated`
    );
    all = all.concat(batch);
    if (batch.length < 100) break;
    page++;
  }
  // Skip forks, archived repos, and the special profile repo itself
  return all.filter(
    (r) => !r.fork && !r.archived && r.name.toLowerCase() !== USERNAME.toLowerCase()
  );
}

function groupByTopic(repos) {
  const groups = {};
  for (const repo of repos) {
    const tags = repo.topics && repo.topics.length ? repo.topics : ["untagged"];
    for (const tag of tags) {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(repo);
    }
  }
  return groups;
}

function topicSearchUrl(topic) {
  return `https://github.com/${USERNAME}?tab=repositories&q=topic%3A${encodeURIComponent(topic)}`;
}

function badge(label, count, topic) {
  const text = encodeURIComponent(label.replace(/-/g, "--"));
  const badgeUrl = `https://img.shields.io/badge/${text}-${count}-2ea44f?style=for-the-badge`;
  return `[![${label}](${badgeUrl})](${topicSearchUrl(topic)})`;
}

function repoCard(repo) {
  const desc = (repo.description || "No description yet").replace(/\|/g, "-");
  return `| [\`${repo.name}\`](${repo.html_url}) | ${desc} | ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} |`;
}

function buildSection(groups, repos) {
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);

  // Sort tags: known stacks first (alphabetically), then unknown ones, "untagged" last
  const tags = Object.keys(groups).sort((a, b) => {
    if (a === "untagged") return 1;
    if (b === "untagged") return -1;
    return a.localeCompare(b);
  });

  let out = "";

  out += `<p align="center">\n`;
  out += `${badge("Total Projects", repos.length, "")
    .replace(topicSearchUrl(""), `https://github.com/${USERNAME}?tab=repositories`)}\n`;
  out += `${badge("Total Stars", totalStars, "").replace(
    topicSearchUrl(""),
    `https://github.com/${USERNAME}?tab=repositories&sort=stargazers`
  )}\n`;
  out += `${badge("Total Forks", totalForks, "").replace(
    topicSearchUrl(""),
    `https://github.com/${USERNAME}?tab=repositories`
  )}\n`;
  out += `</p>\n\n`;

  out += `### Filter by stack\n`;
  out += `_Click a badge to see that stack's repos live on GitHub._\n\n`;
  out += `<p align="center">\n`;
  for (const tag of tags) {
    if (tag === "untagged") continue;
    const label = STACK_LABELS[tag] || tag;
    out += `${badge(label, groups[tag].length, tag)}\n`;
  }
  out += `</p>\n\n`;

  for (const tag of tags) {
    const label = STACK_LABELS[tag] || (tag === "untagged" ? "🏷️ Untagged" : tag);
    out += `<details${tag === tags[0] ? " open" : ""}>\n`;
    out += `<summary><b>${label} (${groups[tag].length})</b></summary>\n\n`;
    out += `| Repo | Description | Stars | Forks |\n`;
    out += `|---|---|---|---|\n`;
    for (const repo of groups[tag].sort((a, b) => b.stargazers_count - a.stargazers_count)) {
      out += repoCard(repo) + "\n";
    }
    out += `\n</details>\n\n`;
  }

  return out.trim();
}

async function main() {
  const repos = await fetchAllRepos();
  const groups = groupByTopic(repos);
  const section = buildSection(groups, repos);

  const readme = fs.readFileSync(README_PATH, "utf8");
  const startMarker = "<!-- STACKS:START -->";
  const endMarker = "<!-- STACKS:END -->";
  const startIdx = readme.indexOf(startMarker);
  const endIdx = readme.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error("README.md is missing the STACKS:START / STACKS:END markers.");
    process.exit(1);
  }

  const updated =
    readme.slice(0, startIdx + startMarker.length) +
    "\n\n" +
    section +
    "\n\n" +
    readme.slice(endIdx);

  fs.writeFileSync(README_PATH, updated);
  console.log(`Updated README.md with ${repos.length} repos across ${Object.keys(groups).length} tags.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
