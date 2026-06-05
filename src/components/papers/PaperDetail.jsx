import { useState } from 'react'
import { BookOpen, User, Calendar, FileText, Sparkles, Loader2, Plus, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { aiApi } from '../../api/auth'
import { papersApi } from '../../api/papers'
import TagBadge from '../tags/TagBadge'

export default function PaperDetail({ paper }) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const queryClient = useQueryClient()

  if (!paper) return null

  // Parse existing keywords
  let keywords = []
  try { const k = JSON.parse(paper.keywords); if (Array.isArray(k)) keywords = k } catch {}

  const addKeyword = async () => {
    const kw = newKeyword.trim()
    if (!kw || keywords.includes(kw)) return
    const updated = [...keywords, kw]
    await papersApi.update(paper.id, { keywords: JSON.stringify(updated) })
    queryClient.invalidateQueries({ queryKey: ['paper', paper.id] })
    queryClient.invalidateQueries({ queryKey: ['paperlist'] })
    setNewKeyword('')
  }

  const removeKeyword = async (kw) => {
    const updated = keywords.filter(k => k !== kw)
    await papersApi.update(paper.id, { keywords: JSON.stringify(updated) })
    queryClient.invalidateQueries({ queryKey: ['paper', paper.id] })
    queryClient.invalidateQueries({ queryKey: ['paperlist'] })
  }

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

      {/* Keywords - editable */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 mb-1">关键词</h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {keywords.map((kw, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs group">
              {typeof kw === 'string' ? kw : kw.name || kw}
              <button onClick={() => removeKeyword(kw)} className="opacity-0 group-hover:opacity-100 hover:text-red-500"><X size={10} /></button>
            </span>
          ))}
          {keywords.length === 0 && <span className="text-xs text-gray-400">暂无关键词，可手动添加或 AI 生成</span>}
        </div>
        <div className="flex gap-1">
          <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
            placeholder="添加关键词..." className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button onClick={addKeyword} disabled={!newKeyword.trim()}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-30"><Plus size={12} /></button>
        </div>
      </div>

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
