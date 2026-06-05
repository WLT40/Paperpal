import { useState, useEffect } from 'react'
import { X, Download, FileText, Check } from 'lucide-react'
import { api } from '../../api/client'

export default function ExportDialog({ paperIds, onClose }) {
  const [fields, setFields] = useState(['title', 'authors', 'year', 'journal', 'citation'])
  const [format, setFormat] = useState('gbt7714')
  const [exporting, setExporting] = useState(false)

  const ALL_FIELDS = [
    { id: 'title', label: '标题' }, { id: 'authors', label: '作者' }, { id: 'year', label: '年份' },
    { id: 'journal', label: '期刊' }, { id: 'doi', label: 'DOI' }, { id: 'abstract', label: '摘要' },
    { id: 'keywords', label: '关键词' }, { id: 'volume', label: '卷' }, { id: 'pages', label: '页码' },
    { id: 'citation', label: '格式化引用' },
  ]

  const FORMATS = [
    { id: 'gbt7714', label: 'GB/T 7714 (中文国标)' }, { id: 'apa', label: 'APA 7th' },
    { id: 'mla', label: 'MLA 9th' }, { id: 'bibtex', label: 'BibTeX' },
  ]

  const toggleField = (f) => {
    setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const token = api.getToken()
      const resp = await fetch('http://localhost:8000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: paperIds, fields, format }),
      })
      if (!resp.ok) throw new Error('导出失败')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'paperpal-export.docx'; a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch (e) { alert(e.message) }
    finally { setExporting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">📤 导出文献 ({paperIds.length} 篇)</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">引用格式</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${format === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">导出字段（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {ALL_FIELDS.map(f => (
                <button key={f.id} onClick={() => toggleField(f.id)}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${fields.includes(f.id) ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                  {fields.includes(f.id) && <Check size={10} />}{f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">取消</button>
          <button onClick={handleExport} disabled={exporting || fields.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Download size={14} />{exporting ? '导出中...' : '导出 Word'}
          </button>
        </div>
      </div>
    </div>
  )
}
