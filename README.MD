# Superexpert.AI Framework


```
# Step 1: Commit your changes
git add .
git commit -m "fix: important bug fix"
git push origin main

# Step 2: Bump version and publish
npm run bump:alpha  # updates version, creates commit and tag, publishes

# Step 3: Push the new commit and tags to GitHub
git push origin main --tags

# Step 4: Update the consuming app (optional but common)
cd ../consuming-app
npm uninstall @superexpert-ai/framework
npm install @superexpert-ai/framework@alpha
```