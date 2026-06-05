import { Image, Trash2, GripHorizontal } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useAppStore from '../../stores/appStore'
import { annotationsApi } from '../../api/annotations'

export default function AnnotationCard({ annotation, isSelected }) {
  const { setSelectedAnnotationId, setPdfPageNumber } = useAppStore()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => annotationsApi.delete(annotation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', annotation.paper_id] })
      window.dispatchEvent(new CustomEvent('pp-refresh-annotations'))
    },
  })

  const jumpToPage = (e) => {
    e.stopPropagation()
    setSelectedAnnotationId(annotation.id)
    setPdfPageNumber(annotation.page_number)
  }

  return (
    <div className={`rounded-lg border transition-all ${isSelected ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300' : 'bg-white border-gray-100'}`}>
      {/* Page indicator bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-t-lg border-b border-gray-100">
        <button onClick={jumpToPage} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium" title="点击跳转到该页">
          📄 第 {annotation.page_number} 页
          {annotation.section_name && <span className="text-gray-400 font-normal">· {annotation.section_name}</span>}
        </button>
        <button onClick={(e) => { e.stopPropagation(); if (confirm('删除这条标注？')) deleteMutation.mutate() }}
          className="p-0.5 hover:bg-red-100 rounded text-red-400"><Trash2 size={11} /></button>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-2">
        {/* Highlighted text */}
        <div className="text-xs text-gray-800 leading-relaxed bg-yellow-50 border border-yellow-100 rounded p-2"
          style={{ borderLeftColor: annotation.color || '#FFEB3B', borderLeftWidth: 2 }}>
          <span style={{ backgroundColor: (annotation.color || '#FFEB3B') + '30' }}>{annotation.highlighted_text}</span>
        </div>

        {/* Note */}
        {annotation.note && (
          <div className="text-xs text-gray-600">
            <span className="text-gray-400 mr-1">💬</span>{annotation.note}
          </div>
        )}

        {/* Keywords / Labels */}
        {(annotation.labels?.length > 0 || annotation.has_figure) && (
          <div className="flex flex-wrap gap-1">
            {annotation.labels?.map((l) => (
              <span key={l.id} className="px-1.5 py-0.5 rounded text-xs text-white" style={{ backgroundColor: l.color }}>{l.name}</span>
            ))}
            {annotation.has_figure && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                <Image size={10} /> {annotation.figure_ref || '配图'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
