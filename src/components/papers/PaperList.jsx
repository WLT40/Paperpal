import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2 } from 'lucide-react'
import { papersApi } from '../../api/papers'
import { categoriesApi } from '../../api/categories'
import { tagsApi } from '../../api/tags'
import useAppStore from '../../stores/appStore'
import PaperCard from './PaperCard'

function ColorPicker({ label, storageKey, defaultColor }) {
  const doRefresh = useAppStore(s => s.doRefresh)
  const getC = () => { try { const d = JSON.parse(localStorage.getItem('pp-colors')||'{}'); return d[storageKey] || defaultColor } catch { return defaultColor } }
  const [c, setC] = useState(getC())
  const [orig] = useState(getC())
  const changed = c !== orig

  const apply = () => {
    const all = JSON.parse(localStorage.getItem('pp-colors') || '{}')
    all[storageKey] = c
    localStorage.setItem('pp-colors', JSON.stringify(all))
    window.dispatchEvent(new Event('pp-colors-changed'))
    doRefresh()
  }

  return (
    <div className="flex items-center gap-0.5" title={`${label}颜色`}>
      <span className="text-xs text-gray-400">{label}</span>
      <input type="color" value={c} onChange={e => setC(e.target.value)} className="w-5 h-5 rounded cursor-pointer border p-0" />
      {changed && <button onClick={apply} className="text-[10px] bg-blue-500 text-white px-1 py-0.5 rounded">✓</button>}
    </div>
  )
}

export default function PaperList() {
  const cid = useAppStore(s => s.selectedCategoryId)
  const tid = useAppStore(s => s.selectedTagId)
  const rk = useAppStore(s => s.refreshKey)
  const [sortBy, setSortBy] = useState('year')
  const [sortOrder, setSortOrder] = useState('desc')

  const { data, isLoading } = useQuery({
    queryKey: ['paperlist', cid, tid, rk, sortBy, sortOrder],
    queryFn: () => papersApi.list({ category_id: cid || undefined, tag_id: tid || undefined, page_size: 100, sort_by: sortBy, sort_order: sortOrder }),
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
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700">{header}<span className="ml-2 text-xs font-normal text-gray-400">共 {total} 篇</span></h2>
          <ColorPicker label="标题" storageKey="title" defaultColor="#1a1a1a" />
          <ColorPicker label="作者" storageKey="author" defaultColor="#666" />
          <ColorPicker label="年份" storageKey="year" defaultColor="#888" />
          <ColorPicker label="期刊" storageKey="journal" defaultColor="#888" />
        </div>
        <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split('-'); setSortBy(s); setSortOrder(o) }}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 flex-shrink-0">
          <option value="year-desc">📅 年份 ↓</option>
          <option value="year-asc">📅 年份 ↑</option>
          <option value="title-asc">🔤 标题 A-Z</option>
          <option value="title-desc">🔤 标题 Z-A</option>
          <option value="created_at-desc">🕐 最近添加</option>
          <option value="created_at-asc">🕐 最早添加</option>
        </select>
      </div>
      <div className="divide-y divide-gray-50">{papers.map(p => <PaperCard key={p.id} paper={p} />)}</div>
    </div>
  )
}
