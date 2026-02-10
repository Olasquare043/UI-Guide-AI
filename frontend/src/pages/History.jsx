import { Download, Pencil, Trash2 } from 'lucide-react'
import useLocalStorage from '../hooks/useLocalStorage'
import { buildChatMarkdown } from '../utils/export'
import { exportGuidanceMarkdown } from '../utils/guidance'

const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const History = () => {
  const [guides, setGuides] = useLocalStorage('ui-guide-guides', [])
  const [chats, setChats] = useLocalStorage('ui-guide-chats', [])

  const renameItem = (id, collection, setCollection) => {
    const name = window.prompt('Rename item')
    if (!name) return
    setCollection(collection.map((item) => (item.id === id ? { ...item, title: name } : item)))
  }

  const deleteItem = (id, collection, setCollection) => {
    if (!window.confirm('Delete this entry?')) return
    setCollection(collection.filter((item) => item.id !== id))
  }

  const exportGuide = (guide) => {
    const markdown = exportGuidanceMarkdown({
      title: guide.title,
      context: guide.context,
      content: guide.response,
    })
    downloadFile(markdown, `${guide.title.replace(/\s+/g, '-').toLowerCase()}.md`)
  }

  const exportChat = (chat) => {
    const markdown = buildChatMarkdown({ title: chat.title, messages: chat.messages })
    downloadFile(markdown, `${chat.title.replace(/\s+/g, '-').toLowerCase()}.md`)
  }

  return (
    <div className="space-y-10">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm lg:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">History</h1>
        <p className="mt-2 text-sm text-slate-600">Review and manage saved guidance sessions.</p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Guided walkthroughs</h2>
          <span className="text-xs font-semibold text-slate-500">{guides.length} entries</span>
        </div>
        {guides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No walkthroughs saved yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{guide.title}</p>
                    <p className="text-xs text-slate-500">{guide.context}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(guide.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => exportGuide(guide)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                  <button
                    onClick={() => renameItem(guide.id, guides, setGuides)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                  >
                    <Pencil className="h-3 w-3" />
                    Rename
                  </button>
                  <button
                    onClick={() => deleteItem(guide.id, guides, setGuides)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Chat conversations</h2>
          <span className="text-xs font-semibold text-slate-500">{chats.length} entries</span>
        </div>
        {chats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No conversations saved yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{chat.title}</p>
                    <p className="text-xs text-slate-500">{chat.messages.length} messages</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => exportChat(chat)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                  <button
                    onClick={() => renameItem(chat.id, chats, setChats)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                  >
                    <Pencil className="h-3 w-3" />
                    Rename
                  </button>
                  <button
                    onClick={() => deleteItem(chat.id, chats, setChats)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default History
