import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Tags, Plus, Trash2 } from 'lucide-react'
import { categoriesApi } from '../../api/categories'
import { tagsApi } from '../../api/tags'
import useAppStore from '../../stores/appStore'

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState('categories')
  const [newName, setNewName] = useState('')
  const queryClient = useQueryClient()
  const { selectedCategoryId, selectedTagId, selectCategory, selectTag, selectAll } = useAppStore()

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() })
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() })

  const createCat = useMutation({ mutationFn: (n) => categoriesApi.create({ name: n }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) })
  const deleteCat = useMutation({ mutationFn: (id) => categoriesApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) })
  const createT = useMutation({ mutationFn: (n) => tagsApi.create({ name: n }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }) })
  const deleteT = useMutation({ mutationFn: (id) => tagsApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }) })

  const handleAdd = () => { if (newName.trim()) { (activeTab === 'categories' ? createCat : createT).mutate(newName.trim()); setNewName('') } }

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('categories')} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${activeTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><FolderTree size={15} /> 分类</button>
        <button onClick={() => setActiveTab('tags')} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${activeTab === 'tags' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><Tags size={15} /> 标签</button>
      </div>
      <div className="p-2 border-b border-gray-100">
        <div className="flex gap-1">
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={`新建${activeTab === 'categories' ? '分类' : '标签'}...`}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button onClick={handleAdd} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"><Plus size={14} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        <button onClick={selectAll} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm text-left mb-1 cursor-pointer ${!selectedCategoryId && !selectedTagId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>📚 全部文献</button>
        {activeTab === 'categories' && categories.map(cat => (
          <button key={cat.id} onClick={() => selectCategory(cat.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left hover:bg-gray-100 group cursor-pointer ${selectedCategoryId === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}>
            <span className="flex items-center gap-2"><span>📁</span><span className="truncate">{cat.name}</span></span>
            <span onClick={e => { e.stopPropagation(); deleteCat.mutate(cat.id) }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={12} /></span>
          </button>
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
