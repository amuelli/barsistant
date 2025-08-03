# Claude Session Review and Instructions Improvement

Analyze the recent Claude session and make MINIMAL, ESSENTIAL improvements to
the CLAUDE.md file only. Keep the file concise and focused.

## 1. Check Current Project State

First, verify the project is in good shape:

```bash
deno task check
deno task test
```

## 2. Identify Success Patterns

Look for what worked well in the recent session:

- What development approach was most effective?
- Which testing strategies led to success?
- What tools or patterns solved problems efficiently?
- Were there specific techniques that should be emphasized?

## 3. Identify Critical Gaps

Look for ONLY the most critical missing guidance:

- What caused confusion or errors that could be prevented?
- Which patterns weren't clear from existing instructions?
- What debugging scenarios came up that need brief mention?

## 4. Make Minimal Updates to CLAUDE.md

Based on the analysis, make ONLY essential additions to CLAUDE.md:

**Criteria for additions:**
- Must address a critical gap that caused problems
- Must be concise (1-2 lines maximum per addition)
- Must provide actionable guidance
- Should reference existing utilities or patterns in the codebase

**What NOT to add:**
- Lengthy explanations or tutorials
- Duplicate information already in other instruction files
- Detailed code examples (brief snippets only if essential)
- Extensive new sections

**Focus areas for minimal improvements:**
- Development workflow order/emphasis
- Critical debugging scenarios (1-2 new items max)
- Essential tool references (if missing)
- Brief success pattern reminders

## 5. Implementation

1. Review recent session for key lessons
2. Make 3-5 minimal line additions maximum to CLAUDE.md
3. Ensure changes are concise and actionable
4. Test that formatting is correct
5. Commit with clear message about specific improvements

Remember:

- LESS IS MORE - keep CLAUDE.md concise and scannable
- Focus on preventing the most critical failures only
- Reference existing tools/patterns rather than explaining them
- Maintain the current structure and flow of the document
