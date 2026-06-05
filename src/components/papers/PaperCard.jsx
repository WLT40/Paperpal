import { useState, useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { FileText, Zap, FolderPlus, TagIcon, Check, X, Trash2 } from 'lucide-react'
import useAppStore from '../../stores/appStore'
import { papersApi } from '../../api/papers'
import { categoriesApi } from '../../api/categories'
import { tagsApi } from '../../api/tags'
import TagBadge from '../tags/TagBadge'

const DC = { title: '#1a1a1a', author: '#666', year: '#888', journal: '#888' };
function getColors() { try { return {...DC,...JSON.parse(localStorage.getItem('pp-colors')||'{}')} } catch { return DC } }

function CategoryMenuItem({ cat, allCats, addCat, depth, paper }) {
  const children = allCats.filter(c => c.parent_id === cat.id)
  const isIn = (paper.categories||[]).some(c => c.id === cat.id)
  return (
    <div>
      <button onClick={() => addCat(cat.id)}
        className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 flex items-center gap-2 ${isIn ? 'text-blue-500 bg-blue-50' : 'text-gray-700'}`}
        style={{ paddingLeft: 12 + depth * 14 }}>
        <FolderPlus size={10} className={isIn ? 'text-blue-400' : 'text-blue-300'} />
        <span className="truncate">{'📁'} {cat.name}</span>
        {isIn && <span className="ml-auto text-blue-400">✓</span>}
      </button>
      {children.map(child => (
        <CategoryMenuItem key={child.id} cat={child} allCats={allCats} addCat={addCat} depth={depth + 1} paper={paper} />
      ))}
    </div>
  )
}

export default function PaperCard({ paper }) {
  const { openPaper, selectedPaperId, doRefresh, colorKey, selectedCategoryId } = useAppStore()
  const isSelected = selectedPaperId === paper.id
  const queryClient = useQueryClient()
  const [ctxMenu, setCtxMenu] = useState(null)
  const colors = getColors()  // Re-read every render; colorKey change triggers re-render

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list(), enabled: !!ctxMenu })
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list(), enabled: !!ctxMenu })

  const ctx = (e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }) }
  const close = () => setCtxMenu(null)

  const addCat = async (cid) => {
    try { const existing = (paper.categories||[]).map(c=>c.id); await papersApi.setCategories(paper.id, [...existing, cid]); doRefresh(); close() } catch(e){alert(e.message)}
  }
  const toggleTag = async (tid) => {
    try { const et = paper.tags||[]; const has = et.some(t=>t.id===tid); await papersApi.setTags(paper.id, has ? et.filter(t=>t.id!==tid).map(t=>t.id) : [...et.map(t=>t.id), tid]); doRefresh(); close() } catch(e){alert(e.message)}
  }
  const removeFromCat = async () => {
    const updated = (paper.categories||[]).filter(c => c.id !== selectedCategoryId).map(c => c.id)
    try { await papersApi.setCategories(paper.id, updated); doRefresh(); close() } catch(e){alert(e.message)}
  }
  const del = async () => {
    if (!confirm(`确定删除「${paper.title?.substring(0, 50)}」？`)) return
    try { await papersApi.delete(paper.id); doRefresh(); close() } catch(e){alert(e.message)}
  }

  let authorText = paper.authors || ''
  try { const a = JSON.parse(paper.authors); if (Array.isArray(a)) authorText = a.map(x => x.name).join(', ') } catch {}

  return (<>
    <button onClick={() => openPaper(paper.id)} onContextMenu={ctx}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}>
      <div className="flex items-start gap-2">
        <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium line-clamp-2 leading-snug" style={{color: colors.title}}>{paper.title || '未命名文献'}</h3>
          {authorText && <p className="text-xs mt-1 line-clamp-1" style={{color: colors.author}}>{authorText}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            {paper.year && <span className="inline-flex items-center gap-1" style={{color: colors.year}}><Zap size={11} className="text-purple-500" />{paper.year}</span>}
            {paper.journal && <span className="line-clamp-1" style={{color: colors.journal}}>{paper.journal}</span>}
          </div>
          {paper.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-1.5">{paper.tags.map(t => <TagBadge key={t.id} tag={t} />)}</div>}
          {paper.categories?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{paper.categories.map(c => <span key={c.id} className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">📁{c.name}</span>)}</div>}
        </div>
      </div>
    </button>
    {ctxMenu && <div className="fixed inset-0 z-50" onClick={close}>
      <div style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 60 }} className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]" onClick={e => e.stopPropagation()}>
        <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">添加到分类</div>
        {categories.filter(c => !c.parent_id).map(root => (
          <CategoryMenuItem key={root.id} cat={root} allCats={categories} addCat={addCat} depth={0} paper={paper} />
        ))}
        <div className="border-t border-gray-100 my-1" />
        <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">标签</div>
        {tags.map(t => { const has = (paper.tags||[]).some(x=>x.id===t.id); return <button key={t.id} onClick={() => toggleTag(t.id)} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 flex items-center gap-2 ${has?'text-blue-600':'text-gray-700'}`}>{has?<Check size={12} className="text-green-500" />:<TagIcon size={12} />}<span className="w-2 h-2 rounded-full" style={{backgroundColor:t.color}} /> {t.name}</button> })}
        <div className="border-t border-gray-100 my-1" />
        {selectedCategoryId && (paper.categories||[]).some(c => c.id === selectedCategoryId) && (
          <>
            <div className="border-t border-gray-100 my-1" />
            <button onClick={removeFromCat} className="w-full text-left px-3 py-1.5 text-xs text-orange-500 hover:bg-orange-50 flex items-center gap-2"><X size={12} /> 移出此分类</button>
          </>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={del} className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> 删除文献</button>
        <button onClick={close} className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 flex items-center gap-2"><X size={12} /> 关闭</button>
      </div>
    </div>}
  </>)
}
