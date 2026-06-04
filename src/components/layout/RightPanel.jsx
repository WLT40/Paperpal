import useAppStore from '../../stores/appStore'
import PaperDetail from '../papers/PaperDetail'
import AnalysisEditor from '../analysis/AnalysisEditor'
import AnnotationList from '../annotations/AnnotationList'

export default function RightPanel({ paper }) {
  const { rightPanelTab, setRightPanelTab } = useAppStore()

  if (!paper) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        选择一篇论文查看详情
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {['detail', 'analysis', 'annotations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setRightPanelTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors
              ${rightPanelTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {{ detail: '详情', analysis: '分析', annotations: '标注' }[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'detail' && <PaperDetail paper={paper} />}
        {rightPanelTab === 'analysis' && <AnalysisEditor paperId={paper.id} />}
        {rightPanelTab === 'annotations' && <AnnotationList paperId={paper.id} />}
      </div>
    </div>
  )
}
