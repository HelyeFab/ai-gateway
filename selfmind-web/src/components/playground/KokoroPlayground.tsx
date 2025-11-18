'use client'

import { useState } from 'react'
import { AlertIcon, CheckIcon, MicIcon, RefreshIcon } from './icons'

interface Props {
  theme: 'dark' | 'paper'
}

export default function KokoroPlayground({ theme }: Props) {
  const [text, setText] = useState('こんにちは、世界！')
  const [voice, setVoice] = useState('jf_alpha')
  const [speed, setSpeed] = useState(1.0)
  const [format, setFormat] = useState('mp3')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')

  const voices = [
    { value: 'jf_alpha', label: 'Japanese Female - Alpha' },
    { value: 'jf_gongitsune', label: 'Japanese Female - Gongitsune' },
    { value: 'jf_nezumi', label: 'Japanese Female - Nezumi' },
    { value: 'jf_tebukuro', label: 'Japanese Female - Tebukuro' },
    { value: 'jm_kumo', label: 'Japanese Male - Kumo' },
    { value: 'zf_xiaobei', label: 'Chinese Female - Xiaobei' },
    { value: 'zf_xiaoni', label: 'Chinese Female - Xiaoni' },
    { value: 'zf_xiaoxiao', label: 'Chinese Female - Xiaoxiao' },
    { value: 'zf_xiaoyi', label: 'Chinese Female - Xiaoyi' },
    { value: 'zm_yunjian', label: 'Chinese Male - Yunjian' },
    { value: 'zm_yunxi', label: 'Chinese Male - Yunxi' },
    { value: 'zm_yunxia', label: 'Chinese Male - Yunxia' },
    { value: 'zm_yunyang', label: 'Chinese Male - Yunyang' },
    { value: 'af_bella', label: 'English (US) Female - Bella' },
    { value: 'af_sarah', label: 'English (US) Female - Sarah' },
    { value: 'af_nicole', label: 'English (US) Female - Nicole' },
    { value: 'am_adam', label: 'English (US) Male - Adam' },
    { value: 'am_michael', label: 'English (US) Male - Michael' },
    { value: 'bf_emma', label: 'English (UK) Female - Emma' },
    { value: 'bm_george', label: 'English (UK) Male - George' },
  ]

  const formats = [
    { value: 'mp3', label: 'MP3' },
    { value: 'wav', label: 'WAV' },
    { value: 'opus', label: 'Opus' },
    { value: 'flac', label: 'FLAC' },
  ]

  const exampleTexts = [
    { lang: 'Japanese', text: 'こんにちは、世界！Kokoroの音声合成です。' },
    { lang: 'Chinese', text: '你好世界！这是Kokoro语音合成。' },
    { lang: 'English', text: 'Hello! This is Kokoro, a high-quality neural text-to-speech system.' },
    { lang: 'Long JP', text: '今日は良い天気ですね。公園を散歩しましょう。' },
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
      const res = await fetch('/api/proxy/kokoro/v1/audio/speech', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'kokoro',
          input: text,
          voice: voice,
          response_format: format,
          speed: speed,
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
    ? 'rounded-2xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50 to-white p-5 shadow-sm'
    : 'rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-600/10 via-slate-950/50 to-purple-600/10 p-5 shadow-inner shadow-indigo-900/25'
  const chip = isPaper
    ? 'ml-auto rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200'
    : 'ml-auto rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-400/40'
  const textSecondary = isPaper ? 'text-slate-700' : 'text-slate-200'
  const labelText = isPaper ? 'text-slate-800' : 'text-slate-100'
  const inputClass = isPaper
    ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
    : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60'
  const buttonPrimary = isPaper
    ? 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/60 transition hover:-translate-y-0.5'
    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 hover:shadow-indigo-900/60 disabled:cursor-not-allowed disabled:opacity-50'
  const pill = isPaper
    ? 'text-xs rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700'
    : 'text-xs rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-1 text-slate-200 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white'
  const statusError = isPaper
    ? 'flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
    : 'flex items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'
  const statusSuccess = isPaper
    ? 'flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
    : 'flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'
  const mediaCard = isPaper
    ? 'rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm'
    : 'rounded-2xl border border-indigo-500/30 bg-slate-950/70 p-5 shadow-inner shadow-indigo-900/25'
  const perfCard = isPaper
    ? 'rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm'
    : 'rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm shadow-inner shadow-slate-900/40'
  const perfItem = isPaper
    ? 'flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'
    : 'flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2'

  return (
    <div className={`space-y-6 ${isPaper ? 'text-slate-900' : 'text-slate-100'}`}>
      <div className={heroCard}>
        <div className="flex items-center gap-3">
          <div
            className={
              isPaper
                ? 'rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm'
                : 'rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/5'
            }
          >
            <MicIcon className={isPaper ? 'text-indigo-600' : 'text-indigo-200'} size={22} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isPaper ? 'text-slate-900' : 'text-white'}`}>Kokoro Neural TTS</h3>
            <p className={`text-sm ${textSecondary}`}>
              High-quality neural text-to-speech with CPU-first performance and multi-language voice packs.
            </p>
          </div>
          <span className={chip}>CPU optimized</span>
        </div>

        <div
          className={`mt-3 grid gap-2 text-xs md:grid-cols-2 ${
            isPaper ? 'text-indigo-800' : 'text-indigo-100'
          }`}
        >
          <div
            className={
              isPaper
                ? 'rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2'
                : 'rounded-lg border border-white/5 bg-white/5 px-3 py-2'
            }
          >
            Ultra-fast CPU inference (&lt;0.3s)
          </div>
          <div
            className={
              isPaper
                ? 'rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2'
                : 'rounded-lg border border-white/5 bg-white/5 px-3 py-2'
            }
          >
            OpenAI-compatible API
          </div>
          <div
            className={
              isPaper
                ? 'rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2'
                : 'rounded-lg border border-white/5 bg-white/5 px-3 py-2'
            }
          >
            Multiple voice packs
          </div>
          <div
            className={
              isPaper
                ? 'rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2'
                : 'rounded-lg border border-white/5 bg-white/5 px-3 py-2'
            }
          >
            High-fidelity output
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className={`mb-2 block text-sm font-semibold ${labelText}`}>
            Text to speak
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className={`${inputClass} font-mono shadow-inner`}
            placeholder="Enter text to convert to speech..."
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`text-xs ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>Quick examples:</span>
            {exampleTexts.map((example) => (
              <button
                key={example.lang}
                onClick={() => setText(example.text)}
                className={pill}
              >
                {example.lang}
              </button>
            ))}
          </div>
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
            <label className={`mb-2 block text-sm font-semibold ${labelText}`}>
              Speed
              <span className={`ml-2 text-xs ${isPaper ? 'text-slate-500' : 'text-gray-500'}`}>{speed.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className={`mt-1 flex justify-between text-xs ${isPaper ? 'text-slate-500' : 'text-gray-500'}`}>
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={inputClass}
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !text}
          className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {loading ? <RefreshIcon className="animate-spin" size={18} /> : <MicIcon size={18} />}
          {loading ? 'Generating with Kokoro...' : 'Generate Speech'}
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
          <div>
            <p className={`font-semibold ${isPaper ? 'text-emerald-800' : 'text-emerald-50'}`}>Audio generated</p>
            <p className={isPaper ? 'text-emerald-700' : 'text-emerald-100'}>{response}</p>
          </div>
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
              <MicIcon size={18} className={isPaper ? 'text-indigo-600' : 'text-indigo-300'} />
              Generated Audio (Kokoro)
            </div>
            <a
              href={audioUrl}
              download={`kokoro-speech.${format}`}
              className={
                isPaper
                  ? 'inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:-translate-y-0.5'
                  : 'inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:-translate-y-0.5'
              }
            >
              <CheckIcon size={14} />
              Download {format.toUpperCase()}
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

      <div className={perfCard}>
        <h4
          className={`mb-3 flex items-center gap-2 text-sm font-semibold ${isPaper ? 'text-slate-900' : 'text-white'}`}
        >
          <RefreshIcon size={16} />
          Performance Metrics
        </h4>
        <div className={`grid gap-2 md:grid-cols-2 ${isPaper ? 'text-slate-800' : 'text-slate-200'}`}>
          <div className={perfItem}>
            <span>CPU Generation Speed</span>
            <span className={isPaper ? 'font-semibold text-indigo-700' : 'font-semibold text-indigo-200'}>
              3-11x real-time
            </span>
          </div>
          <div className={perfItem}>
            <span>Typical Latency</span>
            <span className={isPaper ? 'font-semibold text-indigo-700' : 'font-semibold text-indigo-200'}>
              &lt; 0.3 seconds
            </span>
          </div>
          <div className={perfItem}>
            <span>Model Size</span>
            <span className={isPaper ? 'font-semibold text-indigo-700' : 'font-semibold text-indigo-200'}>
              82M parameters
            </span>
          </div>
          <div className={perfItem}>
            <span>API Format</span>
            <span className={isPaper ? 'font-semibold text-indigo-700' : 'font-semibold text-indigo-200'}>
              OpenAI compatible
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
