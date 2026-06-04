import { useQuery } from '@tanstack/react-query'
import { Highlighter, Loader2 } from 'lucide-react'
import { annotationsApi } from '../../api/annotations'
import useAppStore from '../../stores/appStore'
import AnnotationCard from './AnnotationCard'

export default function AnnotationList({ paperId }) {
  const { selectedAnnotationId, setPdfPageNumber } = useAppStore()

  const { data: annotations = [], isLoading } = useQuery({
    queryKey: ['annotations', paperId],
    queryFn: () => annotationsApi.list(paperId),
    enabled: !!paperId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    )
  }

  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-2">
        <Highlighter size={32} />
        <p className="text-xs">在 PDF 中选中文本添加标注</p>
        <p className="text-xs text-gray-300">标注后可以按关键词搜索定位</p>
      </div>
    )
  }

  // Group by page
  const grouped = {}
  annotations.forEach((ann) => {
    const page = ann.page_number
    if (!grouped[page]) grouped[page] = []
    grouped[page].push(ann)
  })

  return (
    <div className="p-3 space-y-1">
      <h3 className="text-xs font-medium text-gray-500 mb-2 px-1">
        段落标注 ({annotations.length})
      </h3>
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([page, anns]) => (
          <div key={page}>
            <button
              onClick={() => setPdfPageNumber(Number(page))}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium px-1 py-0.5"
            >
              第 {page} 页 ({anns.length} 条)
            </button>
            <div className="space-y-1">
              {anns.map((ann) => (
                <AnnotationCard
                  key={ann.id}
                  annotation={ann}
                  isSelected={selectedAnnotationId === ann.id}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
