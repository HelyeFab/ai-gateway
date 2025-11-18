'use client'

import { useState } from 'react'
import {
  AlertIcon,
  ChatBubbleIcon,
  RefreshIcon,
  RobotIcon,
  SendIcon,
  TrashIcon,
  UserIcon,
} from './icons'

interface Props {
  theme: 'dark' | 'paper'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface GenerateResult {
  model: string
  response: string
  done: boolean
  total_duration?: number
  eval_count?: number
}

export default function ChatPlayground({ theme }: Props) {
  const [model, setModel] = useState('qwen2.5:7b')
  const [prompt, setPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(500)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streamMode, setStreamMode] = useState(false)

  const handleSend = async () => {
    if (!prompt.trim()) return

    const apiKey = localStorage.getItem('selfmind_api_key')
    if (!apiKey) {
      setError('Please set your API key first!')
      return
    }

    const userMessage: Message = { role: 'user', content: prompt }
    setMessages((prev) => [...prev, userMessage])
    setPrompt('')
    setLoading(true)
    setError('')

    try {
      if (streamMode) {
        // Streaming mode
        const res = await fetch('/api/proxy/chat/api/generate', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt: userMessage.content,
            stream: true,
            options: {
              temperature,
              num_predict: maxTokens,
            },
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter((line) => line.trim())

            for (const line of lines) {
              try {
                const data = JSON.parse(line)
                if (data.response) {
                  fullResponse += data.response
                  // Update the last message in real-time
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                      newMessages[newMessages.length - 1].content = fullResponse
                    } else {
                      newMessages.push({ role: 'assistant', content: fullResponse })
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        // Non-streaming mode
        const res = await fetch('/api/proxy/chat/api/generate', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt: userMessage.content,
            stream: false,
            options: {
              temperature,
              num_predict: maxTokens,
            },
          }),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: res.statusText }))
          throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`)
        }

        const data: GenerateResult = await res.json()
        const assistantMessage: Message = { role: 'assistant', content: data.response }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (err: any) {
      setError(err.message)
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (confirm('Clear conversation history?')) {
      setMessages([])
      setError('')
    }
  }

  return (
    <div className={`space-y-6 ${theme === 'paper' ? 'text-slate-900' : 'text-slate-100'}`}>
      <div
        className={
          theme === 'paper'
            ? 'rounded-2xl border border-blue-100 bg-gradient-to-r from-white via-blue-50 to-white p-5 shadow-sm'
            : 'rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-slate-950/60 to-sky-500/10 p-5 shadow-inner shadow-blue-900/25'
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={
              theme === 'paper'
                ? 'rounded-2xl border border-blue-100 bg-white p-3 shadow-sm'
                : 'rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/5'
            }
          >
            <ChatBubbleIcon className={theme === 'paper' ? 'text-blue-600' : 'text-blue-200'} size={22} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'paper' ? 'text-slate-900' : 'text-white'}`}>
              Chat / LLM (Ollama)
            </h3>
            <p className={`text-sm ${theme === 'paper' ? 'text-slate-700' : 'text-slate-200'}`}>
              Generate text with Qwen2.5:7b or Qwen3-VL:8b. Tweak sampling and stream responses inline.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={`mb-2 block text-sm font-semibold ${theme === 'paper' ? 'text-slate-800' : 'text-slate-100'}`}>
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={
              theme === 'paper'
                ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200'
                : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60'
            }
          >
            <option value="qwen2.5:7b">Qwen2.5:7b (Text)</option>
            <option value="qwen3-vl:8b">Qwen3-VL:8b (Vision)</option>
          </select>
        </div>

        <div>
          <label className={`mb-2 block text-sm font-semibold ${theme === 'paper' ? 'text-slate-800' : 'text-slate-100'}`}>
            Temperature
          </label>
          <input
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            min="0"
            max="2"
            step="0.1"
            className={
              theme === 'paper'
                ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200'
                : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60'
            }
          />
        </div>

        <div>
          <label className={`mb-2 block text-sm font-semibold ${theme === 'paper' ? 'text-slate-800' : 'text-slate-100'}`}>
            Max Tokens
          </label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            min="50"
            max="2048"
            step="50"
            className={
              theme === 'paper'
                ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200'
                : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60'
            }
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setStreamMode(!streamMode)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              streamMode
                ? theme === 'paper'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-blue-400/60 bg-blue-500/10 text-blue-100'
                : theme === 'paper'
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-slate-900'
                  : 'border-slate-800 bg-slate-900/70 text-slate-200 hover:border-blue-400/40 hover:text-white'
            }`}
          >
            <RefreshIcon size={16} />
            {streamMode ? 'Streaming Enabled' : 'Enable Streaming'}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className={`min-h-[400px] max-h-[520px] overflow-y-auto rounded-2xl border p-4 ${
          theme === 'paper'
            ? 'border-slate-200 bg-white shadow-sm'
            : 'border-slate-800 bg-slate-900/70 shadow-inner shadow-slate-900/40'
        }`}
      >
        {messages.length === 0 ? (
          <div
            className={`flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center ${
              theme === 'paper'
                ? 'border-slate-200 bg-slate-50 text-slate-500'
                : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}
          >
            <ChatBubbleIcon size={28} className={theme === 'paper' ? 'text-slate-400' : 'text-slate-500'} />
            <p className={`text-lg font-semibold ${theme === 'paper' ? 'text-slate-800' : 'text-slate-200'}`}>
              Start a conversation
            </p>
            <p className={`text-sm ${theme === 'paper' ? 'text-slate-500' : 'text-slate-400'}`}>
              Ask a question or give a prompt below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow ${
                    msg.role === 'user'
                      ? theme === 'paper'
                        ? 'bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg shadow-sky-200/60'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/40'
                      : theme === 'paper'
                        ? 'bg-slate-100 text-slate-900 shadow-sm'
                        : 'bg-slate-800/80 text-slate-100 shadow-slate-900/40'
                  }`}
                >
                  <p
                    className={`mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
                      msg.role === 'assistant' && theme === 'paper' ? 'text-slate-700' : 'text-slate-200'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <>
                        <UserIcon size={14} />
                        You
                      </>
                    ) : (
                      <>
                        <RobotIcon size={14} />
                        Assistant
                      </>
                    )}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          className={
            theme === 'paper'
              ? 'flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
              : 'flex items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'
          }
        >
          <AlertIcon size={18} />
          <div>
            <p className={`font-semibold ${theme === 'paper' ? 'text-red-800' : 'text-red-100'}`}>Request failed</p>
            <p className={theme === 'paper' ? 'text-red-700' : 'text-red-200'}>{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
          placeholder="Type your message..."
          disabled={loading}
          className={
            theme === 'paper'
              ? 'flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100'
              : 'flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:bg-slate-900/40'
          }
        />
        <button
          onClick={handleSend}
          disabled={loading || !prompt.trim()}
          className={
            theme === 'paper'
              ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200/60 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
              : 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5 hover:shadow-blue-900/60 disabled:cursor-not-allowed disabled:opacity-50'
          }
        >
          {loading ? <RefreshIcon className="animate-spin" size={18} /> : <SendIcon size={18} />}
          {loading ? 'Sending...' : 'Send'}
        </button>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={loading}
            className={
              theme === 'paper'
                ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5'
                : 'inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:-translate-y-0.5'
            }
          >
            <TrashIcon size={16} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
