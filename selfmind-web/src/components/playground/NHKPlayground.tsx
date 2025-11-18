'use client'

import { useState } from 'react'
import { AlertIcon, CalendarIcon, IdIcon, NewspaperIcon, RefreshIcon } from './icons'

interface Props {
  theme: 'dark' | 'paper'
}

interface Article {
  id: number
  newsId: string
  title: string
  titleWithRuby: string
  content: string
  contentWithRuby: string
  imageUrl: string
  publishedAt: string
  scrapedAt: string
}

export default function NHKPlayground({ theme }: Props) {
  const [daysBack, setDaysBack] = useState(7)
  const [loading, setLoading] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState('')
  const [showFurigana, setShowFurigana] = useState(true)

  const handleFetch = async () => {
    const apiKey = localStorage.getItem('selfmind_api_key')
    if (!apiKey) {
      setError('Please set your API key first!')
      return
    }

    setLoading(true)
    setError('')
    setArticles([])

    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const res = await fetch(`/api/proxy/nhk/api/news?${params}`, {
        headers: {
          'X-API-Key': apiKey,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setArticles(data)
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
            ? 'rounded-2xl border border-amber-100 bg-gradient-to-r from-white via-amber-50 to-white p-5 shadow-sm'
            : 'rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-950/60 to-orange-600/10 p-5 shadow-inner shadow-amber-900/20'
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={
              theme === 'paper'
                ? 'rounded-2xl border border-amber-100 bg-white p-3 shadow-sm'
                : 'rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/5'
            }
          >
            <NewspaperIcon className={theme === 'paper' ? 'text-amber-600' : 'text-amber-200'} size={22} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'paper' ? 'text-slate-900' : 'text-white'}`}>
              NHK Easy News
            </h3>
            <p className={`text-sm ${theme === 'paper' ? 'text-slate-700' : 'text-slate-200'}`}>
              Fetch simplified Japanese news with optional furigana for study or UI demos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={`mb-2 block text-sm font-semibold ${theme === 'paper' ? 'text-slate-800' : 'text-slate-100'}`}>
            Days back
          </label>
          <input
            type="number"
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            min="1"
            max="30"
            className={
              theme === 'paper'
                ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200'
                : 'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60'
            }
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleFetch}
            disabled={loading}
            className={
              theme === 'paper'
                ? 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
                : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/30 transition hover:-translate-y-0.5 hover:shadow-amber-900/50 disabled:cursor-not-allowed disabled:opacity-50'
            }
          >
            {loading ? <RefreshIcon className="animate-spin" size={18} /> : <NewspaperIcon size={18} />}
            {loading ? 'Loading articles...' : 'Fetch News'}
          </button>
        </div>
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

      {articles.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <p className={theme === 'paper' ? 'text-slate-800' : 'text-slate-200'}>
              Found <strong>{articles.length}</strong> articles
            </p>
            <button
              onClick={() => setShowFurigana(!showFurigana)}
              className={
                theme === 'paper'
                  ? 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:-translate-y-0.5'
                  : 'rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:-translate-y-0.5'
              }
            >
              {showFurigana ? 'Hide Furigana' : 'Show Furigana'}
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {articles.map((article) => (
              <div
                key={`${article.id}-${article.newsId}`}
                className={
                  theme === 'paper'
                    ? 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                    : 'rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-slate-900/40'
                }
              >
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className={`mb-3 h-48 w-full rounded-xl object-cover ${theme === 'paper' ? 'border border-slate-100' : ''}`}
                  />
                )}
                <h4
                  className={`mb-2 text-lg font-semibold ${theme === 'paper' ? 'text-slate-900' : 'text-white'}`}
                  dangerouslySetInnerHTML={{
                    __html: showFurigana ? article.titleWithRuby : article.title,
                  }}
                />
                <div
                  className={`mb-3 leading-relaxed ${theme === 'paper' ? 'text-slate-800' : 'text-slate-200'}`}
                  dangerouslySetInnerHTML={{
                    __html: showFurigana ? article.contentWithRuby : article.content,
                  }}
                />
                <div className={`flex gap-4 text-xs ${theme === 'paper' ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon size={14} />
                    {new Date(article.publishedAt).toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <IdIcon size={14} />
                    {article.newsId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
