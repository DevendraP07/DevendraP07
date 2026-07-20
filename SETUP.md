# Setup Guide

## 1. Create your profile repo (if you haven't already)

GitHub treats one specific repo specially: a repo with **the exact same name as your username**.
Its README is shown at the top of your GitHub profile.

- Go to github.com → New repository
- Name it **exactly** your username (e.g. if your username is `devkumar`, the repo must be named `devkumar`)
- Make it **Public**
- Check "Add a README file"
- Create it

If you already have this repo, just use it — you don't need a new one.

## 2. Drop these files into that repo

Copy these into the root of your profile repo, preserving folders:

```
your-username/
├── README.md
├── SETUP.md
├── scripts/
│   └── generate-readme.js
└── .github/
    └── workflows/
        └── update-readme.yml
```

## 3. Replace the placeholder

In `README.md`, replace every `YOUR_USERNAME` with your actual GitHub username.

## 4. Enable Actions write permissions

By default the automatic `GITHUB_TOKEN` used in Actions is read-only, so the workflow can't push
its own commits. Turn on write access once:

1. Repo → **Settings** → **Actions** → **General**
2. Scroll to "Workflow permissions"
3. Select **"Read and write permissions"**
4. Save

## 5. Run it

- Push these files to `main`
- Go to the **Actions** tab → "Update Profile README" → **Run workflow** (to test it immediately)
- After it finishes, refresh your profile page — the dashboard section will be filled in

After this, it re-runs automatically every 6 hours (edit the `cron` line in
`update-readme.yml` if you want it more/less frequent), and also whenever you push to this repo.

---

## How to tag your repos (this is what drives the sorting)

The dashboard groups repos using **GitHub Topics** — the same "topics" feature GitHub already
has built in (you may have seen the little tag chips under a repo's description).

### Tagging an existing repo

**Option A — GitHub UI**
1. Go to the repo's main page
2. Click the ⚙️ gear icon next to "About" (top right, next to the description)
3. In the "Topics" field, type a tag and press Enter (e.g. `nextjs`, `java`, `python`)
4. Click **Save changes**

**Option B — GitHub CLI** (faster if you're tagging many repos)
```bash
gh repo edit your-username/repo-name --add-topic nextjs
```

### Tagging a brand-new repo

GitHub's "Create repository" screen doesn't have a topics field, so:
1. Create the repo as normal
2. Right after, use Option A or B above to add its topic(s)

### Recommended tag convention

Pick **one primary stack tag per repo** so it lands cleanly in one bucket, e.g.:

| Project type | Tag to use |
|---|---|
| Next.js app | `nextjs` |
| Plain React app | `react` |
| Java project | `java` |
| Python project | `python` |
| Node/Express API | `nodejs` or `express` |
| Flutter app | `flutter` |

You can add extra secondary tags too (e.g. `mongodb`, `docker`) — the script will list the repo
under every tag it has, so a Next.js + MongoDB project will show up in both buckets.

The label/emoji mapping lives at the top of `scripts/generate-readme.js` in the `STACK_LABELS`
object — add a new entry there any time you start using a new tag, so it gets a nice label
instead of just the raw tag name. Untagged repos still show up, grouped under "🏷️ Untagged", so
nothing gets silently dropped.

---

## What "click to filter" actually does

A profile README can't run JavaScript, so true in-page filtering isn't possible there. Each
stack badge instead links to `github.com/your-username?tab=repositories&q=topic:nextjs` —
GitHub's own repositories tab, which filters live by topic. It opens in a real, fully interactive
GitHub page rather than trying to fake it inside the README.

For a browsable list without leaving the README at all, every stack also gets its own collapsible
table (click to expand/collapse) generated directly in the README — so you get both: an
always-visible browsable dashboard, and a "click to filter" link to GitHub's live view.
