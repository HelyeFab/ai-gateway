'use client'

import { useState } from 'react'
import { AlertIcon, CheckIcon, DownloadIcon, ImageIcon, RefreshIcon } from './icons'

interface Props {
  theme: 'dark' | 'paper'
}

interface ImageResult {
  success: boolean
  image: string
  prompt: string
  seed: number
  steps: number
  generation_time_seconds: number
  model: string
}

export default function ImagePlayground({ theme }: Props) {
  const [prompt, setPrompt] = useState('a beautiful sunset over mountains, vibrant colors, photorealistic')
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted')
  const [steps, setSteps] = useState(4)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImageResult | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('selfmind_api_key')
    if (!apiKey) {
      setError('Please set your API key first!')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/proxy/image/api/generate/simple', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          steps,
          cfg_scale: 1.0,
          width: 512,
          height: 512,
        }),
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

  const downloadImage = () => {
    if (!result) return

    const link = document.createElement('a')
    link.href = `data:image/png;base64,${result.image}`
    link.download = `generated_${result.seed}.png`
    link.click()
  }

  const isPaper = theme === 'paper'
  const heroCard = isPaper
    ? 'rounded-2xl border border-violet-100 bg-gradient-to-r from-white via-violet-50 to-white p-5 shadow-sm'
    : 'rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-slate-950/60 to-fuchsia-600/10 p-5 shadow-inner shadow-violet-900/25'
  const inputClass = isPaper
    ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200'
    : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white shadow-inner shadow-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/60'
  const labelText = isPaper ? 'text-slate-800' : 'text-slate-100'
  const bodyText = isPaper ? 'text-slate-700' : 'text-slate-200'
  const buttonPrimary = isPaper
    ? 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:-translate-y-0.5 hover:shadow-violet-900/60 disabled:cursor-not-allowed disabled:opacity-50'
  const statusError = isPaper
    ? 'flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
    : 'flex items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'
  const statusSuccess = isPaper
    ? 'rounded-xl border border-emerald-200 bg-emerald-50 p-4'
    : 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4'
  const galleryCard = isPaper
    ? 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
    : 'rounded-2xl border border-slate-800 bg-slate-900/70 p-4'

  return (
    <div className={`space-y-6 ${isPaper ? 'text-slate-900' : 'text-slate-100'}`}>
      <div className={heroCard}>
        <div className="flex items-center gap-3">
          <div
            className={
              isPaper
                ? 'rounded-2xl border border-violet-100 bg-white p-3 shadow-sm'
                : 'rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/5'
            }
          >
            <ImageIcon className={isPaper ? 'text-violet-600' : 'text-violet-200'} size={22} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isPaper ? 'text-slate-900' : 'text-white'}`}>Image Generation</h3>
            <p className={`text-sm ${bodyText}`}>
              Generate images with Stable Diffusion Turbo. Optimized for CPU (30–90s typical).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Describe the image you want to generate..."
          />
        </div>

        <div>
          <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Negative Prompt (what to avoid)</label>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className={inputClass}
            placeholder="blurry, low quality..."
          />
        </div>

        <div>
          <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Steps (1-4 for SD Turbo)</label>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            min="1"
            max="4"
            className={inputClass}
          />
          <p className={`mt-1 text-xs ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            SD Turbo works best with 1-4 steps. More steps won't improve quality.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className={buttonPrimary}
        >
          {loading ? <RefreshIcon className="animate-spin" size={18} /> : <ImageIcon size={18} />}
          {loading ? 'Generating... (30–90s)' : 'Generate Image'}
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

      {result && (
        <div className="space-y-4">
          <div className={statusSuccess}>
            <p
              className={`mb-2 flex items-center gap-2 text-sm font-semibold ${
                isPaper ? 'text-emerald-800' : 'text-emerald-50'
              }`}
            >
              <CheckIcon size={18} />
              Image Generated
            </p>
            <div className={`space-y-1 text-sm ${isPaper ? 'text-emerald-800' : 'text-emerald-100'}`}>
              <p>
                Time: <strong>{result.generation_time_seconds?.toFixed(1)}s</strong>
              </p>
              <p>
                Seed: <strong>{result.seed}</strong>
              </p>
              <p>
                Model: <strong>{result.model}</strong>
              </p>
            </div>
          </div>

          <div className={galleryCard}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className={`text-sm font-semibold ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                Generated Image (512×512)
              </h4>
              <button
                onClick={downloadImage}
                className={
                  isPaper
                    ? 'inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:-translate-y-0.5'
                    : 'inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:-translate-y-0.5'
                }
              >
                <DownloadIcon size={16} />
                Download
              </button>
            </div>
            <img
              src={`data:image/png;base64,${result.image}`}
              alt={result.prompt}
              className={`w-full rounded-xl ${isPaper ? 'border border-slate-200' : 'border border-slate-800'}`}
            />
            <p className={`mt-2 text-sm italic ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>{result.prompt}</p>
          </div>
        </div>
      )}
    </div>
  )
}
