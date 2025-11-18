'use client'

import { useState } from 'react'
import { AlertIcon, CheckIcon, DownloadIcon, RefreshIcon, SoundIcon } from './icons'

interface Props {
  theme: 'dark' | 'paper'
}

export default function TTSPlayground({ theme }: Props) {
  const [text, setText] = useState('こんにちは、世界！Hello world!')
  const [voice, setVoice] = useState('ja-JP-NanamiNeural')
  const [rate, setRate] = useState('+0%')
  const [volume, setVolume] = useState('+0%')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')

  const voices = [
    { value: 'ja-JP-NanamiNeural', label: 'Japanese - Nanami (Female)' },
    { value: 'ja-JP-KeitaNeural', label: 'Japanese - Keita (Male)' },
    { value: 'en-US-JennyNeural', label: 'English US - Jenny (Female)' },
    { value: 'en-US-GuyNeural', label: 'English US - Guy (Male)' },
    { value: 'en-GB-SoniaNeural', label: 'English UK - Sonia (Female)' },
    { value: 'es-ES-ElviraNeural', label: 'Spanish - Elvira (Female)' },
  ]

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('selfmind_api_key')
    if (!apiKey) {
      setError('Please set your API key first!')
      return
    }

    setLoading(true)
    setError('')
    setResponse('')
    setAudioUrl(null)

    try {
      const res = await fetch('/api/proxy/tts/api/speak', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          rate,
          volume,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setResponse(`Audio generated successfully • ${(blob.size / 1024).toFixed(2)} KB`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isPaper = theme === 'paper'
  const heroCard = isPaper
    ? 'rounded-2xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-white p-5 shadow-sm'
    : 'rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-blue-600/10 to-indigo-600/10 p-5 shadow-inner shadow-sky-900/20'
  const inputClass = isPaper
    ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200'
    : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white shadow-inner shadow-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60'
  const labelText = isPaper ? 'text-slate-800' : 'text-slate-100'
  const bodyText = isPaper ? 'text-slate-700' : 'text-slate-200'
  const buttonPrimary = isPaper
    ? 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200/60 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5 hover:shadow-blue-900/60 disabled:cursor-not-allowed disabled:opacity-50'
  const statusError = isPaper
    ? 'flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
    : 'flex items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'
  const statusSuccess = isPaper
    ? 'flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
    : 'flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'
  const mediaCard = isPaper
    ? 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
    : 'rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-slate-900/50'

  return (
    <div className={`space-y-6 ${isPaper ? 'text-slate-900' : 'text-slate-100'}`}>
      <div className={heroCard}>
        <div className="flex items-center gap-3">
          <div
            className={
              isPaper
                ? 'rounded-2xl border border-sky-100 bg-white p-3 shadow-sm'
                : 'rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/5'
            }
          >
            <SoundIcon className={isPaper ? 'text-sky-600' : 'text-sky-200'} size={22} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isPaper ? 'text-slate-900' : 'text-white'}`}>Text-to-Speech</h3>
            <p className={`text-sm ${bodyText}`}>
              Convert text to speech with Microsoft Edge neural voices (400+ voices in 100+ languages).
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Text to speak</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className={`${inputClass} shadow-inner`}
            placeholder="Enter text to convert to speech..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className={inputClass}
            >
              {voices.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Rate</label>
            <input
              type="text"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={inputClass}
              placeholder="+0%"
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Volume</label>
            <input
              type="text"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={inputClass}
              placeholder="+0%"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !text}
          className={buttonPrimary}
        >
          {loading ? <RefreshIcon className="animate-spin" size={18} /> : <SoundIcon size={18} />}
          {loading ? 'Generating audio...' : 'Generate Speech'}
        </button>
      </div>

      {error && (
        <div className={statusError}>
          <AlertIcon size={18} />
          <div>
            <p className={`font-semibold ${isPaper ? 'text-red-800' : 'text-red-100'}`}>Request failed</p>
            <p className={isPaper ? 'text-red-700' : 'text-red-200'}>{error}</p>
          </div>
        </div>
      )}

      {response && (
        <div className={statusSuccess}>
          <CheckIcon size={18} />
          <p>{response}</p>
        </div>
      )}

      {audioUrl && (
        <div className={mediaCard}>
          <div
            className={`mb-3 flex items-center justify-between text-sm font-semibold ${
              isPaper ? 'text-slate-900' : 'text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <SoundIcon size={18} className={isPaper ? 'text-sky-600' : 'text-sky-300'} />
              Generated Audio
            </div>
            <a
              href={audioUrl}
              download="speech.mp3"
              className={
                isPaper
                  ? 'inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:-translate-y-0.5'
                  : 'inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:-translate-y-0.5'
              }
            >
              <DownloadIcon size={16} />
              Download MP3
            </a>
          </div>
          <audio
            controls
            src={audioUrl}
            className={
              isPaper
                ? 'w-full rounded-lg border border-slate-200 bg-slate-50'
                : 'w-full rounded-lg border border-slate-800 bg-slate-950/60'
            }
          />
        </div>
      )}
    </div>
  )
}
