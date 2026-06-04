import { useState } from 'react'
import { BookOpen, User, Calendar, FileText, Sparkles, Loader2 } from 'lucide-react'
import { aiApi } from '../../api/auth'
import TagBadge from '../tags/TagBadge'

export default function PaperDetail({ paper }) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  if (!paper) return null

  let authorText = paper.authors || ''
  try {
    const authors = JSON.parse(paper.authors)
    if (Array.isArray(authors)) {
      authorText = authors.map(a => a.name).join('; ')
    }
  } catch {}

  const handleAIAnalyze = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const result = await aiApi.analyze(paper.id)
      // Reload page to show results
      window.location.reload()
    } catch (e) {
      setAiError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Title */}
      <h2 className="text-base font-semibold text-gray-800 leading-snug">
        {paper.title || '未命名文献'}
      </h2>

      {/* AI Analysis Button */}
      {paper.pdf_document && (
        <button
          onClick={handleAIAnalyze}
          disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium
                     bg-gradient-to-r from-purple-500 to-blue-500 text-white
                     hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all"
        >
          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {aiLoading ? 'AI 分析中...' : '🤖 AI 分析这篇论文'}
        </button>
      )}
      {aiError && (
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{aiError}</p>
      )}

      {/* Authors */}
      {authorText && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <User size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <span>{authorText}</span>
        </div>
      )}

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {paper.year && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Calendar size={12} />
            <span className="font-medium text-gray-700">{paper.year}</span>
          </div>
        )}
        {paper.journal && (
          <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
            <BookOpen size={12} />
            <span className="font-medium">{paper.journal}</span>
            {paper.volume && <span>Vol.{paper.volume}</span>}
            {paper.pages && <span>pp.{paper.pages}</span>}
          </div>
        )}
      </div>

      {/* DOI */}
      {paper.doi && (
        <div className="text-xs text-gray-400">
          DOI: <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {paper.doi}
          </a>
        </div>
      )}

      {/* Abstract */}
      {paper.abstract && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">摘要</h3>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-8">
            {paper.abstract}
          </p>
        </div>
      )}

      {/* Author keywords */}
      {paper.keywords && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">关键词</h3>
          <div className="flex flex-wrap gap-1">
            {(() => {
              try {
                const kws = JSON.parse(paper.keywords)
                return (Array.isArray(kws) ? kws : []).map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {typeof kw === 'string' ? kw : kw.name || kw}
                  </span>
                ))
              } catch {
                return null
              }
            })()}
          </div>
        </div>
      )}

      {/* Tags */}
      {paper.tags && paper.tags.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">我的标签</h3>
          <div className="flex flex-wrap gap-1">
            {paper.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {/* PDF info */}
      {paper.pdf_document && (
        <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <FileText size={12} />
          <span className="truncate">{paper.pdf_document.filename}</span>
          {paper.page_count && <span>({paper.page_count} 页)</span>}
        </div>
      )}
    </div>
  )
}
