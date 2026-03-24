import { describe, expect, it } from 'vitest'
import { toSpeechPlainText } from './speech'

describe('toSpeechPlainText', () => {
  it('converts markdown into speech-friendly text', () => {
    const markdown = `# Admission Guide

Read the **instructions** carefully.

1. Visit [the portal](https://example.com).
2. Use \`your student ID\`.

> Deadlines are strict.

\`\`\`js
console.log('hidden from speech')
\`\`\``

    expect(toSpeechPlainText(markdown)).toBe(
      'Admission Guide. Read the instructions carefully. Visit the portal. Use your student ID. Deadlines are strict. Code sample omitted.'
    )
  })
})
