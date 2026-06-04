import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2 } from 'lucide-react'
import { papersApi } from '../../api/papers'
import { categoriesApi } from '../../api/categories'
import { tagsApi } from '../../api/tags'
import useAppStore from '../../stores/appStore'
import PaperCard from './PaperCard'

export default function PaperList() {
  const cid = useAppStore(s => s.selectedCategoryId)
  const tid = useAppStore(s => s.selectedTagId)
  const rk = useAppStore(s => s.refreshKey)
  const [renderKey, setRenderKey] = useState(0)

  // Force remount when refreshKey changes
  useEffect(() => { setRenderKey(rk) }, [rk])

  return <PaperListInner key={renderKey} cid={cid} tid={tid} />
}

function PaperListInner({ cid, tid }) {
  const { data, isLoading } = useQuery({
    queryKey: ['paperlist', cid, tid],
    queryFn: () => papersApi.list({ category_id: cid || undefined, tag_id: tid || undefined, page_size: 100 }),
    staleTime: 0,
  })

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() })
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() })

  const papers = data?.items || []
  const total = data?.total ?? 0

  let header = '全部文献'
  if (cid) { const c = categories.find(x => x.id === cid); header = c ? `📁 ${c.name}` : '分类筛选' }
  else if (tid) { const t = tags.find(x => x.id === tid); header = t ? `🏷️ ${t.name}` : '标签筛选' }

  if (isLoading) return <div className="flex items-center justify-center h-full text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
  if (papers.length === 0) return <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3"><FileText size={48} /><p className="text-sm">{cid || tid ? '该分类下暂无文献' : '还没有文献'}</p></div>

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">{header}<span className="ml-2 text-xs font-normal text-gray-400">共 {total} 篇</span></h2>
      </div>
      <div className="divide-y divide-gray-50">{papers.map(p => <PaperCard key={p.id} paper={p} />)}</div>
    </div>
  )
}
