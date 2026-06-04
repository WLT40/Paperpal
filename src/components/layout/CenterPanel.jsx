import { ArrowLeft } from 'lucide-react'
import useAppStore from '../../stores/appStore'
import PaperList from '../papers/PaperList'
import PdfViewer from '../pdf/PdfViewer'
import SearchResults from '../search/SearchResults'

export default function CenterPanel() {
  const activeView = useAppStore(s => s.activeView)
  const setActiveView = useAppStore(s => s.setActiveView)
  const selectAll = useAppStore(s => s.selectAll)

  const goBack = () => { selectAll(); setActiveView('papers') }

  return (
    <div className="h-full flex flex-col">
      {activeView === 'pdf' && <>
        <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><ArrowLeft size={14} /> 返回文献列表</button>
        </div>
        <div className="flex-1 overflow-hidden"><PdfViewer /></div>
      </>}
      {activeView === 'search' && <>
        <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={() => setActiveView('papers')} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><ArrowLeft size={14} /> 返回文献列表</button>
        </div>
        <div className="flex-1 overflow-hidden"><SearchResults /></div>
      </>}
      {activeView === 'papers' && <div className="flex-1 overflow-hidden"><PaperList /></div>}
    </div>
  )
}
