import useAppStore from '../../stores/appStore'
import PaperDetail from '../papers/PaperDetail'
import AnalysisEditor from '../analysis/AnalysisEditor'
import AnnotationList from '../annotations/AnnotationList'
import ChatPanel from '../ai/ChatPanel'

export default function RightPanel({ paper }) {
  const { rightPanelTab, setRightPanelTab } = useAppStore()

  if (!paper) {
    return <div className="p-6 text-center text-gray-400 text-sm">选择一篇论文查看详情</div>
  }

  const tabs = [
    { key: 'detail', label: '详情' },
    { key: 'analysis', label: '分析' },
    { key: 'annotations', label: '标注' },
    { key: 'chat', label: 'AI 对话' },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setRightPanelTab(tab.key)}
            className={`px-3 py-2.5 text-xs font-medium transition-colors ${rightPanelTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'detail' && <PaperDetail paper={paper} />}
        {rightPanelTab === 'analysis' && <AnalysisEditor paperId={paper.id} />}
        {rightPanelTab === 'annotations' && <AnnotationList paperId={paper.id} />}
        {rightPanelTab === 'chat' && <ChatPanel paperId={paper.id} />}
      </div>
    </div>
  )
}
