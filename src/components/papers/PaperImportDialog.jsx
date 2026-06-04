import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { X, Upload, Loader2, FileText } from 'lucide-react'
import { papersApi } from '../../api/papers'
import useAppStore from '../../stores/appStore'

export default function PaperImportDialog({ onClose }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
  const triggerRefresh = useAppStore(s => s.doRefresh)

  const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name?.toLowerCase().endsWith('.pdf')) { setFile(f); setError(null) } else { setError('仅支持 PDF') } }
  const handleSelect = (e) => { const f = e.target.files[0]; if (f) { setFile(f); setError(null) } }
  const handleImport = async () => {
    if (!file) return; setUploading(true); setError(null)
    try {
      await papersApi.importPdf(file)
      triggerRefresh()
      setTimeout(() => onClose(), 200)
    } catch (err) { setError(err.message || '导入失败') }
    finally { setUploading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-96 max-w-full mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">导入 PDF 文献</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
            {file ? <div className="flex flex-col items-center gap-2"><FileText size={32} className="text-green-500" /><p className="text-sm font-medium text-gray-700">{file.name}</p><p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
              : <div className="flex flex-col items-center gap-2"><Upload size={32} className="text-gray-400" /><p className="text-sm text-gray-600">拖拽 PDF 文件或点击选择</p></div>}
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleSelect} className="hidden" />
          </div>
          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">取消</button>
          <button onClick={handleImport} disabled={!file || uploading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {uploading ? <><Loader2 size={14} className="animate-spin" />导入中...</> : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  )
}
