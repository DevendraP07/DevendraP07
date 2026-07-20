/**
 * ------------------------------------------------------------
 * GitHub Profile Dashboard Generator
 * Author: DevendraP07
 * ------------------------------------------------------------
 *
 * Part 1
 * - Configuration
 * - GitHub API
 * - Repository Fetching
 * - Helpers
 */

const fs = require("fs");
const path = require("path");

const README_PATH = path.join(__dirname, "..", "README.md");

const USERNAME = process.env.GH_USERNAME;
const TOKEN = process.env.GH_TOKEN;

if (!USERNAME) {
    throw new Error("GH_USERNAME environment variable missing.");
}

if (!TOKEN) {
    throw new Error("GH_TOKEN environment variable missing.");
}

/* ===========================================================
   CONFIGURATION
=========================================================== */

const CONFIG = {

    /**
     * Repositories to ignore
     */

    ignoredRepositories: [
        USERNAME
    ],

    /**
     * Topics display order
     * Unknown topics appear under "Other"
     */

    stackOrder: [

        "nextjs",

        "react",

        "java",

        "python",

        "nodejs",

        "express",

        "typescript",

        "javascript",

        "postgresql",

        "mysql",

        "mongodb",

        "flutter",

        "android",

        "machinelearning",

        "docker",

        "other",

        "untagged"

    ],

    /**
     * Topic display information
     */

    stackInfo: {

        nextjs: {
            icon: "▲",
            name: "Next.js"
        },

        react: {
            icon: "⚛️",
            name: "React"
        },

        java: {
            icon: "☕",
            name: "Java"
        },

        python: {
            icon: "🐍",
            name: "Python"
        },

        nodejs: {
            icon: "🟢",
            name: "Node.js"
        },

        express: {
            icon: "🚂",
            name: "Express"
        },

        typescript: {
            icon: "🔷",
            name: "TypeScript"
        },

        javascript: {
            icon: "🟨",
            name: "JavaScript"
        },

        postgresql: {
            icon: "🐘",
            name: "PostgreSQL"
        },

        mysql: {
            icon: "🐬",
            name: "MySQL"
        },

        mongodb: {
            icon: "🍃",
            name: "MongoDB"
        },

        flutter: {
            icon: "📱",
            name: "Flutter"
        },

        android: {
            icon: "🤖",
            name: "Android"
        },

        machinelearning: {
            icon: "🧠",
            name: "Machine Learning"
        },

        docker: {
            icon: "🐳",
            name: "Docker"
        },

        other: {
            icon: "📦",
            name: "Other Technologies"
        },

        untagged: {
            icon: "🆕",
            name: "Untagged"
        }

    }

};

/* ===========================================================
   GITHUB REQUEST
=========================================================== */

async function githubRequest(endpoint) {

    const response = await fetch(

        `https://api.github.com${endpoint}`,

        {

            headers: {

                Authorization: `Bearer ${TOKEN}`,

                Accept: "application/vnd.github+json",

                "X-GitHub-Api-Version": "2022-11-28"

            }

        }

    );

    if (!response.ok) {

        throw new Error(

            `GitHub API Error ${response.status}\n${await response.text()}`

        );

    }

    return response.json();

}

/* ===========================================================
   FETCH ALL REPOSITORIES
=========================================================== */

async function fetchRepositories() {

    let page = 1;

    const repositories = [];

    while (true) {

        const result = await githubRequest(

            `/users/${USERNAME}/repos?per_page=100&page=${page}&sort=updated&type=owner`

        );

        if (result.length === 0) {

            break;

        }

        repositories.push(...result);

        page++;

    }

    return repositories
        .filter(repo => !repo.fork)
        .filter(repo => !repo.archived)
        .filter(repo => !CONFIG.ignoredRepositories.includes(repo.name));

}

/* ===========================================================
   HELPERS
=========================================================== */

function totalStars(repositories) {

    return repositories.reduce(

        (sum, repository) => sum + repository.stargazers_count,

        0

    );

}

function totalForks(repositories) {

    return repositories.reduce(

        (sum, repository) => sum + repository.forks_count,

        0

    );

}

function totalOpenIssues(repositories) {

    return repositories.reduce(

        (sum, repository) => sum + repository.open_issues_count,

        0

    );

}

function totalWatchers(repositories) {

    return repositories.reduce(

        (sum, repository) => sum + repository.watchers_count,

        0

    );

}

function formatDate(date) {

    return new Date(date).toLocaleDateString(

        "en-US",

        {

            year: "numeric",

            month: "short",

            day: "numeric"

        }

    );

}

