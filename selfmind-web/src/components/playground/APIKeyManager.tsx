'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, EyeIcon, EyeOffIcon, KeyIcon, TrashIcon } from './icons'

interface APIKeyManagerProps {
  onClose: () => void
  theme?: 'dark' | 'paper'
}

export default function APIKeyManager({ onClose, theme = 'dark' }: APIKeyManagerProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('selfmind_api_key')
    if (stored) setApiKey(stored)
  }, [])

  const handleSave = () => {
    localStorage.setItem('selfmind_api_key', apiKey)
    setStatusMessage('Key saved locally in your browser.')
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the saved API key?')) {
      localStorage.removeItem('selfmind_api_key')
      setApiKey('')
      setStatusMessage('Key removed from local storage.')
    }
  }

  const isPaper = theme === 'paper'
  const panelClass = isPaper
    ? 'w-full max-w-2xl rounded-2xl border border-[#e5d7bd] bg-[#f6efdf] p-6 shadow-2xl shadow-amber-100/60 sm:p-8 text-slate-900'
    : 'w-full max-w-2xl rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-slate-900/50 sm:p-8 text-slate-100'
  const inputClass = isPaper
    ? 'w-full rounded-xl border border-slate-200 bg-[#f9f2e3] px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200'
    : 'w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 pr-12 text-sm text-white transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60'
  const subtleText = isPaper ? 'text-slate-600' : 'text-slate-300'
  const buttonGhost = isPaper
    ? 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5'
    : 'inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:text-white'
  const chip = isPaper
    ? 'inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200'
    : 'inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-slate-800'
  const infoCard = isPaper
    ? 'rounded-xl border border-slate-200 bg-[#f9f2e3] p-4'
    : 'rounded-xl border border-slate-800 bg-slate-900/70 p-4'
  const statusSuccess = isPaper
    ? 'flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
    : 'flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'
  const primaryButton = isPaper
    ? 'flex-1 min-w-[140px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
    : 'flex-1 min-w-[140px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5 hover:shadow-blue-900/60 disabled:cursor-not-allowed disabled:opacity-50'
  const dangerButton = isPaper
    ? 'inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5'
    : 'inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:-translate-y-0.5'
  const neutralButton = isPaper
    ? 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5'
    : 'inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur">
      <div className={panelClass}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className={chip}>
              <KeyIcon size={16} /> Credentials
            </p>
            <h2 className={`text-2xl font-semibold ${isPaper ? 'text-slate-900' : 'text-white'}`}>API Key Management</h2>
            <p className={`text-sm ${subtleText}`}>
              Keys are stored only in your browser and attached to outgoing requests as the{' '}
              <code className={isPaper ? 'text-slate-900' : 'text-slate-100'}>X-API-Key</code> header.
            </p>
          </div>
          <button
            onClick={onClose}
            className={buttonGhost}
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className={`mb-2 block text-sm font-semibold ${isPaper ? 'text-slate-900' : 'text-slate-100'}`}>
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your SelfMind API key"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${isPaper ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
                title={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            <p className={`mt-2 text-xs ${subtleText}`}>
              Your key stays within this browser. It is only forwarded to SelfMind APIs you invoke.
            </p>
          </div>

          <div className={infoCard}>
            <h3
              className={`mb-3 flex items-center gap-2 text-sm font-semibold ${
                isPaper ? 'text-slate-900' : 'text-white'
              }`}
            >
              <KeyIcon size={16} className={isPaper ? 'text-sky-600' : 'text-sky-300'} />
              How to get a key
            </h3>
            <ol className={`ml-4 space-y-2 text-sm list-decimal ${isPaper ? 'text-slate-800' : 'text-slate-300'}`}>
              <li>Request access from the infrastructure admin.</li>
              <li>Select scopes you need: all, tts, nhk, whisper, image, chat.</li>
              <li>Receive the key over a secure channel.</li>
              <li>Paste it above and save before running tests.</li>
            </ol>
          </div>

          {statusMessage && (
            <div
              className={
                isPaper
                  ? 'flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
                  : 'flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'
              }
            >
              <CheckIcon size={18} />
              {statusMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!apiKey}
              className={primaryButton}
            >
              Save Key
            </button>
            <button
              onClick={handleClear}
              className={dangerButton}
            >
              <TrashIcon size={16} />
              Clear
            </button>
            <button
              onClick={onClose}
              className={neutralButton}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
