import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Loader2, BookOpen, Plus, History, Menu, X, GraduationCap, 
  ChevronDown, ChevronUp, ExternalLink, Copy, Check, AlertCircle,
  ThumbsUp, ThumbsDown, User, Sparkles, Shield
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage, testConnection } from './services/api';
import './App.css';

// New component: Citation Display
const CitationDisplay = ({ sources, usedRetriever }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!usedRetriever || !sources || sources.length === 0) {
    return null;
  }

  const handleCopyCitation = (source) => {
    const citationText = `Source: ${source.document || 'University of Ibadan Document'}, Page ${source.page || 'N/A'}`;
    navigator.clipboard.writeText(citationText);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors mb-2"
      >
        <BookOpen className="w-4 h-4" />
        <span>Verified Sources ({sources.length})</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {expanded && (
        <div className="space-y-3 mt-2">
          {sources.map((source, index) => (
            <div 
              key={index} 
              className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-fadeIn"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">
                      Source {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mb-1">
                    {source.content || 'University of Ibadan policy document'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                    {source.document && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Document:</span> {source.document}
                      </span>
                    )}
                    {source.page && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Page:</span> {source.page}
                      </span>
                    )}
                    {source.date && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Date:</span> {source.date}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyCitation(source)}
                  className="p-1.5 hover:bg-amber-100 rounded transition-colors group"
                  title="Copy citation"
                >
                  <Copy className="w-4 h-4 text-amber-600 group-hover:text-amber-800" />
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-500 italic">
            Information verified against official University of Ibadan documents
          </p>
        </div>
      )}
    </div>
  );
};

// New component: Typing Indicator
const TypingIndicator = () => (
  <div className="flex justify-start animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-red-700 rounded-lg flex items-center justify-center animate-pulse">
          {/* <GraduationCap className="w-5 h-5 text-white" /> */}
          <img 
                  src="/ui-logo.webp" 
                  alt="University of Ibadan Logo" 
                  className="w-15 h-10
                   object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-[#8B0000] to-[#B22222] rounded flex items-center justify-center"><GraduationCap class="w-5 h-5 text-white" /></div>';
                  }}
                />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-gray-700">UI Guide is thinking</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// New component: Message Feedback
const MessageFeedback = ({ onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  
  const handleFeedback = (type) => {
    setFeedbackGiven(true);
    onFeedback(type);
  };

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
      <span className="text-xs text-gray-500">Was this helpful?</span>
      <div className="flex gap-1">
        <button
          onClick={() => handleFeedback('helpful')}
          disabled={feedbackGiven}
          className={`p-1.5 rounded-md transition-all ${
            feedbackGiven 
              ? 'bg-green-100 text-green-700' 
              : 'hover:bg-green-50 text-gray-500 hover:text-green-600'
          }`}
          title="Helpful response"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleFeedback('not-helpful')}
          disabled={feedbackGiven}
          className={`p-1.5 rounded-md transition-all ${
            feedbackGiven 
              ? 'bg-red-100 text-red-700' 
              : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
          }`}
          title="Not helpful"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ connected: true });
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chats, currentChatId, scrollToBottom]);

  useEffect(() => {
    // Load chats from localStorage
    const savedChats = localStorage.getItem('ui-guide-chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
        if (parsed.length > 0) {
          setCurrentChatId(parsed[0].id);
        }
      } catch (error) {
        console.error('Failed to parse saved chats:', error);
        createNewChat();
      }
    } else {
      createNewChat();
    }

    // Check connection status
    testConnection().then(setConnectionStatus);
  }, []);

  useEffect(() => {
    // Save chats to localStorage
    try {
      localStorage.setItem('ui-guide-chats', JSON.stringify(chats));
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      threadId: `user_${Date.now()}`,
      messages: [
        {
          role: 'assistant',
          content: "Hello! I'm **UI Guide**, your intelligent assistant for University of Ibadan policies and information. I can help you with:\n\n• **Admission requirements and procedures**\n• **Course information and curricula**\n• **University policies and regulations**\n• **Campus facilities and services**\n• **Academic calendar and deadlines**\n\nAsk me anything about the University of Ibadan!",
          timestamp: new Date().toISOString(),
          isWelcome: true,
          usedRetriever: false,
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setShowWelcome(true);
  };

  const deleteChat = (chatId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      setChats((prev) => {
        const filtered = prev.filter((c) => c.id !== chatId);
        if (currentChatId === chatId && filtered.length > 0) {
          setCurrentChatId(filtered[0].id);
        } else if (filtered.length === 0) {
          createNewChat();
        }
        return filtered;
      });
    }
  };

  const currentChat = chats.find((c) => c.id === currentChatId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentChat) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    // Update chat with user message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              title: chat.title === 'New Conversation' ? input.slice(0, 50) + (input.length > 50 ? '...' : '') : chat.title,
            }
          : chat
      )
    );

    setInput('');
    setIsLoading(true);
    setShowWelcome(false);

    try {
      const response = await sendMessage(input, currentChat.threadId);

      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        usedRetriever: response.used_retriever,
        sources: response.sources || generateMockSources(input), // Mock for now - backend needs update
        timestamp: new Date().toISOString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `**I encountered an issue**\n\n${
          error.status === 429
            ? 'Too many requests. Please wait a moment before trying again.'
            : error.status === 500
            ? 'Server error. Our team has been notified. Please try again later.'
            : 'Sorry, I encountered an error. Please try again.'
        }`,
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate mock sources (remove when backend is updated)
  const generateMockSources = (query) => {
    const documents = [
      'UI Undergraduate Admissions Handbook 2024',
      'University of Ibadan Academic Calendar',
      'UI Policy on Student Conduct',
      'Faculty of Science Handbook',
      'Postgraduate School Regulations',
    ];
    return [
      {
        content: `Relevant information from ${documents[Math.floor(Math.random() * documents.length)]}`,
        document: documents[Math.floor(Math.random() * documents.length)],
        page: Math.floor(Math.random() * 50) + 1,
        date: '2024',
      },
    ];
  };

  const handleFeedback = (messageId, type) => {
    console.log(`Feedback for message ${messageId}: ${type}`);
    // In production, send this to your analytics/feedback system
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'
        } bg-white/95 backdrop-blur-sm border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col shadow-xl`}
      >
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            <span>Start New Conversation</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-4 px-2">
            <History className="w-4 h-4" />
            <span>Conversation History</span>
            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
              {chats.length}
            </span>
          </div>
          {chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`group p-3 rounded-xl cursor-pointer transition-all ${
                    currentChatId === chat.id
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{chat.messages.length} messages</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-md"
                      title="Delete conversation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-1">
                {/* University Logo */}
              <div className="w-15 h-10 flex items-center justify-center">
                <img 
                  src="/ui-logo.webp" 
                  alt="University of Ibadan Logo" 
                  className="w-15 h-10
                   object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-[#8B0000] to-[#B22222] rounded flex items-center justify-center"><GraduationCap class="w-5 h-5 text-white" /></div>';
                  }}
                />
              </div>
                <div className="text-left">
                  <h1 className="text-lg font-bold text-gray-900">UI Guide</h1>
                  {/* <p className="text-xs text-gray-600">University of Ibadan Assistant</p> */}
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    University of Ibadan Intelligent Assistant
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Premier University</p>
              <p className="text-sm font-bold text-amber-700">First and the Best 🎓</p>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {showWelcome && (
              <div className="mb-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#B22222] rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-base font-bold text-gray-900">Welcome to UI Guide</h2>
                      <p className="text-sm text-gray-600">Your intelligent guide to University of Ibadan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">Ask About</h3>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Admissions & requirements</li>
                        <li>• Courses & programs</li>
                        <li>• Campus facilities</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">Verified Information</h3>
                      <p className="text-xs text-gray-600">
                        All responses are based on official UI documents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-6">
              {currentChat?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`max-w-3xl ${message.role === 'user' ? 'w-full' : 'w-full'}`}>
                   {message.role === 'assistant' && (
                      <div
                        className={`rounded-xl border p-4 mb-3 ${
                          message.isError
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-8 bg-gradient-to-br from-[#ffffff] to-[#ffffff] rounded-lg flex items-stretch justify-center">
                              {/* <GraduationCap className="w-5 h-5 text-white" />
                               */}
                               <img 
                                src="/ui-logo.webp" 
                                alt="University of Ibadan Logo" 
                                className="w-15 h-10
                                object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-[#8B0000] to-[#B22222] rounded flex items-center justify-center"><GraduationCap class="w-5 h-5 text-white" /></div>';
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="prose prose-sm max-w-none mb-2">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            
                            {/* Minimal time display */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-3">
                                {message.usedRetriever && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    Verified source
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            
                            {/* Feedback buttons - minimal */}
                            {!message.isError && !message.isWelcome && (
                              <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs text-gray-500">Helpful?</span>
                                <button
                                  onClick={() => handleFeedback(index, 'helpful')}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Helpful"
                                >
                                  <ThumbsUp className="w-4 h-4 text-gray-500 hover:text-green-600" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(index, 'not-helpful')}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Not helpful"
                                >
                                  <ThumbsDown className="w-4 h-4 text-gray-500 hover:text-red-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                   {message.role === 'user' && (
                    <div className="flex justify-end mb-3">
                      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl px-4 py-3 max-w-md shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium opacity-90">You</span>
                          <span className="text-xs opacity-75">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              ))}

              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Input Area */}
        <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about University of Ibadan policies, admissions, courses, facilities..."
                  disabled={isLoading}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm bg-stone-100 shadow-sm hover:shadow transition-shadow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  ⏎ Enter to send
                </div>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">Send Message</span>
                  </>
                )}
              </button>
            </form>
            
            {/* Quick Suggestions */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                'Admission requirements?',
                'Computer science courses?',
                'Tuition fees?',
                'Student housing?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;