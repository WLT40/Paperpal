import { useState } from 'react';
import { Menu, Plus, Search, Settings, LogOut, ChevronDown, Check, Zap } from 'lucide-react';
import useAppStore from '../../stores/appStore';
import { searchApi } from '../../api/search';
import PaperImportDialog from '../papers/PaperImportDialog';
import AISettingsDialog from '../ai/AISettingsDialog';

const SEARCH_FIELDS = [
  { value: 'title', label: '标题' },
  { value: 'keywords', label: '关键词' },
  { value: 'summary', label: '总结' },
  { value: 'innovations', label: '创新点' },
  { value: 'scientific_questions', label: '科学问题' },
  { value: 'limitations', label: '局限性' },
  { value: 'research_methods', label: '研究方法' },
  { value: 'key_findings', label: '关键发现' },
  { value: 'personal_notes', label: '个人杂记' },
];

export default function TopBar({ onToggleSidebar, user, onLogout }) {
  const [searchText, setSearchText] = useState('');
  const [searchFields, setSearchFields] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const { setActiveView, setSearchResults } = useAppStore();

  const toggleField = (v) => {
    setSearchFields(prev => prev.includes(v) ? prev.filter(f => f !== v) : [...prev, v])
  };

  const fieldLabel = searchFields.length === 0 ? '全部字段' :
    searchFields.length <= 2 ? searchFields.map(f => SEARCH_FIELDS.find(s => s.value === f)?.label).join('+') :
    `${searchFields.length}个字段`;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    try {
      const params = { q: searchText, page_size: 50 };
      if (searchFields.length > 0) params.field = searchFields.join(',');
      const results = await searchApi.search(params);
      setSearchResults(results);
      setActiveView('search');
    } catch (err) { console.error('Search failed:', err); }
  };

  return (
    <>
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 flex-shrink-0">
        <button onClick={onToggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Menu size={18} /></button>
        <h1 className="text-lg font-semibold text-gray-800 whitespace-nowrap"><Zap size={20} className="text-purple-500 inline" /> PaperPal</h1>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto flex">
          <div className="relative">
            <button type="button" onClick={() => setShowFieldMenu(!showFieldMenu)}
              className="h-full px-2 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-xs text-gray-600 flex items-center gap-1 whitespace-nowrap hover:bg-gray-100">
              {fieldLabel} <ChevronDown size={12} />
            </button>
            {showFieldMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[130px]"
                onMouseLeave={() => setShowFieldMenu(false)}>
                {SEARCH_FIELDS.map(f => (
                  <button key={f.value} type="button" onClick={() => toggleField(f.value)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${searchFields.includes(f.value) ? 'text-blue-600' : 'text-gray-600'}`}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${searchFields.includes(f.value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {searchFields.includes(f.value) && <Check size={10} className="text-white" />}
                    </span>
                    {f.label}
                  </button>
                ))}
                {searchFields.length > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button type="button" onClick={() => setSearchFields([])}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50">清除筛选</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder={searchFields.length > 0 ? `在「${fieldLabel}」中搜索...` : '搜索全部字段...'}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
          </div>
          <button type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-r-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1 flex-shrink-0">
            <Search size={14} />搜索
          </button>
        </form>

        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="AI 设置"><Settings size={16} /></button>
        <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><Plus size={16} />导入PDF</button>
        <span className="text-xs text-gray-400 ml-1">{user?.email}</span>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="退出"><LogOut size={14} /></button>
      </header>
      {showImport && <PaperImportDialog onClose={() => setShowImport(false)} />}
      {showSettings && <AISettingsDialog onClose={() => setShowSettings(false)} />}
    </>
  );
}
