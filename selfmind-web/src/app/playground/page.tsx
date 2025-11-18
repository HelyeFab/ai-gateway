'use client'

import { useEffect, useState, useMemo } from 'react'
import { Header } from '@/components/header'
import APIKeyManager from '@/components/playground/APIKeyManager'
import ChatPlayground from '@/components/playground/ChatPlayground'
import ImagePlayground from '@/components/playground/ImagePlayground'
import KokoroPlayground from '@/components/playground/KokoroPlayground'
import NHKPlayground from '@/components/playground/NHKPlayground'
import TTSPlayground from '@/components/playground/TTSPlayground'
import WhisperPlayground from '@/components/playground/WhisperPlayground'
import {
  ChatBubbleIcon,
  ImageIcon,
  KeyIcon,
  MicIcon,
  NewspaperIcon,
  SoundIcon,
  SparklesIcon,
} from '@/components/playground/icons'

type Tab = 'tts' | 'kokoro' | 'nhk' | 'whisper' | 'image' | 'chat'
type Theme = 'dark' | 'paper'

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tts')
  const [showKeyManager, setShowKeyManager] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('playground_theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    localStorage.setItem('playground_theme', theme)
    document.body.classList.toggle('playground-paper', theme === 'paper')
    document.body.classList.toggle('playground-dark', theme === 'dark')
    return () => {
      document.body.classList.remove('playground-paper')
      document.body.classList.remove('playground-dark')
    }
  }, [theme])

  const tabs = [
    { id: 'tts' as Tab, name: 'Text-to-Speech', icon: <SoundIcon size={18} /> },
    { id: 'kokoro' as Tab, name: 'Kokoro TTS', icon: <MicIcon size={18} /> },
    { id: 'nhk' as Tab, name: 'NHK News', icon: <NewspaperIcon size={18} /> },
    { id: 'whisper' as Tab, name: 'Speech-to-Text', icon: <MicIcon size={18} /> },
    { id: 'image' as Tab, name: 'Image Generation', icon: <ImageIcon size={18} /> },
    { id: 'chat' as Tab, name: 'Chat/LLM', icon: <ChatBubbleIcon size={18} /> },
  ]

  const isPaper = theme === 'paper'
  const backgroundStyle = useMemo(
    () =>
      isPaper
        ? {
            background:
              'radial-gradient(circle at 18% 22%, rgba(221, 161, 94, 0.16), transparent 36%), radial-gradient(circle at 82% 0%, rgba(190, 137, 76, 0.12), transparent 32%), radial-gradient(circle at 50% 68%, rgba(214, 159, 102, 0.1), transparent 34%), linear-gradient(180deg, #f6efdf 0%, #f0e6d3 100%)',
          }
        : {
            background:
              'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15), transparent 35%), radial-gradient(circle at 80% 0%, rgba(56, 189, 248, 0.12), transparent 30%), radial-gradient(circle at 50% 60%, rgba(236, 72, 153, 0.12), transparent 30%), #05060a',
          },
    [isPaper],
  )

  const shellPanel = isPaper
    ? 'rounded-3xl border border-[#e5d7bd] bg-[#f6efdf] shadow-xl shadow-amber-100/50'
    : 'rounded-3xl border border-slate-800/80 bg-slate-950/70 shadow-xl shadow-slate-900/40 backdrop-blur'

  const tabButton = (active: boolean) =>
    active
      ? isPaper
        ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
        : 'bg-gradient-to-r from-sky-500/20 via-blue-600/20 to-purple-600/20 text-white ring-1 ring-inset ring-sky-400/60 backdrop-blur'
      : isPaper
        ? 'text-slate-600 hover:bg-slate-100'
        : 'text-slate-300 hover:text-white hover:bg-slate-900/80'

  const iconPill = (active: boolean) =>
    active
      ? isPaper
        ? 'border-sky-200 bg-white text-sky-700'
        : 'border-sky-400/80 bg-sky-500/10 text-sky-100'
      : isPaper
        ? 'border-slate-200 bg-white text-slate-600 group-hover:text-slate-900'
        : 'border-slate-700 bg-slate-900/60 text-slate-300 group-hover:text-white'

  return (
    <main className="min-h-screen" style={backgroundStyle}>
      <Header />

      <div className="max-w-7xl mx-auto px-6 pb-16 pt-28 lg:pt-32">
        <div
          className={
            isPaper
              ? 'rounded-3xl border border-[#e5d7bd] bg-[#f6efdf] shadow-2xl shadow-amber-100/50'
              : 'rounded-3xl border border-slate-800/80 bg-slate-950/70 shadow-2xl shadow-slate-900/40 backdrop-blur'
          }
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-6 py-7 sm:px-8 sm:py-10">
            <div className="space-y-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  isPaper ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/30'
                }`}
              >
                <SparklesIcon size={16} />
                Live API sandbox
              </div>
              <div className="space-y-2">
                <h1 className={`text-3xl sm:text-4xl font-semibold tracking-tight ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                  SelfMind API Playground
                </h1>
                <p className={`text-base max-w-2xl leading-relaxed ${isPaper ? 'text-slate-600' : 'text-slate-300'}`}>
                  Explore text, speech, vision, and news endpoints in one polished workspace. Switch between tools without losing context.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ${
                    isPaper ? 'bg-slate-100 ring-[#e5d7bd] text-slate-700' : 'bg-slate-900/80 ring-slate-800 text-slate-200'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isPaper ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]' : 'bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]'
                    }`}
                  />
                  Base URL: <code className={isPaper ? 'text-emerald-700' : 'text-emerald-200'}>https://api.selfmind.dev</code>
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ${
                    isPaper ? 'bg-slate-100 ring-[#e5d7bd] text-slate-700' : 'bg-slate-900/80 ring-slate-800 text-slate-200'
                  }`}
                >
                  <MicIcon size={17} className={isPaper ? 'text-sky-600' : 'text-sky-300'} />
                  Multi-modal ready
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ${
                    isPaper ? 'bg-slate-100 ring-[#e5d7bd] text-slate-700' : 'bg-slate-900/80 ring-slate-800 text-slate-200'
                  }`}
                >
                  <ImageIcon size={17} className={isPaper ? 'text-violet-600' : 'text-violet-300'} />
                  GPU-free quick tests
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowKeyManager(!showKeyManager)}
                className={
                  isPaper
                    ? 'inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5'
                    : 'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5 hover:shadow-blue-900/60'
                }
              >
                <KeyIcon size={18} />
                Manage API Keys
              </button>
              <button
                onClick={() => setTheme(isPaper ? 'dark' : 'paper')}
                className={
                  isPaper
                    ? 'inline-flex items-center gap-2 rounded-xl border border-[#e5d7bd] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5'
                    : 'inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5'
                }
              >
                {isPaper ? 'Switch to Dark' : 'Switch to Paper'}
              </button>
            </div>
          </div>
        </div>

        {showKeyManager && <APIKeyManager theme={theme} onClose={() => setShowKeyManager(false)} />}

        <div className={`mt-10 ${shellPanel}`}>
          <div className={`flex flex-wrap gap-2 px-4 py-3 sm:px-6 ${isPaper ? 'border-b border-[#e5d7bd]' : 'border-b border-slate-800/80'}`}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tabButton(isActive)}`}
                >
                  <span className={`rounded-lg border px-1.5 py-1 transition ${iconPill(isActive)}`}>{tab.icon}</span>
                  {tab.name}
                </button>
              )
            })}
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'tts' && <TTSPlayground theme={theme} />}
            {activeTab === 'kokoro' && <KokoroPlayground theme={theme} />}
            {activeTab === 'nhk' && <NHKPlayground theme={theme} />}
            {activeTab === 'whisper' && <WhisperPlayground theme={theme} />}
            {activeTab === 'image' && <ImagePlayground theme={theme} />}
            {activeTab === 'chat' && <ChatPlayground theme={theme} />}
          </div>
        </div>

        <footer className={`px-2 py-10 text-center text-sm ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
          <p className="flex flex-wrap items-center justify-center gap-2">
            SelfMind API Playground
            <span className={`hidden sm:inline ${isPaper ? 'text-slate-300' : 'text-slate-600'}`}>•</span>
            <span
              className={`rounded-full px-3 py-1 ring-1 ${
                isPaper ? 'bg-slate-100 ring-[#e5d7bd] text-slate-700' : 'bg-slate-900/80 ring-slate-800'
              }`}
            >
              All requests require the <code className={isPaper ? 'text-slate-900' : 'text-slate-200'}>X-API-Key</code> header
            </span>
          </p>
        </footer>
      </div>
    </main>
  )
}
