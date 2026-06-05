import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Tag, Image } from 'lucide-react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import useAppStore from '../../stores/appStore'
import { api } from '../../api/client'
import { papersApi } from '../../api/papers'
import { annotationsApi } from '../../api/annotations'

export default function PdfViewer() {
  const { selectedPaperId, pdfPageNumber, pdfScale, setPdfPageNumber, setPdfScale, setSelectedAnnotationId, setRightPanelTab } = useAppStore()
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)
  const textOverlayRef = useRef(null)
  const containerRef = useRef(null)
  const popupRef = useRef(null)
  const pdfDocRef = useRef(null)
  const queryClient = useQueryClient()

  const [showPopup, setShowPopup] = useState(false)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [popupNote, setPopupNote] = useState('')
  const [popupLabel, setPopupLabel] = useState('')
  const [popupHasFigure, setPopupHasFigure] = useState(false)
  const [popupSaving, setPopupSaving] = useState(false)
  const [popupColor, setPopupColor] = useState('#FFEB3B')
  const [pdfMode, setPdfMode] = useState('annotate')

  const HIGHLIGHT_COLORS = ['#FFEB3B', '#FF9800', '#F44336', '#4CAF50', '#2196F3', '#9C27B0', '#795548', '#607D8B']

  const scale = pdfScale || 1.0
  const page = pdfPageNumber || 1

  // Annotations - manually managed for instant updates
  const [localAnnotations, setLocalAnnotations] = useState([])

  const fetchAnnotations = useCallback(async () => {
    if (!selectedPaperId) return
    try {
      const result = await annotationsApi.list(selectedPaperId)
      setLocalAnnotations(result || [])
    } catch (_) { setLocalAnnotations([]) }
  }, [selectedPaperId])

  useEffect(() => { fetchAnnotations() }, [fetchAnnotations])

  // Listen for refresh signal from other components (e.g., annotation delete)
  useEffect(() => {
    const handler = () => fetchAnnotations()
    window.addEventListener('pp-refresh-annotations', handler)
    return () => window.removeEventListener('pp-refresh-annotations', handler)
  }, [fetchAnnotations])

  const pageAnnotations = localAnnotations.filter(a => a.page_number === page)

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

      const canvas = canvasRef.current
      canvas.width = vp.width
      canvas.height = vp.height
      await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
      if (cancelled) return

      // Store text content for overlay rebuilding
      const textContent = await p.getTextContent()
      window.__ppLastText = { textContent, vp }

      const overlay = textOverlayRef.current
      if (!overlay) return
      overlay.innerHTML = ''
      overlay.style.width = vp.width + 'px'
      overlay.style.height = vp.height + 'px'

      // In annotate mode: add transparent text for selection
      if (pdfMode === 'annotate') {
        overlay.style.pointerEvents = 'auto'
        for (const item of textContent.items) {
          if (!item.str || !item.str.trim()) continue
          const tx = item.transform
          const x = tx[4] * scale
          const y = vp.height - tx[5] * scale
          const fontSize = Math.abs(tx[0]) * scale || 10
          const w = item.width * scale || fontSize * 3
          if (w < 1) continue

          const span = document.createElement('span')
          span.textContent = item.str
          span.style.cssText = `
            position:absolute;left:${x}px;top:${y - fontSize * 0.9}px;
            width:${w}px;height:${fontSize * 1.2}px;
            font-size:${fontSize}px;line-height:${fontSize * 1.2}px;
            color:transparent;white-space:nowrap;overflow:hidden;
            pointer-events:auto;cursor:text;
          `
          overlay.appendChild(span)
        }
      } else {
        overlay.style.pointerEvents = 'none'
      }

      // Add highlight boxes for existing annotations
      for (const ann of pageAnnotations) {
        const annText = (ann.highlighted_text || '').trim()
        if (!annText) continue
        const color = ann.color || '#FFEB3B'
        let foundItems = []
        for (const item of textContent.items) {
          if (!item.str || !item.str.trim()) continue
          if (item.str.includes(annText.substring(0, 15)) || annText.includes(item.str.trim())) foundItems.push(item)
        }
        if (foundItems.length === 0) {
          const words = annText.split(/\s+/).filter(w => w.length > 2)
          for (const item of textContent.items) {
            if (!item.str || !item.str.trim()) continue
            if (words.some(w => item.str.includes(w))) foundItems.push(item)
          }
        }
        if (foundItems.length > 0) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          for (const item of foundItems) {
            const tx = item.transform
            const x = tx[4] * scale; const y = vp.height - tx[5] * scale
            const h = Math.abs(tx[0]) * scale || 10
            minX = Math.min(minX, x); minY = Math.min(minY, y - h)
            maxX = Math.max(maxX, x + (item.width * scale || 50)); maxY = Math.max(maxY, y)
          }
          const box = document.createElement('div')
          box.className = 'pp-highlight'
          box.style.cssText = `position:absolute;left:${minX - 2}px;top:${minY - 2}px;width:${maxX - minX + 4}px;height:${maxY - minY + 4}px;background:${color}30;border:2px solid ${color};border-radius:3px;pointer-events:auto;cursor:pointer;z-index:5;`
          box.title = (ann.note || '标注') + ' | 第' + ann.page_number + '页'
          box.onmouseenter = () => { box.style.background = color + '60' }
          box.onmouseleave = () => { box.style.background = color + '30' }
          box.onclick = (e) => { e.stopPropagation(); setSelectedAnnotationId(ann.id); setPdfPageNumber(ann.page_number); setRightPanelTab('annotations') }
          overlay.appendChild(box)
        }
      }

    }
    render()
    return () => { cancelled = true }
  }, [pdfDocRef.current, page, scale, localAnnotations])

  // Handle text selection
  const handleMouseUp = useCallback((e) => {
    // Ignore clicks inside the popup
    if (popupRef.current?.contains(e.target)) return

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
      // Combine label and note
      let fullNote = ''
      if (popupLabel.trim()) fullNote += '🏷️ ' + popupLabel.trim()
      if (popupNote.trim()) fullNote += (fullNote ? '\n' : '') + popupNote.trim()

      await annotationsApi.create(selectedPaperId, {
        page_number: page,
        section_name: `第${page}页`,
        highlighted_text: selectedText,
        note: fullNote || undefined,
        has_figure: popupHasFigure,
        color: popupColor,
        annotation_type: 'highlight',
        label_ids: [],
      })
      queryClient.invalidateQueries({ queryKey: ['annotations', selectedPaperId] })
      await fetchAnnotations()
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
        {/* Mode switch */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setPdfMode('annotate')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${pdfMode === 'annotate' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            🖊️ 标注
          </button>
          <button onClick={() => setPdfMode('move')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${pdfMode === 'move' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            ✋ 移动
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-4" style={{ overflowX: 'auto', overflowY: 'auto', cursor: pdfMode === 'move' ? 'grab' : 'default' }}
        onMouseUp={pdfMode === 'annotate' ? handleMouseUp : undefined}
        onMouseDown={pdfMode === 'move' ? (e) => {
          if (popupRef.current?.contains(e.target)) return
          const el = containerRef.current; if (!el) return
          el.style.cursor = 'grabbing'; el.style.userSelect = 'none'
          const sx = e.clientX, sy = e.clientY, ssx = el.scrollLeft, ssy = el.scrollTop
          const onMove = (ev) => { el.scrollLeft = ssx + sx - ev.clientX; el.scrollTop = ssy + sy - ev.clientY }
          const onUp = () => { el.style.cursor = 'grab'; el.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
          document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
        } : undefined}
      >
        <div style={{ position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: '#fff' }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          <div ref={textOverlayRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />

          {showPopup && (
            <div ref={popupRef} style={{ position: 'fixed', left: popupPos.x, top: popupPos.y, zIndex: 9999 }}>
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
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">高亮颜色</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {HIGHLIGHT_COLORS.map(c => (
                        <button key={c} onClick={() => setPopupColor(c)}
                          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ backgroundColor: c, borderColor: popupColor === c ? '#333' : 'transparent' }} />
                      ))}
                    </div>
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
