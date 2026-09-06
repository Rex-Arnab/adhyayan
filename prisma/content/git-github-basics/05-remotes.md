# Remotes: push, pull, and fetch

Everything covered so far happens entirely on your own machine. A remote is what connects your local repository to a copy hosted somewhere else — usually GitHub — so that you and your teammates can share commits. Getting comfortable with remotes means understanding that your local repository and the remote one are two separate, independent histories that you explicitly choose to synchronize.

## Cloning and the origin remote

When you clone an existing repository, Git downloads its full history and automatically sets up a remote named `origin` pointing back to where it came from.

```bash
git clone https://github.com/example/project.git
# Cloning into 'project'...
# remote: Enumerating objects: 120, done.
# Receiving objects: 100% (120/120), done.

cd project
git remote -v
# origin  https://github.com/example/project.git (fetch)
# origin  https://github.com/example/project.git (push)
```

`origin` is just a convention, not a keyword — you could name a remote anything, but nearly every tool and tutorial assumes `origin` for the primary remote, so it's worth keeping that name.

## fetch vs. pull: the confusion beginners hit first

`git fetch` downloads any new commits from the remote into your local repository, but it does not touch your working tree or your local branches. It updates a set of remote-tracking branches (like `origin/main`) so you can see what changed, without merging anything into your own work yet.

```bash
git fetch origin
# remote: Enumerating objects: 8, done.
# From https://github.com/example/project
#    a1b2c3d..8e9f0a1  main       -> origin/main

git log origin/main --oneline -3
# 8e9f0a1 Fix login redirect bug
# a1b2c3d Cap retry count at 3
# 9f8e7d6 Add initial hello-world script
```

`git pull` does two things in sequence: it runs `git fetch`, then immediately merges the fetched changes into your current branch. This is convenient, but it means `pull` can trigger a merge (and possibly a merge conflict) without warning if you're not expecting it. Many experienced Git users prefer to `fetch` first, look at what changed, and merge deliberately — especially on a shared branch where surprises are costly.

```bash
git pull origin main
# Updating a1b2c3d..8e9f0a1
# Fast-forward
#  login.js | 4 ++--
#  1 file changed, 2 insertions(+), 2 deletions(-)
```

## Pushing your commits

`git push` sends your local commits to the remote, updating the branch there to match yours.

```bash
git switch -c feature-signup
echo "signup form" >> app.js
git add app.js
git commit -m "Add signup form skeleton"

git push origin feature-signup
# Enumerating objects: 5, done.
# To https://github.com/example/project.git
#  * [new branch]      feature-signup -> feature-signup
```

If someone else has pushed commits to the same branch since you last fetched, your push will be rejected because your local history doesn't include their commits yet — Git refuses to silently overwrite work it doesn't know about. The fix is to `fetch` (or `pull`) to bring those commits in, resolve any conflicts locally, and then push again.

```bash
git push origin feature-signup
# ! [rejected]        feature-signup -> feature-signup (fetch first)
# error: failed to push some refs

git pull origin feature-signup
git push origin feature-signup
```

## Key points

- A remote is a separate copy of the repository hosted elsewhere; `origin` is the conventional name for the primary one.
- `git fetch` downloads new commits without merging them into your work; `git pull` fetches and merges in one step.
- Prefer `fetch` plus a deliberate merge when you want to inspect incoming changes before combining them with your own.
- `git push` uploads your local commits; it is rejected if the remote has commits you don't have yet.
- A rejected push means "fetch first," not "force" — pulling in the missing history is almost always the right next step.

With remotes covered, the last piece is how teams actually use branches and remotes together in practice: pull requests and code review.
