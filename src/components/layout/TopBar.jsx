import { useState } from 'react';
import { Menu, Plus, Search, Settings, LogOut, ChevronDown } from 'lucide-react';
import useAppStore from '../../stores/appStore';
import { searchApi } from '../../api/search';
import PaperImportDialog from '../papers/PaperImportDialog';
import AISettingsDialog from '../ai/AISettingsDialog';

const SEARCH_FIELDS = [
  { value: '', label: '全部字段' },
  { value: 'innovations', label: '创新点' },
  { value: 'scientific_questions', label: '科学问题' },
  { value: 'summary', label: '总结' },
  { value: 'limitations', label: '局限性' },
  { value: 'keywords', label: '关键词' },
  { value: 'title', label: '标题' },
];

export default function TopBar({ onToggleSidebar, user, onLogout }) {
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const { setActiveView, setSearchResults } = useAppStore();

  const selectedLabel = SEARCH_FIELDS.find(f => f.value === searchField)?.label || '全部字段';

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    try {
      const results = await searchApi.search({
        q: searchText,
        field: searchField || undefined,
        scope: searchField ? 'analysis' : 'all',
      });
      setSearchResults(results);
      setActiveView('search');
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <>
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 flex-shrink-0">
        <button onClick={onToggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Menu size={18} /></button>
        <h1 className="text-lg font-semibold text-gray-800 whitespace-nowrap">📋 PaperPal</h1>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto flex">
          {/* Field selector */}
          <div className="relative">
            <button type="button" onClick={() => setShowFieldMenu(!showFieldMenu)}
              className="h-full px-2 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-xs text-gray-600 flex items-center gap-1 whitespace-nowrap hover:bg-gray-100">
              {selectedLabel} <ChevronDown size={12} />
            </button>
            {showFieldMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[110px]"
                onMouseLeave={() => setShowFieldMenu(false)}>
                {SEARCH_FIELDS.map(f => (
                  <button key={f.value} type="button"
                    onClick={() => { setSearchField(f.value); setShowFieldMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${searchField === f.value ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder={searchField ? `在「${selectedLabel}」中搜索...` : '搜索全部字段...'}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
          </div>
        </form>

        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="AI 设置"><Settings size={16} /></button>
        <button onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} />导入PDF
        </button>
        <span className="text-xs text-gray-400 ml-1">{user?.email}</span>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="退出"><LogOut size={14} /></button>
      </header>

      {showImport && <PaperImportDialog onClose={() => setShowImport(false)} />}
      {showSettings && <AISettingsDialog onClose={() => setShowSettings(false)} />}
    </>
  );
}
