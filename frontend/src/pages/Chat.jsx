import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MessageSquarePlus,
  Mic,
  MicOff,
  Send,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MarkdownContent from '../components/MarkdownContent'
import VoiceModeToggle from '../components/VoiceModeToggle'
import VoiceStatus from '../components/VoiceStatus'
import useSpeech from '../hooks/useSpeech'
import useToast from '../hooks/useToast'
import useLocalStorage from '../hooks/useLocalStorage'
import usePreferences from '../hooks/usePreferences'
import { sendMessage } from '../services/api'

const buildPrompt = (message, verbosity) => {
  if (verbosity === 'normal') return message
  return `Please respond in a ${verbosity} manner.\n\nUser question: ${message}`
}

const Chat = () => {
  const { pushToast } = useToast()
  const { preferences, setVerbosity, setVoiceMode } = usePreferences()
  const [chats, setChats] = useLocalStorage('ui-guide-chats', [])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const abortRef = useRef(null)
  const {
    capabilitiesLoading,
    dictationMode,
    dictationSupported,
    isListening,
    isTranscribing,
    listeningTarget,
    playbackSupported,
    speakingId,
    speechRecognitionSupported,
    stopListening,
    stopPlayback,
    toggleListening,
    togglePlayback,
    transcribingTarget,
  } = useSpeech({ pushToast })

  const currentChat = useMemo(
    () => chats.find((chat) => chat.id === currentChatId),
    [chats, currentChatId]
  )
  const scrollToBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }

  const handleVoiceModeChange = useCallback(
    (enabled) => {
      setVoiceMode(enabled)
      if (!enabled) {
        stopPlayback()
      }
    },
    [setVoiceMode, stopPlayback]
  )

  const maybeAutoSpeak = useCallback(
    (message) => {
      if (!preferences.voiceMode || !playbackSupported || !message?.content || message.isError) return
      void togglePlayback({
        id: message.createdAt,
        text: message.content,
      })
    },
    [playbackSupported, preferences.voiceMode, togglePlayback]
  )

  const handleNewChat = useCallback(() => {
    const newChat = {
      id: `${Date.now()}`,
      title: 'New conversation',
      threadId: `chat_${Date.now()}`,
      messages: [
        {
          role: 'assistant',
          content:
            'Hello! I can help with University of Ibadan policies, admissions, course information, and campus services. What would you like to know?',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
  }, [setChats])

  useEffect(() => {
    if (chats.length === 0) {
      handleNewChat()
    } else if (!currentChatId) {
      setCurrentChatId(chats[0].id)
    }
  }, [chats, currentChatId, handleNewChat])

  useEffect(() => {
    scrollToBottom()
  }, [currentChat, isLoading])

  const handleDeleteChat = (chatId) => {
    if (!window.confirm('Delete this conversation?')) return
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }
  }

  const handleCancelRequest = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!input.trim() || !currentChat || isLoading) return

    stopListening()
    stopPlayback()

    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    const userMessage = {
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChat.id
          ? {
              ...chat,
              title: chat.title === 'New conversation' ? input.trim().slice(0, 40) : chat.title,
              messages: [...chat.messages, userMessage],
            }
          : chat
      )
    )

    setInput('')
    setIsLoading(true)

    try {
      const prompt = buildPrompt(userMessage.content, preferences.verbosity)
      const response = await sendMessage({
        message: prompt,
        threadId: currentChat.threadId,
        mode: 'chat',
        verbosity: preferences.verbosity,
        signal: controller.signal,
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        usedRetriever: response.used_retriever,
        sources: response.sources || [],
        createdAt: new Date().toISOString(),
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChat.id
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      )
      maybeAutoSpeak(assistantMessage)
    } catch (error) {
      if (!error.isCanceled) {
        const errorMessage = {
          role: 'assistant',
          content: error.message || 'Unable to reach the assistant.',
          isError: true,
          details: error.details,
          traceId: error.traceId,
          createdAt: new Date().toISOString(),
        }

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChat.id
              ? { ...chat, messages: [...chat.messages, errorMessage] }
              : chat
          )
        )

        pushToast({
          title: 'Message failed',
          description: error.message || 'Unable to reach the assistant.',
          variant: 'error',
        })
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      pushToast({ title: 'Copied to clipboard', variant: 'success' })
    } catch {
      pushToast({ title: 'Copy failed', variant: 'error' })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
      <aside className="flex h-[72vh] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm lg:h-[78vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-brand)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--ui-brand-strong)]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New
          </button>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              role="button"
              tabIndex={0}
              onClick={() => setCurrentChatId(chat.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setCurrentChatId(chat.id)
                }
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                currentChatId === chat.id
                  ? 'border-[var(--ui-brand)] bg-[var(--ui-brand)] text-white'
                  : 'border-slate-100 bg-white text-slate-700 hover:border-[var(--ui-brand)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block truncate font-semibold">{chat.title}</span>
                  <span className="text-xs opacity-70">
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    handleDeleteChat(chat.id)
                  }}
                  className="text-xs text-rose-200 hover:text-rose-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-xs opacity-70">{chat.messages.length} messages</div>
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Response style</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['concise', 'normal', 'detailed'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setVerbosity(level)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  preferences.verbosity === level
                    ? 'border-[var(--ui-brand)] bg-[var(--ui-brand)] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <VoiceModeToggle
              enabled={preferences.voiceMode}
              onChange={handleVoiceModeChange}
              disabled={!playbackSupported && !capabilitiesLoading}
              description={
                playbackSupported || capabilitiesLoading
                  ? 'New assistant replies will start speaking automatically.'
                  : 'Speech playback is unavailable in this browser right now.'
              }
            />
          </div>
        </div>
      </aside>

      <section className="flex h-[72vh] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm lg:h-[78vh]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ask UI Guide</h2>
            <p className="text-xs text-slate-500">
              Verified answers with citations when available.
            </p>
          </div>
          {currentChat && (
            <span className="text-xs font-semibold text-slate-500">
              {currentChat.messages.length} messages
            </span>
          )}
        </div>

        <div
          ref={messagesContainerRef}
          className="mt-6 flex-1 space-y-4 overflow-y-auto pr-2 min-h-0"
        >
          {currentChat?.messages.map((message, index) => {
            const messageId = message.createdAt || `${message.role}-${index}`

            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                    message.role === 'user'
                      ? 'border-[var(--ui-brand)] bg-[var(--ui-brand)] text-white'
                      : message.isError
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-slate-100 bg-white text-slate-700'
                  }`}
                >
                  {message.role === 'assistant' && message.isError ? (
                    <div className="space-y-2">
                      <p className="font-semibold">We hit a snag.</p>
                      <p className="text-xs">{message.content}</p>
                      {(message.details || message.traceId) && (
                        <details className="rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-xs">
                          <summary className="cursor-pointer font-semibold text-rose-700">
                            Technical details
                          </summary>
                          {message.traceId && <p>Trace ID: {message.traceId}</p>}
                          {message.details && (
                            <pre className="mt-2 whitespace-pre-wrap">{message.details}</pre>
                          )}
                        </details>
                      )}
                    </div>
                  ) : message.role === 'assistant' ? (
                    <MarkdownContent>{message.content}</MarkdownContent>
                  ) : (
                    <p>{message.content}</p>
                  )}

                  {message.role === 'assistant' && message.sources?.length > 0 && (
                    <details className="group mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                      <summary className="flex cursor-pointer items-center justify-between gap-2 font-semibold text-slate-700">
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3" />
                          Sources ({message.sources.length})
                        </span>
                        <span className="flex items-center gap-1 text-[0.65rem] font-semibold text-slate-400">
                          <ChevronDown className="h-4 w-4 group-open:hidden" />
                          <ChevronUp className="h-4 w-4 hidden group-open:block" />
                        </span>
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {message.sources.map((source, sourceIndex) => (
                          <li key={`${source.document}-${sourceIndex}`}>
                            {source.document || 'UI document'} - Page {source.page || 'N/A'}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {message.role === 'assistant' && !message.isError && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(message.content)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700"
                      >
                        <Copy className="h-3 w-3" />
                        Copy response
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePlayback({ id: messageId, text: message.content })}
                        disabled={!playbackSupported && !capabilitiesLoading}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        {speakingId === messageId ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                        {speakingId === messageId ? 'Stop reading' : 'Read aloud'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                UI Guide is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-6 space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about admissions, policies, courses, or services..."
              aria-label="Message UI Guide"
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-[var(--ui-brand)]"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() =>
                toggleListening({
                  id: 'chat-input',
                  initialText: input,
                  onTranscript: setInput,
                })
              }
              disabled={isLoading || isTranscribing || (!dictationSupported && !capabilitiesLoading)}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow ${
                isListening && listeningTarget === 'chat-input'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]'
              } disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300`}
            >
              {isListening && listeningTarget === 'chat-input' ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              {isTranscribing && transcribingTarget === 'chat-input'
                ? 'Transcribing...'
                : isListening && listeningTarget === 'chat-input'
                  ? 'Stop mic'
                  : speechRecognitionSupported
                    ? 'Speak'
                    : capabilitiesLoading
                      ? 'Checking...'
                      : 'Record'}
            </button>
            {isLoading ? (
              <button
                type="button"
                onClick={handleCancelRequest}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow hover:border-rose-300"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--ui-brand)] px-4 py-3 text-sm font-semibold text-white shadow hover:bg-[var(--ui-brand-strong)] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            )}
          </form>
          {isListening && listeningTarget === 'chat-input' && (
            <VoiceStatus
              mode={dictationMode === 'recording' ? 'recording' : 'listening'}
              title={dictationMode === 'recording' ? 'Recording your voice' : 'Listening live'}
              description={
                dictationMode === 'recording'
                  ? 'Speak naturally, then tap the button again when you want us to transcribe.'
                  : 'Keep speaking. UI Guide will keep the mic active even if you pause briefly.'
              }
            />
          )}
          {isTranscribing && transcribingTarget === 'chat-input' && (
            <VoiceStatus
              mode="transcribing"
              title="Turning speech into text"
              description="Hold on while we transcribe your latest recording."
            />
          )}
          <p className="text-xs text-slate-500">
            Use the mic to dictate questions. Voice mode auto-speaks fresh answers, and if live
            dictation is unavailable UI Guide records first and transcribes after you stop.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Chat
