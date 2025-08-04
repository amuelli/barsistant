# Commit Changes Command

Systematically commit staged and unstaged changes with proper commit messages
following the project's conventions.

## 1. Review Current Git Status

First, assess the current state of the repository:

```bash
git status
```

Check for:

- Staged changes ready to commit
- Unstaged changes that need to be reviewed
- Untracked files that should be included
- Branch status (ahead/behind origin)

## 2. Review Changes Before Committing

For staged changes:

```bash
git diff --staged
```

For unstaged changes:

```bash
git diff
```

Review all changes to ensure they are:

- Intentional and complete
- Free of sensitive information (secrets, keys)
- Following code style and conventions
- Not including debug code or temporary files

## 3. Stage Additional Changes if Needed

If there are unstaged changes that should be included:

```bash
# Stage specific files
git add path/to/file1 path/to/file2

# Or stage all changes (use carefully)
git add .
```

## 4. Check Recent Commit Messages for Style

Review recent commits to follow the same style:

```bash
git log --oneline -5
```

Look for patterns in:

- Commit message format (conventional commits, etc.)
- Capitalization and punctuation
- Length and structure

## 5. Create Proper Commit Message

Follow the project's commit message convention:

```bash
git commit -m "$(cat <<'EOF'
type: brief description of changes

- Detailed bullet point of what was changed
- Another change with specific details
- Include why the change was made if not obvious

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Commit Message Types:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `style:` - Formatting changes

## 6. Verify Commit Success

After committing:

```bash
git status
git log --oneline -1
```

Ensure:

- Working tree is clean (unless there are intentionally unstaged changes)
- Commit was created successfully
- Commit message is properly formatted

## 7. Handle Multiple Commits if Needed

If there are multiple logical changes, consider separate commits:

1. Stage and commit the first logical group
2. Stage and commit the second logical group
3. Continue until all changes are committed

This creates cleaner git history and makes reviews easier.

## 8. Quality Checks Before Committing

Before committing, especially for code changes:

```bash
# Run quality checks
deno task check

# Run tests if applicable
deno task test
```

Only commit if these pass, unless you're explicitly committing broken code for
collaboration.

## 9. Push Considerations

After committing, consider if you need to push:

```bash
# Push to remote if ready
git push

# Or just commit locally for now
# (useful for work-in-progress)
```

## Example Workflow

```bash
# 1. Check status
git status

# 2. Review changes
git diff --staged
git diff

# 3. Stage additional files if needed
git add specific/files

# 4. Check recent commit style
git log --oneline -3

# 5. Commit with proper message
git commit -m "$(cat <<'EOF'
feat: implement user profile settings page

- Add user profile form with validation
- Implement avatar upload functionality
- Add password change capability
- Include email verification flow
- Add proper error handling and user feedback

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 6. Verify
git status
git log --oneline -1
```

## Best Practices

1. **Review before committing**: Always review changes carefully
2. **Atomic commits**: Each commit should represent one logical change
3. **Clear messages**: Write commit messages that future developers will
   understand
4. **Test before committing**: Ensure code quality with tests and linting
5. **Consistent style**: Follow the project's commit message conventions
6. **Secure commits**: Never commit secrets, keys, or sensitive information

## Troubleshooting

- **Large diffs**: Consider breaking into multiple commits
- **Merge conflicts**: Resolve before committing
- **Failed hooks**: Check pre-commit hooks and fix issues
- **Wrong files staged**: Use `git reset HEAD <file>` to unstage
- **Wrong commit message**: Use `git commit --amend` for the last commit
