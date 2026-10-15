# Automatic Git Update Policy

Whenever you make any changes to files in this repository (adding features, fixing bugs, refactoring, or updating configurations):

1. **Auto-Stage & Commit**:
   - Immediately stage modified and new relevant files using `git add`.
   - Never stage credentials, `.env`, `.env.local`, or build artifacts (ensure `.gitignore` is respected).
   - Commit changes with a concise and descriptive Conventional Commit message (e.g. `feat(...)`, `fix(...)`, `refactor(...)`).

2. **Auto-Push**:
   - Push committed changes to the remote branch (`git push origin main` or the active working branch).

3. **Clean Working Tree**:
   - Verify `git status` at the end of each task to confirm no uncommitted edits remain behind.