function githubSearchURL(topic) {

    return `https://github.com/${USERNAME}?tab=repositories&q=topic:${encodeURIComponent(topic)}`;

}

/* ===========================================================
   GROUP REPOSITORIES USING GITHUB TOPICS
=========================================================== */

function categorizeRepositories(repositories) {

    const groups = {};

    for (const key of CONFIG.stackOrder) {

        groups[key] = [];

    }

    for (const repository of repositories) {

        const topics = Array.isArray(repository.topics)
            ? repository.topics.map(topic => topic.toLowerCase())
            : [];

        // No topics -> Untagged
        if (topics.length === 0) {

            groups.untagged.push(repository);

            continue;

        }

        let matched = false;

        for (const topic of topics) {

            if (CONFIG.stackOrder.includes(topic)) {

                groups[topic].push(repository);

                matched = true;

            }

        }

        if (!matched) {

            groups.other.push(repository);

        }

    }

    return groups;

}

/* ===========================================================
   SORT REPOSITORIES
=========================================================== */

function sortRepositories(groups) {

    for (const key of Object.keys(groups)) {

        groups[key].sort((a, b) => {

            // Latest updated first
            return new Date(b.updated_at) - new Date(a.updated_at);

        });

    }

    return groups;

}

/* ===========================================================
   GET FEATURED REPOSITORIES
=========================================================== */

function getFeaturedRepositories(repositories) {

    return [...repositories]

        .sort((a, b) => {

            if (b.stargazers_count !== a.stargazers_count) {

                return b.stargazers_count - a.stargazers_count;

            }

            return new Date(b.updated_at) - new Date(a.updated_at);

        })

        .slice(0, 6);

}

/* ===========================================================
   BUILD SUMMARY
=========================================================== */

function buildSummary(repositories) {

    return {

        totalRepositories: repositories.length,

        totalStars: totalStars(repositories),

        totalForks: totalForks(repositories),

        totalIssues: totalOpenIssues(repositories),

        totalWatchers: totalWatchers(repositories)

    };

}

/* ===========================================================
   MARKDOWN HELPERS
=========================================================== */

function badge(text, color = "2ea44f") {

    const value = encodeURIComponent(text);

    return `https://img.shields.io/badge/${value}-${color}?style=for-the-badge`;

}

function topicBadge(topic, count) {

    const info = CONFIG.stackInfo[topic] ?? {

        icon: "📦",

        name: topic

    };

    return `[![${
        info.name
    }](${badge(`${info.icon} ${info.name} ${count}`)})](${githubSearchURL(topic)})`;

}

function repositoryRow(repository) {

    const description = repository.description
        ? repository.description.replace(/\|/g, "\\|")
        : "No description available";

    return `| [**${repository.name}**](${repository.html_url}) | ${description} | ⭐ ${repository.stargazers_count} | 🍴 ${repository.forks_count} |`;

}

/* ===========================================================
   BUILD FEATURED PROJECTS
=========================================================== */

function buildFeaturedSection(repositories) {

    const featured = getFeaturedRepositories(repositories);

    let markdown = "";

    markdown += "## ⭐ Featured Repositories\n\n";

    markdown += "| Repository | Description |\n";
    markdown += "|-----------|-------------|\n";

    for (const repository of featured) {

        markdown += `| [**${repository.name}**](${repository.html_url}) | ${
            repository.description || "No description available"
        } |\n`;

    }

    markdown += "\n";

    return markdown;

}

/* ===========================================================
   BUILD STACK BADGES
=========================================================== */

function buildTopicBadges(groups) {

    let markdown = "";

    markdown += "<p align=\"center\">\n\n";

    for (const topic of CONFIG.stackOrder) {

        if (groups[topic].length === 0) {

            continue;

        }

        markdown += topicBadge(

            topic,

            groups[topic].length

        ) + "\n\n";

    }

    markdown += "</p>\n\n";

    return markdown;

}

/* ===========================================================
   BUILD DASHBOARD
=========================================================== */

function buildDashboard(summary, groups) {

    let markdown = "";

    markdown += "<br>\n";

    markdown += "<p align=\"center\">\n\n";

    markdown += `[![](https://img.shields.io/badge/Repositories-${summary.totalRepositories}-181717?style=for-the-badge)](https://github.com/${USERNAME}?tab=repositories)\n`;

    markdown += `[![](https://img.shields.io/badge/Stars-${summary.totalStars}-f1c40f?style=for-the-badge)](https://github.com/${USERNAME}?tab=repositories)\n`;

    markdown += `[![](https://img.shields.io/badge/Forks-${summary.totalForks}-3498db?style=for-the-badge)](https://github.com/${USERNAME}?tab=repositories)\n`;

    markdown += `[![](https://img.shields.io/badge/Watchers-${summary.totalWatchers}-8e44ad?style=for-the-badge)](https://github.com/${USERNAME}?tab=repositories)\n`;

    markdown += "</p>\n\n";

    markdown += "---\n\n";

    markdown += "## 🗂 Repository Explorer\n\n";

    markdown +=
        "> Repositories are grouped **only using GitHub Topics**.\n\n";

    markdown +=
        "> Click any stack below to open the filtered GitHub repositories.\n\n";

    markdown += buildTopicBadges(groups);

    markdown += "---\n\n";

    return markdown;

}

