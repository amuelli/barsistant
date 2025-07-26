# Claude Session Review and Instructions Improvement

Analyze the failures in previous Claude sessions and recommend improvements to
the CLAUDE.md file and project instructions.

## 1. Review Project Architecture and Instructions

First, review the current CLAUDE.md and instruction files:

- CLAUDE.md: Project overview and guidance for Claude Code
- /.github/instructions/project.instructions.md: Development conventions and
  workflow
- /.github/instructions/requirements.instructions.md: Project requirements
- /README.md: Setup and environment

Analyze where instructions might be ambiguous or incomplete.

## 2. Identify Common Failure Patterns

Look for patterns in previous Claude session failures:

- Where did Claude misunderstand project structure?
- What project conventions were not followed?
- Where were tests insufficient or skipped?
- What architectural patterns were not clearly documented?
- Were there permission issues when running commands?
- Did Claude overlook important error messages?
- Were there misinterpretations of the task requirements?

## 3. Check Current Project State

Assess the current state of the project:

```bash
deno task check
deno task test
```

Review any failing tests or linting issues to understand systemic problems.

## 4. Improve Project Documentation

Based on the review, recommend specific improvements to CLAUDE.md:

1. **Architecture Documentation**
   - Make clearer diagrams or explanations of data flow
   - Add more examples of correct implementation patterns
   - Document cross-cutting concerns more explicitly

2. **Testing Requirements**
   - Provide more specific testing requirements for each component
   - Include examples of good test coverage
   - Add guidance on testing error cases

3. **Error Handling Patterns**
   - Document standard error handling approaches
   - Add examples of proper error propagation
   - Clarify logging requirements

4. **Performance Considerations**
   - Document performance expectations and patterns
   - Add guidance on avoiding common performance issues

5. **Database Operations**
   - Clarify KV data modeling best practices
   - Add more examples of correct transaction patterns
   - Document atomic operation requirements

## 5. Create Implementation Checklist

Create a specific checklist that Claude should follow for each task:

1. [ ] Understand the task requirements completely
2. [ ] Plan the implementation with types first
3. [ ] Implement core logic with proper error handling
4. [ ] Write comprehensive tests for all code paths
5. [ ] Run tests to verify functionality
6. [ ] Check for performance and security issues
7. [ ] Document the implementation
8. [ ] Verify against the project instructions

## 6. Recommended Updates to CLAUDE.md

Based on the analysis, recommend specific updates to CLAUDE.md with:

- New sections to add
- Existing sections to clarify
- Examples to include
- Common pitfalls to warn about
- Testing requirements to emphasize
- Command execution patterns to follow

Provide the complete recommended CLAUDE.md updates as a diff or complete
replacement.

Remember:

- Be specific about what went wrong in previous sessions
- Focus on actionable improvements to instructions
- Provide concrete examples whenever possible
- Emphasize the critical importance of testing and error handling
