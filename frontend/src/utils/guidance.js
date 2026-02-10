export const buildGuidancePrompt = ({ context, task, uiDescription, constraints, verbosity }) => {
  const verbosityLine =
    verbosity === 'concise'
      ? 'Keep it concise. Limit to 5-7 steps.'
      : verbosity === 'detailed'
        ? 'Be detailed with practical tips and edge cases.'
        : 'Use a balanced level of detail with practical tips.'

  return `You are a UX guidance assistant for University of Ibadan services. Provide a step-by-step walkthrough.

User context: ${context || 'General UI Guide request'}
Task: ${task}
UI description: ${uiDescription || 'Not provided'}
Constraints: ${constraints || 'None'}
Verbosity: ${verbosity}

Return the response in Markdown with the following sections:

## Summary
- 2-3 sentences explaining the approach.

## Steps
1. Step title - short, action-oriented.
   Why: short reason.
   Note: optional.
   Warning: optional.

## Next Steps
- 2-4 bullets with follow-up actions.

${verbosityLine}`
}

const normalizeSectionKey = (value) =>
  value.toLowerCase().replace(/[:]/g, '').replace(/\s+/g, ' ').trim()

export const parseGuidanceMarkdown = (markdown) => {
  const sections = { intro: [] }
  let current = 'intro'

  markdown.split('\n').forEach((line) => {
    const headingMatch = line.match(/^#{1,3}\s+(.*)$/)
    if (headingMatch) {
      current = normalizeSectionKey(headingMatch[1])
      sections[current] = []
      return
    }
    sections[current] = sections[current] || []
    sections[current].push(line)
  })

  const summary = (sections.summary || sections.intro || []).join('\n').trim()
  const stepsSection = sections.steps || sections['step by step'] || sections['step-by-step'] || []
  const steps = []
  let currentStep = null

  stepsSection.forEach((line) => {
    const stepMatch = line.match(/^\s*\d+\.\s+(.*)$/)
    if (stepMatch) {
      if (currentStep) steps.push(currentStep)
      currentStep = { text: stepMatch[1].trim(), why: '', note: '', warning: '' }
      return
    }

    if (!currentStep) return
    const trimmed = line.trim().replace(/^[-*]\s+/, '')

    if (trimmed.toLowerCase().startsWith('why:')) {
      currentStep.why = trimmed.slice(4).trim()
    } else if (trimmed.toLowerCase().startsWith('note:')) {
      currentStep.note = trimmed.slice(5).trim()
    } else if (trimmed.toLowerCase().startsWith('warning:')) {
      currentStep.warning = trimmed.slice(8).trim()
    }
  })

  if (currentStep) steps.push(currentStep)

  const nextSteps = (sections['next steps'] || []).filter(Boolean)
  const warnings = steps.filter((step) => step.warning).map((step) => step.warning)
  const notes = steps.filter((step) => step.note).map((step) => step.note)

  return {
    summary,
    steps,
    notes,
    warnings,
    nextSteps,
    raw: markdown,
  }
}

export const exportGuidanceMarkdown = ({ title, content, context }) => {
  return `# ${title}\n\nGenerated: ${new Date().toLocaleString()}\n\nContext: ${context}\n\n${content}\n`
}
