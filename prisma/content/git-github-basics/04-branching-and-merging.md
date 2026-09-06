# Branching and Merging

Branches are what let you work on a new feature, try a risky idea, or fix a bug in isolation, without touching the code everyone else depends on. Understanding what a branch actually is — rather than treating it as a magic "separate copy" — makes the whole workflow click.

## A branch is just a movable pointer

A branch is not a copy of your files and it is not a separate folder. It is a small label that points at one specific commit. When you create a branch, Git does not duplicate anything; it just writes a new pointer next to the commit you're currently on. When you make a new commit while a branch is checked out, Git moves that branch's pointer forward to the new commit automatically. `HEAD` is a special pointer that tracks which branch (and therefore which commit) you currently have checked out.

This is why creating a branch in Git is instant even in a huge repository — you're writing a few bytes to a pointer, not copying files.

```bash
git branch feature-login
# creates a new pointer named feature-login at the current commit

git switch feature-login
# Switched to branch 'feature-login'

echo "login form" >> app.js
git add app.js
git commit -m "Add basic login form markup"
# [feature-login 7d3f2a1] Add basic login form markup

git switch main
git log --oneline --graph --all
# * 7d3f2a1 (feature-login) Add basic login form markup
# * a1b2c3d (HEAD -> main) Cap retry count at 3
# * 9f8e7d6 Add initial hello-world script
```

Notice `main` did not move — it still points at the commit it pointed to before, while `feature-login` moved ahead. Both branches share the earlier history; they only diverge from the point where you created the new branch.

## Merging: bringing branches back together

A merge brings the work from one branch into another. Git looks at the common ancestor commit of both branches and combines the changes made on each side since that point.

```bash
git switch main
git merge feature-login
# Merge made by the 'recursive' strategy.
#  app.js | 1 +
#  1 file changed, 1 insertion(+)
```

If the two branches changed different parts of the code, Git merges them automatically and creates a merge commit — a commit with two parents instead of one, recording that two lines of history joined back together. If `main` had not moved at all since the branch point, Git can instead do a "fast-forward," simply sliding the `main` pointer up to match `feature-login` with no merge commit needed.

## Merge conflicts are normal

A conflict happens when both branches changed the same lines of the same file in different ways, and Git cannot guess which version you want. This is not a sign that something went wrong — it is the expected outcome of two people (or two versions of yourself) editing the same code independently. Git pauses the merge and marks the conflicting sections directly in the file:

```bash
git merge feature-login
# Auto-merging app.js
# CONFLICT (content): Merge conflict in app.js
# Automatic merge failed; fix conflicts and then commit the result.
```

Opening `app.js`, you'll see conflict markers:

```
<<<<<<< HEAD
console.log('hello world')
=======
console.log('login form loaded')
>>>>>>> feature-login
```

You edit the file by hand to keep the correct combination of both changes, remove the `<<<<<<<`, `=======`, and `>>>>>>>` markers, then stage and commit the result to finish the merge:

```bash
git add app.js
git commit -m "Merge feature-login into main"
```

## Key points

- A branch is a movable pointer to a commit, not a copy of the project.
- Committing on a branch moves that branch's pointer forward; other branches are unaffected.
- Merging combines two branches' histories, either by fast-forward or by creating a two-parent merge commit.
- Merge conflicts occur when both branches edit the same lines and are a normal, expected part of collaboration, not an error.
- Resolve a conflict by editing the marked file, then `git add` and `git commit` to complete the merge.

Branches only become powerful once you can share them with other people, which is where remotes come in.
