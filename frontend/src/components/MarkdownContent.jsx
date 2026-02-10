import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const MarkdownContent = ({ children }) => (
  <div className="markdown text-sm text-slate-700">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  </div>
)

export default MarkdownContent
