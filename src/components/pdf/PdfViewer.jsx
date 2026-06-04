import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Tag, Image } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import useAppStore from '../../stores/appStore'
import { api } from '../../api/client'
import { papersApi } from '../../api/papers'
import { annotationsApi } from '../../api/annotations'

export default function PdfViewer() {
  const { selectedPaperId, pdfPageNumber, pdfScale, setPdfPageNumber, setPdfScale } = useAppStore()
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)
  const textOverlayRef = useRef(null)
  const containerRef = useRef(null)
  const pdfDocRef = useRef(null)
  const queryClient = useQueryClient()

  const [showPopup, setShowPopup] = useState(false)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [popupNote, setPopupNote] = useState('')
  const [popupLabel, setPopupLabel] = useState('')
  const [popupHasFigure, setPopupHasFigure] = useState(false)
  const [popupSaving, setPopupSaving] = useState(false)

  const scale = pdfScale || 1.0
  const page = pdfPageNumber || 1

  // Load PDF
  useEffect(() => {
    if (!selectedPaperId) return
    let cancelled = false
    setLoading(true); setError('')
    async function load() {
      try {
        const url = papersApi.getPdfUrl(selectedPaperId)
        const token = api.getToken()
        const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!resp.ok) throw new Error('PDF 加载失败')
        const buf = await resp.arrayBuffer()
        if (cancelled) return
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
        const doc = await pdfjsLib.getDocument({ data: buf }).promise
        if (cancelled) return
        pdfDocRef.current = doc
        setTotalPages(doc.numPages)
        setPdfPageNumber(1)
        setLoading(false)
      } catch (e) { if (!cancelled) { setError(e.message); setLoading(false) } }
    }
    load()
    return () => { cancelled = true }
  }, [selectedPaperId])

  // Render page + transparent text overlay
  useEffect(() => {
    const doc = pdfDocRef.current
    if (!doc || !canvasRef.current) return
    let cancelled = false

    async function render() {
      const p = await doc.getPage(page)
      const vp = p.getViewport({ scale })

      // Canvas
      const canvas = canvasRef.current
      canvas.width = vp.width
      canvas.height = vp.height
      await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
      if (cancelled) return

      // Build transparent text overlay
      const overlay = textOverlayRef.current
      if (!overlay) return
      overlay.innerHTML = ''
      overlay.style.width = vp.width + 'px'
      overlay.style.height = vp.height + 'px'

      const textContent = await p.getTextContent()
      for (const item of textContent.items) {
        if (!item.str || !item.str.trim()) continue
        const tx = item.transform
        // PDF coords: tx[4]=x, tx[5]=y (bottom-left). Transform to viewport (top-left origin)
        const x = tx[4] * scale
        const y = vp.height - tx[5] * scale - item.height * scale
        const w = item.width * scale
        const h = item.height * scale

        if (w < 2 || h < 2) continue // skip tiny items

        const span = document.createElement('span')
        span.textContent = item.str
        span.style.cssText = `
          position:absolute;left:${x}px;top:${y}px;
          width:${w}px;height:${h}px;
          font-size:${h * 0.8}px;line-height:${h}px;
          color:transparent;cursor:text;
          white-space:nowrap;overflow:hidden;
          pointer-events:auto;
        `
        overlay.appendChild(span)
      }
    }
    render()
    return () => { cancelled = true }
  }, [pdfDocRef.current, page, scale])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection()
      const text = sel?.toString()?.trim()
      if (!text || text.length < 3) { setShowPopup(false); return }

      // Check selection is within our text overlay
      if (!textOverlayRef.current?.contains(sel.anchorNode)) { setShowPopup(false); return }

      const rect = sel.getRangeAt(0).getBoundingClientRect()

      setSelectedText(text)
      setPopupNote('')
      setPopupLabel('')
      setPopupHasFigure(false)
      // Position to the RIGHT of selection, not above (avoids blocking)
      setPopupPos({
        x: rect.right + 12,
        y: rect.top,
      })
      setShowPopup(true)
    }, 50)
  }, [])

  const handleSave = async () => {
    setPopupSaving(true)
    try {
      await annotationsApi.create(selectedPaperId, {
        page_number: page,
        highlighted_text: selectedText,
        note: popupNote || undefined,
        has_figure: popupHasFigure,
        color: '#FFEB3B',
        annotation_type: 'highlight',
        label_ids: [],
      })
      queryClient.invalidateQueries({ queryKey: ['annotations', selectedPaperId] })
      setShowPopup(false)
      window.getSelection()?.removeAllRanges()
    } catch (e) { alert('保存失败: ' + e.message) }
    finally { setPopupSaving(false) }
  }

  if (!selectedPaperId) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">选择一篇论文</div>
  if (loading) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">加载 PDF...</div>
  if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button onClick={() => setPdfPageNumber(Math.max(1, page - 1))} disabled={page <= 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronLeft size={18} /></button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => setPdfPageNumber(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPdfScale(Math.max(0.5, scale - 0.25))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ZoomOut size={18} /></button>
          <span className="text-xs text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setPdfScale(Math.min(3, scale + 0.25))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ZoomIn size={18} /></button>
        </div>
        <span className="text-xs text-gray-400">选中文字标注</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center p-4" onMouseUp={handleMouseUp}>
        <div style={{ position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: '#fff' }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          <div ref={textOverlayRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />

          {showPopup && (
            <div style={{ position: 'fixed', left: popupPos.x, top: popupPos.y, zIndex: 9999 }}>
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">📝 添加标注</span>
                  <button onClick={() => setShowPopup(false)} className="p-0.5 hover:bg-gray-100 rounded text-gray-400"><X size={14} /></button>
                </div>
                <p className="text-xs text-gray-500 mb-2 bg-yellow-50 p-2 rounded border border-yellow-100 line-clamp-2">"{selectedText}"</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Tag size={11} /> 标签</label>
                    <input type="text" value={popupLabel} onChange={e => setPopupLabel(e.target.value)}
                      placeholder="如：酶分类、方法学..." className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">笔记</label>
                    <textarea value={popupNote} onChange={e => setPopupNote(e.target.value)}
                      placeholder="这段讲的是什么..." rows={2} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={popupHasFigure} onChange={e => setPopupHasFigure(e.target.checked)} className="rounded" />
                    <Image size={11} /> 包含配图
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setShowPopup(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded">取消</button>
                  <button onClick={handleSave} disabled={popupSaving}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                    {popupSaving ? '保存中...' : '保存标注'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
