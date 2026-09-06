# Pull Requests and Code Review

A pull request is GitHub's layer on top of Git, not a Git concept itself — Git only knows about commits, branches, and remotes. A pull request (PR) proposes merging one branch into another, packaged with a place for discussion, automated checks, and review before the merge happens. You can do all the branching and merging from earlier chapters without ever touching a PR, but PRs are how most teams add a review step before code reaches a shared branch.

## Why teams gate merges behind review

Merging directly into `main` whenever you finish a change works fine alone, but it breaks down with more than one person. A pull request pauses that merge and gives teammates a chance to read the diff, ask questions, run automated tests, and catch problems before they land where everyone else builds on top of them. The underlying branch and commit mechanics are exactly what you already know — a PR is a conversation wrapped around a merge that hasn't happened yet.

```bash
git switch -c fix-null-check
echo "if (user != null) { render(user) }" >> app.js
git add app.js
git commit -m "Guard render() against a null user to fix crash on logout"

git push origin fix-null-check
# To https://github.com/example/project.git
#  * [new branch]      fix-null-check -> fix-null-check
# remote: Create a pull request for 'fix-null-check' on GitHub by visiting:
# remote:   https://github.com/example/project/pull/new/fix-null-check
```

Pushing a new branch to GitHub is usually all it takes for GitHub to offer you a direct link to open a PR comparing your branch against `main`.

## What happens inside a review

Once a PR is open, reviewers see the diff between your branch and the target branch — the same information `git diff` would show you locally, rendered for discussion. They can leave comments on specific lines, request changes, or approve. If a reviewer asks for a change, you make it the same way you made the original commit: edit the file, commit, and push again to the same branch. The PR updates automatically because it always reflects the current state of the branch, not a frozen snapshot.

```bash
echo "if (user !== null && user !== undefined) { render(user) }" >> app.js
git add app.js
git commit -m "Also guard against undefined per review feedback"
git push origin fix-null-check
# the open PR now shows this new commit automatically
```

This is why keeping PRs focused on one logical change matters — the same discipline from staging and committing earlier applies at the PR level. A PR that mixes an unrelated refactor with a bug fix is harder to review and harder to revert if something goes wrong later.

## Merging the pull request

Once a PR is approved and any required checks pass, it gets merged, usually through the GitHub interface rather than the command line. Under the hood this is still an ordinary Git merge — GitHub is running the same fast-forward or merge-commit logic described in the branching chapter, just triggered from the web rather than your terminal. Some teams squash all the PR's commits into one before merging, to keep `main`'s history to one entry per feature; others preserve every commit. Either way, after the merge you'll want to pull the updated `main` locally and delete your now-merged branch.

```bash
git switch main
git pull origin main
git branch -d fix-null-check
# Deleted branch fix-null-check (was 7d3f2a1).
```

## Key points

- A pull request is GitHub's review layer around a Git merge, not a separate version-control concept.
- PRs let teammates read diffs, comment on specific lines, and require checks to pass before a merge lands.
- Pushing more commits to the same branch updates the open PR automatically.
- Keep a PR scoped to one logical change, the same way you keep commits focused.
- After a PR merges, pull the updated target branch locally and delete the merged feature branch.

The commands in this course are the same ones you'll use every day on a real team — the difference on a real team is discipline: small commits, honest messages, and PRs that reviewers can actually reason about.
