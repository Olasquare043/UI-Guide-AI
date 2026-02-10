import { describe, expect, it } from 'vitest'
import { buildChatMarkdown } from './export'

describe('buildChatMarkdown', () => {
  it('formats chat history into markdown', () => {
    const markdown = buildChatMarkdown({
      title: 'Test Chat',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    })

    expect(markdown).toContain('# Test Chat')
    expect(markdown).toContain('## User')
    expect(markdown).toContain('Hello')
    expect(markdown).toContain('## UI Guide')
  })
})
