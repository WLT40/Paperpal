import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { api } from '../../api/client'

// Global cache: preserve chat history per paper across tab switches
const chatCache = new Map()

export default function ChatPanel({ paperId }) {
  const cached = chatCache.get(paperId) || []
  const [messages, setMessages] = useState(cached)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  // Sync to cache whenever messages change
  useEffect(() => {
    chatCache.set(paperId, messages)
  }, [messages, paperId])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const userMsg = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setStreaming('')

    try {
      const token = api.getToken()
      const resp = await fetch(`http://localhost:8000/api/papers/${paperId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.detail || '请求失败')
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ ' + e.message }])
    } finally { setLoading(false); setStreaming('') }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-semibold text-gray-700">💬 AI 对话</span>
        <span className="text-xs text-gray-400 ml-2">基于当前文献内容提问</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-8">
            向 AI 提问关于这篇论文的问题<br/>如："这篇论文的主要结论是什么？"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500">{streaming}</div>
          </div>
        )}
        {loading && !streaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin inline mr-1" />AI 思考中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-gray-100 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="问 AI 关于这篇论文的问题..."
          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50">
          <Send size={12} />
        </button>
      </div>
    </div>
  )
}
