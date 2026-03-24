export const toSpeechPlainText = (markdown) => {
  if (!markdown) return ''

  return markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/```[\s\S]*?```/g, ' Code sample omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\r?\n+/g, '. ')
    .replace(/(?:\.\s*){2,}/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
