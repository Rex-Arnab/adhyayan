# Why Version Control

Every project you build for more than a day needs a way to remember what changed, when, and why. Version control is the tool that gives you that memory, and Git is the version control system almost every team uses today. Before you type a single Git command, it helps to understand the problem Git actually solves.

## The problem with folders full of copies

Without version control, people track changes by renaming files: `report.docx`, `report-final.docx`, `report-final-v2.docx`, `report-final-v2-ACTUAL.docx`. This falls apart fast. You cannot see what changed between two versions without opening both and comparing by eye. You cannot combine two people's edits without manually copying text back and forth. You cannot go back to "the version from Tuesday" unless you happened to save a copy on Tuesday. And if two people edit the same file at the same time, one person's work silently overwrites the other's.

Git replaces this with a single history that lives inside the project itself, in a hidden `.git` directory. Instead of naming files by version, you record a series of snapshots, and Git tracks the relationships between them automatically.

## The three areas Git uses

Understanding Git means understanding three distinct places your work can live:

- **Working tree** — the actual files on your disk, the ones you open and edit in your editor. This is what you see in Finder or a file browser.
- **Staging area** (also called the index) — a holding area where you list exactly which changes you want to include in your next snapshot. It exists so you can build a commit deliberately, rather than being forced to save everything you touched.
- **Repository** — the permanent, compressed history of snapshots, stored in `.git`. Once a change is committed here, Git can always get back to it.

A change starts in the working tree, moves to the staging area when you choose to include it, and becomes permanent history when you commit. This three-stage flow is the single most important mental model in Git; nearly every command moves something between these three areas.

```bash
git init my-project
# Initialized empty Git repository in /path/to/my-project/.git/

cd my-project
git status
# On branch main
# No commits yet
# nothing to commit (create/copy files and use "git add" to track)
```

`git init` creates the `.git` directory, turning an ordinary folder into a repository. `git status` is the command you will run constantly — it tells you what state your working tree and staging area are in, relative to the last commit.

## What a commit actually is

A commit is not a copy of your whole project. It is a snapshot of the staged files at a point in time, plus a pointer to the commit that came before it (its parent). Because each commit points backward, Git can walk the entire history of a project just by following those pointers from the most recent commit back to the first one. This chain of parent pointers is what makes commands like `git log` and `git diff` possible, and it is why Git can reconstruct any past state of your project exactly.

This also explains why Git is so good at collaboration: two people can each build their own chain of commits independently, and Git has well-defined rules for combining those chains back together later.

## Key points

- Version control replaces manual file renaming with a single, queryable history.
- Git has three areas: working tree (your files), staging area (what you're about to commit), and repository (permanent history).
- A commit is a snapshot plus a pointer to its parent commit, not a full copy of the project.
- `git init` creates a repository; `git status` shows you where your changes currently sit.
- Understanding the three-area model makes every other Git command easier to reason about.

The next chapter puts this model into practice by walking through how changes actually move from the working tree into a commit.
