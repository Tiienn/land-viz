---
description: Commit and push all changes to GitHub repository
---

Commit and push all project changes to https://github.com/Tiienn/land-viz:

1. Check git status to see what's changed
2. Stage all changes
3. Create a meaningful commit message based on the changes
4. Push to the main branch on GitHub

Execute these git commands:
```bash
git status
git add -A
git status --short
```

Then create a descriptive commit and push:
```bash
git commit -m "Update: $ARGUMENTS"
git push origin main
```

If no commit message provided via arguments, analyze the changes and create an appropriate commit message describing what was updated.