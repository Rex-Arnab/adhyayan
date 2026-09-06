# Staging and Committing

Staging and committing are the two actions that turn edits in your working tree into permanent history. Beginners often treat `git add` and `git commit` as one step, but they solve different problems, and understanding why they are separate will save you from a lot of confusion later.

## Why staging exists as its own step

When you edit files, Git notices the changes but does nothing with them until you tell it to. The staging area lets you choose exactly which changes go into the next commit, even if you have edited five files but only want to commit changes to two of them, or even only part of one file. This matters in real projects: you might fix a bug and, while you're in there, also clean up an unrelated typo. Those are two different ideas and deserve two different commits, so you stage and commit them separately rather than lumping everything together.

```bash
echo "console.log('hello')" > app.js
git status
# On branch main
# Untracked files:
#   app.js

git add app.js
git status
# Changes to be committed:
#   new file:   app.js

git commit -m "Add initial hello-world script"
# [main a1b2c3d] Add initial hello-world script
#  1 file changed, 1 insertion(+)
#  create mode 100644 app.js
```

Notice the two-step shift in `git status` output: before `git add`, the file is "untracked." After `git add`, it moves to "Changes to be committed." Only `git commit` actually records the snapshot into the repository. If you edit `app.js` again after committing, it goes back to being an unstaged change — Git tracks each version of the file independently, and staging always refers to the current moment, not something permanent.

## Writing commits that explain why

A commit message has two jobs: it identifies what changed, and — more importantly — it explains why. The diff already shows what changed line by line; nobody needs a commit message that just repeats it. A message like "fix bug" or "update file" is nearly useless six months later when you're trying to understand a decision. Compare that to "Cap retry count at 3 to avoid hammering the payment API during an outage" — this tells a future reader (often you) the reasoning, not just the mechanics.

A good habit is to write the first line as a short summary (50 characters or so), leave a blank line, then add more detail in the body if the reasoning needs more than a sentence:

```bash
git commit -m "Cap retry count at 3" -m "Retries were unbounded and made the outage worse by flooding the payment API with requests. Three retries with backoff is enough to recover from transient network blips without adding load during a real outage."
```

## Selective and incremental staging

You rarely need to stage everything at once. `git add <file>` stages one file, `git add .` stages everything in the current directory, and `git add -p` walks through your changes chunk by chunk, letting you decide which pieces to include. This last one is worth learning early, because it is the tool that lets you split a messy working session into clean, focused commits after the fact, rather than having to be perfectly organized while you code.

```bash
git add -p
# diff --git a/app.js b/app.js
# ...
# Stage this hunk [y,n,q,a,d,s,e,?]?
```

## Key points

- `git add` moves changes into the staging area; `git commit` records the staged snapshot permanently.
- Staging lets you build focused, logical commits instead of one giant commit per session.
- `git status` always tells you whether a change is untracked, staged, or already committed.
- Write commit messages that explain why a change was made, not just what changed.
- `git add -p` lets you stage part of a file's changes at a time.

Once you have a history of commits, the next step is learning to read that history back — with `git log`, `git diff`, and `git show`.