/* ===========================================================
   BUILD STACK SECTIONS
=========================================================== */

function buildStackSections(groups) {

    let markdown = "";

    for (const stack of CONFIG.stackOrder) {

        const repositories = groups[stack];

        if (!repositories.length) continue;

        const info = CONFIG.stackInfo[stack] ?? {

            icon: "📦",

            name: stack

        };

        markdown += `<details ${stack === CONFIG.stackOrder[0] ? "open" : ""}>\n`;

        markdown += `<summary><b>${info.icon} ${info.name} (${repositories.length})</b></summary>\n\n`;

        markdown += "| Repository | Description | ⭐ | 🍴 |\n";
        markdown += "|-----------|-------------|---|---|\n";

        for (const repository of repositories) {

            markdown += repositoryRow(repository) + "\n";

        }

        markdown += "\n";

        markdown += "</details>\n\n";

    }

    return markdown;

}

/* ===========================================================
   BUILD UNTAGGED SECTION
=========================================================== */

function buildUntagged(groups) {

    if (!groups.untagged.length) {

        return "";

    }

    let markdown = "";

    markdown += "---\n\n";

    markdown += "## 🆕 Newly Created / Untagged Repositories\n\n";

    markdown +=
        "> Add a GitHub Topic to automatically move these repositories into the correct stack.\n\n";

    markdown += "| Repository | Created | Last Updated |\n";

    markdown += "|-----------|---------|--------------|\n";

    for (const repository of groups.untagged) {

        markdown += `| [**${repository.name}**](${repository.html_url}) | ${formatDate(
            repository.created_at
        )} | ${formatDate(repository.updated_at)} |\n`;

    }

    markdown += "\n";

    return markdown;

}

/* ===========================================================
   BUILD COMPLETE GENERATED SECTION
=========================================================== */

function buildGeneratedMarkdown(repositories) {

    const groups = sortRepositories(

        categorizeRepositories(repositories)

    );

    const summary = buildSummary(repositories);

    let markdown = "";

    markdown += buildDashboard(summary, groups);

    markdown += buildFeaturedSection(repositories);

    markdown += buildStackSections(groups);

    markdown += buildUntagged(groups);

    return markdown;

}

/* ===========================================================
   README UPDATE
=========================================================== */

function updateReadme(content) {

    const START = "<!-- DASHBOARD:START -->";
    const END = "<!-- DASHBOARD:END -->";

    const readme = fs.readFileSync(README_PATH, "utf8");

    const startIndex = readme.indexOf(START);
    const endIndex = readme.indexOf(END);

    if (startIndex === -1 || endIndex === -1) {

        throw new Error(
            "README markers not found.\nExpected:\n<!-- DASHBOARD:START -->\n<!-- DASHBOARD:END -->"
        );

    }

    const updatedReadme =
        readme.substring(0, startIndex + START.length) +
        "\n\n" +
        content.trim() +
        "\n\n" +
        readme.substring(endIndex);

    fs.writeFileSync(

        README_PATH,

        updatedReadme,

        "utf8"

    );

}

/* ===========================================================
   MAIN
=========================================================== */

async function main() {

    console.log("────────────────────────────────────────────");
    console.log("GitHub Profile Dashboard Generator");
    console.log("────────────────────────────────────────────");

    console.log("\nFetching repositories...");

    const repositories = await fetchRepositories();

    console.log(`Found ${repositories.length} repositories.`);

    console.log("\nGenerating dashboard...");

    const markdown = buildGeneratedMarkdown(

        repositories

    );

    console.log("Updating README...");

    updateReadme(

        markdown

    );

    console.log("");

    console.log("Dashboard updated successfully.");

    console.log("");

}

/* ===========================================================
   EXECUTE
=========================================================== */

main()

    .then(() => {

        process.exit(0);

    })

    .catch((error) => {

        console.error("");

        console.error("Dashboard generation failed.");

        console.error("");

        console.error(error);

        process.exit(1);

    });

