export const buildChatMarkdown = ({ title, messages }) => {
  const header = `# ${title}\n\nGenerated: ${new Date().toLocaleString()}\n\n`
  const body = messages
    .map((message) => {
      const label = message.role === 'user' ? 'User' : 'UI Guide'
      return `## ${label}\n${message.content}\n`
    })
    .join('\n')

  return header + body
}
