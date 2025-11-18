'use client'

import { useState } from 'react'
import { AlertIcon, CheckIcon, MicIcon, RefreshIcon } from './icons'

interface Props {
  theme: 'dark' | 'paper'
}

interface TranscriptionResult {
  text: string
  language: string
  duration: number
  segments?: Array<{
    start: number
    end: number
    text: string
    confidence: number
  }>
}

export default function WhisperPlayground({ theme }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  const handleTranscribe = async () => {
    if (!file) {
      setError('Please select an audio file first!')
      return
    }

    const apiKey = localStorage.getItem('selfmind_api_key')
    if (!apiKey) {
      setError('Please set your API key first!')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('audio', file)
      formData.append('language', language)
      formData.append('format', 'json')

      const res = await fetch('/api/proxy/whisper/api/transcribe', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${theme === 'paper' ? 'text-slate-900' : 'text-slate-100'}`}>
      <div
        className={
          theme === 'paper'
            ? 'rounded-2xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-white p-5 shadow-sm'
            : 'rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-slate-950/60 to-blue-600/10 p-5 shadow-inner shadow-sky-900/25'
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={
              theme === 'paper'
                ? 'rounded-2xl border border-sky-100 bg-white p-3 shadow-sm'
                : 'rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/5'
            }
          >
            <MicIcon className={theme === 'paper' ? 'text-sky-600' : 'text-sky-200'} size={22} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'paper' ? 'text-slate-900' : 'text-white'}`}>
              Speech-to-Text
            </h3>
            <p className={`text-sm ${theme === 'paper' ? 'text-slate-700' : 'text-slate-200'}`}>
              Transcribe audio files using Whisper. Supports MP3, WAV, M4A, and more.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`mb-2 block text-sm font-semibold ${theme === 'paper' ? 'text-slate-800' : 'text-slate-100'}`}>
            Audio File (Max 25 MB)
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className={
              theme === 'paper'
                ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm file:mr-4 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200'
                : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60'
            }
          />
          {file && (
            <p className={`mt-2 text-sm ${theme === 'paper' ? 'text-slate-600' : 'text-slate-300'}`}>
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label className={`mb-2 block text-sm font-semibold ${theme === 'paper' ? 'text-slate-800' : 'text-slate-100'}`}>
            Language (optional)
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={
              theme === 'paper'
                ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200'
                : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60'
            }
          >
            <option value="auto">Auto-detect</option>
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ko">Korean</option>
          </select>
        </div>

        <button
          onClick={handleTranscribe}
          disabled={loading || !file}
          className={
            theme === 'paper'
              ? 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
              : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5 hover:shadow-blue-900/60 disabled:cursor-not-allowed disabled:opacity-50'
          }
        >
          {loading ? <RefreshIcon className="animate-spin" size={18} /> : <MicIcon size={18} />}
          {loading ? 'Transcribing...' : 'Transcribe Audio'}
        </button>
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

      {result && (
        <div className="space-y-4">
          <div
            className={
              theme === 'paper'
                ? 'rounded-xl border border-emerald-200 bg-emerald-50 p-4'
                : 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4'
            }
          >
            <p
              className={`mb-2 flex items-center gap-2 text-sm font-semibold ${
                theme === 'paper' ? 'text-emerald-800' : 'text-emerald-50'
              }`}
            >
              <CheckIcon size={18} />
              Transcription Complete
            </p>
            <div className={`space-y-1 text-sm ${theme === 'paper' ? 'text-emerald-800' : 'text-emerald-100'}`}>
              <p>
                Language: <strong>{result.language}</strong>
              </p>
              <p>
                Duration: <strong>{result.duration?.toFixed(2)}s</strong>
              </p>
            </div>
          </div>

          <div
            className={
              theme === 'paper'
                ? 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                : 'rounded-2xl border border-slate-800 bg-slate-900/70 p-4'
            }
          >
            <h4
              className={`mb-3 flex items-center gap-2 text-sm font-semibold ${
                theme === 'paper' ? 'text-slate-900' : 'text-white'
              }`}
            >
              <MicIcon size={16} className={theme === 'paper' ? 'text-sky-600' : 'text-sky-300'} />
              Transcript
            </h4>
            <p className={`whitespace-pre-wrap leading-relaxed ${theme === 'paper' ? 'text-slate-800' : 'text-slate-200'}`}>
              {result.text}
            </p>
          </div>

          {result.segments && result.segments.length > 0 && (
            <div
              className={
                theme === 'paper'
                  ? 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                  : 'rounded-2xl border border-slate-800 bg-slate-900/70 p-4'
              }
            >
              <h4
                className={`mb-3 flex items-center gap-2 text-sm font-semibold ${
                  theme === 'paper' ? 'text-slate-900' : 'text-white'
                }`}
              >
                <RefreshIcon size={16} />
                Timestamps
              </h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {result.segments.map((segment, i) => (
                  <div
                    key={i}
                    className={`border-l-2 pl-3 py-1 text-sm ${
                      theme === 'paper' ? 'border-sky-200' : 'border-sky-400/70'
                    }`}
                  >
                    <span className={`font-mono ${theme === 'paper' ? 'text-slate-500' : 'text-slate-400'}`}>
                      [{segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s]
                    </span>
                    <p className={theme === 'paper' ? 'text-slate-800' : 'text-slate-200'}>{segment.text}</p>
                    <span className={`text-xs ${theme === 'paper' ? 'text-slate-500' : 'text-slate-500'}`}>
                      Confidence: {(segment.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
