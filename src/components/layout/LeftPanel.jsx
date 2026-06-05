import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Tags, Plus, Trash2, ChevronRight, ChevronDown, FileText } from 'lucide-react'
import { categoriesApi } from '../../api/categories'
import { tagsApi } from '../../api/tags'
import { papersApi } from '../../api/papers'
import useAppStore from '../../stores/appStore'

function CategoryNode({ cat, depth, selectedId, onSelect, onDelete, onCreateChild, childCategories }) {
  const [expanded, setExpanded] = useState(false)
  const openPaper = useAppStore(s => s.openPaper)
  const children = childCategories.filter(c => c.parent_id === cat.id)

  const { data: papersData } = useQuery({
    queryKey: ['categoryPapers', cat.id],
    queryFn: () => papersApi.list({ category_id: cat.id, page_size: 100 }),
    enabled: expanded,
  })

  return (
    <div>
      <div className={`flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer group hover:bg-gray-100 ${selectedId === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
        style={{ paddingLeft: 8 + depth * 14 }}>
        <div className="flex items-center gap-1 min-w-0 flex-1" onClick={() => setExpanded(!expanded)}>
          <span className="p-0.5">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          <span className="truncate">{expanded ? '📂' : '📁'} {cat.name}</span>
        </div>
        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button onClick={e => { e.stopPropagation(); onCreateChild(cat.id) }} className="p-0.5 hover:bg-blue-100 rounded text-blue-500"><Plus size={12} /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(cat.id) }} className="p-0.5 hover:bg-red-100 rounded text-red-500"><Trash2 size={12} /></button>
        </span>
      </div>
      {expanded && (
        <div>
          {papersData?.items?.map(p => (
            <div key={p.id} onClick={() => openPaper(p.id)}
              className="flex items-center gap-1.5 py-1 pr-2 rounded text-xs text-gray-600 cursor-pointer hover:bg-gray-100 truncate"
              style={{ paddingLeft: 26 + depth * 14 }}>
              <FileText size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{p.title}</span>
            </div>
          ))}
          {papersData?.items?.length === 0 && (
            <div className="text-xs text-gray-400 py-1" style={{ paddingLeft: 26 + depth * 14 }}>暂无文献</div>
          )}
          {children.map(child => (
            <CategoryNode key={child.id} cat={child} depth={depth + 1} selectedId={selectedId}
              onSelect={onSelect} onDelete={onDelete} onCreateChild={onCreateChild} childCategories={childCategories} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildTree(cats) { return cats.filter(c => !c.parent_id) }

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState('categories')
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState(null)
  const [newTagColor, setNewTagColor] = useState('#4A90D9')
  const queryClient = useQueryClient()
  const { selectedCategoryId, selectedTagId, selectCategory, selectTag, selectAll } = useAppStore()

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() })
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() })

  const createCat = useMutation({
    mutationFn: ({ name, parent_id }) => categoriesApi.create({ name, parent_id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setNewParentId(null) }
  })
  const deleteCat = useMutation({ mutationFn: (id) => categoriesApi.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); queryClient.invalidateQueries({ queryKey: ['categoryPapers'] }) } })
  const createT = useMutation({ mutationFn: (n) => tagsApi.create({ name: n, color: newTagColor }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tags'] }); setNewTagColor('#4A90D9') } })
  const deleteT = useMutation({ mutationFn: (id) => tagsApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }) })

  const handleAdd = () => { if (!newName.trim()) return; (activeTab === 'categories' ? createCat.mutate({ name: newName.trim(), parent_id: newParentId }) : createT.mutate(newName.trim())); setNewName('') }
  const handleCreateChild = (parentId) => { setNewParentId(parentId); setNewName('') }
  const roots = buildTree(categories)

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('categories')} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${activeTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><FolderTree size={15} /> 分类</button>
        <button onClick={() => setActiveTab('tags')} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${activeTab === 'tags' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><Tags size={15} /> 标签</button>
      </div>
      <div className="p-2 border-b border-gray-100">
        {newParentId && <div className="text-xs text-blue-500 mb-1 flex items-center gap-1">新建子分类 <button onClick={() => setNewParentId(null)} className="text-gray-400 hover:text-red-500">✕</button></div>}
        <div className="flex gap-1">
          {activeTab === 'tags' && <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border p-0 flex-shrink-0" />}
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={newParentId ? '子分类名称...' : `新建${activeTab === 'categories' ? '分类' : '标签'}...`}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button onClick={handleAdd} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex-shrink-0"><Plus size={14} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        <button onClick={selectAll} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm text-left mb-1 cursor-pointer ${!selectedCategoryId && !selectedTagId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>📚 全部文献</button>
        {activeTab === 'categories' && roots.map(cat => (
          <CategoryNode key={cat.id} cat={cat} depth={0} selectedId={selectedCategoryId}
            onSelect={(id) => selectCategory(id)} onDelete={(id) => deleteCat.mutate(id)}
            onCreateChild={handleCreateChild} childCategories={categories} />
        ))}
        {activeTab === 'tags' && tags.map(tag => (
          <button key={tag.id} onClick={() => selectTag(tag.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left hover:bg-gray-100 group cursor-pointer ${selectedTagId === tag.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} /><span className="truncate">{tag.name}</span></span>
            <span onClick={e => { e.stopPropagation(); deleteT.mutate(tag.id) }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={12} /></span>
          </button>
        ))}
      </div>
    </div>
  )
}
