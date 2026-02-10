import { describe, expect, it } from 'vitest'
import { parseGuidanceMarkdown } from './guidance'

const sample = `## Summary
This is a summary.

## Steps
1. Log into the portal.
   Why: Ensures you have access.
   Note: Use your student ID.
2. Review the checklist.
   Warning: Deadlines are strict.

## Next Steps
- Save a copy.
- Contact support if needed.`

describe('parseGuidanceMarkdown', () => {
  it('parses steps and metadata', () => {
    const parsed = parseGuidanceMarkdown(sample)
    expect(parsed.summary).toContain('summary')
    expect(parsed.steps).toHaveLength(2)
    expect(parsed.steps[0].why).toContain('Ensures you have access')
    expect(parsed.steps[0].note).toContain('student ID')
    expect(parsed.steps[1].warning).toContain('Deadlines')
    expect(parsed.nextSteps).toHaveLength(2)
  })
})
