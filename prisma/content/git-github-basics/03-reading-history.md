# Reading History: log, diff, and show

Once you have committed even a handful of changes, your repository holds a chain of snapshots you can inspect at any time. Reading that history well is a skill on its own — it is how you understand what happened in a project before you were around, or what you yourself did last week and forgot.

## git log: walking the chain of commits

`git log` prints commits starting from the current one and following parent pointers backward, which is exactly the chain described in the earlier chapters. Each entry shows a commit hash, author, date, and message.

```bash
git log
# commit a1b2c3d4e5f6... (HEAD -> main)
# Author: Jane Doe <jane@example.com>
# Date:   Fri Sep 4 10:15:22 2026 -0600
#
#     Cap retry count at 3
#
# commit 9f8e7d6c5b4a...
# Author: Jane Doe <jane@example.com>
# Date:   Thu Sep 3 16:02:10 2026 -0600
#
#     Add initial hello-world script
```

The default view is verbose, so most people quickly switch to a compact form for everyday scanning:

```bash
git log --oneline --graph
# * a1b2c3d (HEAD -> main) Cap retry count at 3
# * 9f8e7d6 Add initial hello-world script
```

`--oneline` shows one line per commit with a shortened hash; `--graph` draws the branch structure with ASCII lines, which becomes essential once branches and merges enter the picture. You can also narrow `git log` to a single file (`git log -- app.js`) to see only the commits that touched it, or search commit messages with `git log --grep="retry"`.

## git diff: comparing states

`git diff` shows line-by-line differences between two points. Used alone, it shows unstaged changes in your working tree compared to the last commit. Add `--staged` (or `--cached`) to see what is staged and about to be committed — a useful sanity check right before you commit.

```bash
git diff
# diff --git a/app.js b/app.js
# --- a/app.js
# +++ b/app.js
# @@ -1 +1 @@
# -console.log('hello')
# +console.log('hello world')

git diff --staged
# (shows only what's already staged, distinct from the working-tree diff above)
```

You can also diff two commits directly using their hashes, or a range, to see everything that changed between two points in history: `git diff 9f8e7d6 a1b2c3d`. This is how you answer "what actually changed between last week's release and this one" without reading every commit individually.

## git show: inspecting one commit in detail

Where `git log` gives you an overview and `git diff` compares two states, `git show` gives you the full detail of a single commit: its message, metadata, and the diff it introduced.

```bash
git show a1b2c3d
# commit a1b2c3d4e5f6...
# Author: Jane Doe <jane@example.com>
# Date:   Fri Sep 4 10:15:22 2026 -0600
#
#     Cap retry count at 3
#
# diff --git a/app.js b/app.js
# --- a/app.js
# +++ b/app.js
# @@ -1,3 +1,3 @@
# -MAX_RETRIES = 10
# +MAX_RETRIES = 3
```

This is the command to reach for when a teammate says "what did that commit actually do," or when you're trying to remember your own reasoning from a message that turned out to be too terse — which is exactly why the previous chapter emphasized writing commit messages that explain why.

## Key points

- `git log` walks the commit chain from newest to oldest, following each commit's parent pointer.
- `git log --oneline --graph` is the everyday compact view, especially once branches exist.
- `git diff` compares states: working tree vs. last commit by default, or `--staged` for what's queued to commit.
- `git show <hash>` reveals one commit's full message and the diff it introduced.
- Reading history well means treating commits as a searchable record, not just a backup mechanism.

With history-reading tools in hand, you're ready to work with branches — separate, independent lines of commits that let you experiment without disturbing the main line of work.
