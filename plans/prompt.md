# PRD

Pull @plans/prd.md into your context.

You've also been passed the last 10 RALPH commits (SHA, date, full message).
Review these to understand what work has been done.

# TASK BREAKDOWN

Break down the PRD into tasks.

Make each task the smallest possible unit of work. We don't want to outrun our
headlights. Aim for one small change per task.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure

Getting development infrastructure like tests and types and dev scripts ready is
an important precursor to building features.

3. Tracer bullets for new features

Tracer bullets comes from the Pragmatic Programmer. When building systems, you
want to write code that gets you feedback as quickly as possible. Tracer bullets
are small slices of functionality that go through all layers of the system,
allowing you to test and validate your approach early. This helps in identifying
potential issues and ensures that the overall architecture is sound before
investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

4. Polish and quick wins
5. Refactors

If there are no more tasks, emit <promise>NO MORE TASKS</promise>.

# EXPLORATION

Explore the repo and fill your context window with relevant information that
will allow you to complete the task.

# EXECUTION

Complete the task.

If anything blocks your completion of the task, output <promise>ABORT</promise>.

# FEEDBACK LOOPS

Before committing, run the feedback loops:

- `deno task check`

# COMMIT

Make a git commit. The commit message must:

1. Start with `RALPH:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

# THE ISSUE

If the task is complete, delete the issue file from the `issues/` directory.

If the task is not complete, append a brief summary of what was done to the
issue file.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
