import { useState } from 'react'
import { Image, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useAppStore from '../../stores/appStore'
import { annotationsApi } from '../../api/annotations'

export default function AnnotationCard({ annotation, isSelected }) {
  const { setSelectedAnnotationId, setPdfPageNumber } = useAppStore()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => annotationsApi.delete(annotation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', annotation.paper_id] })
    },
  })

  const handleClick = () => {
    setSelectedAnnotationId(annotation.id)
    setPdfPageNumber(annotation.page_number)
    setExpanded(!expanded)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-2.5 rounded-lg border transition-all
        ${isSelected
          ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }`}
    >
      {/* Highlighted text preview */}
      <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
        <span
          className="rounded px-0.5"
          style={{ backgroundColor: annotation.color + '40' }}
        >
          {annotation.highlighted_text}
        </span>
      </p>

      {/* Note preview */}
      {annotation.note && !expanded && (
        <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">
          💬 {annotation.note}
        </p>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 space-y-1.5 pt-2 border-t border-gray-100">
          {annotation.note && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {annotation.note}
            </p>
          )}

          {/* Labels */}
          {annotation.labels && annotation.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {annotation.labels.map((l) => (
                <span
                  key={l.id}
                  className="px-1.5 py-0.5 rounded text-xs text-white"
                  style={{ backgroundColor: l.color }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}

          {/* Figure info */}
          {annotation.has_figure && (
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Image size={11} />
              {annotation.figure_ref ? `配图: ${annotation.figure_ref}` : '该段落包含配图'}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-gray-400">
          {annotation.section_name
            ? `${annotation.section_name} · `
            : ''
          }
          第 {annotation.page_number} 页
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('确定删除这条标注？')) deleteMutation.mutate()
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded text-red-400"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </button>
  )
}
