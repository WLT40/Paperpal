import { useState, useEffect, useCallback } from 'react';
import { X, Key, CheckCircle } from 'lucide-react';
import { authApi, aiApi } from '../../api/auth';

const PRESETS = [
  { id: 'deepseek', name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'doubao', name: '豆包 (Doubao)', base: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-1-5-pro-32k-250115' },
  { id: 'qwen', name: '通义千问 (Qwen)', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'glm', name: '智谱 GLM', base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { id: 'kimi', name: 'Kimi (Moonshot)', base: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { id: 'custom', name: '自定义', base: '', model: '' },
];

export default function AISettingsDialog({ onClose }) {
  const [config, setConfig] = useState({ api_key: '', api_base: '', api_model: '' });
  const [selectedPreset, setSelectedPreset] = useState('deepseek');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then(data => {
      if (data.api_base || data.api_model) {
        setConfig({ api_key: '', api_base: data.api_base || '', api_model: data.api_model || '' });
        // Find matching preset
        const match = PRESETS.find(p => p.base === data.api_base);
        if (match) setSelectedPreset(match.id);
        else setSelectedPreset('custom');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handlePresetChange = (id) => {
    setSelectedPreset(id);
    const preset = PRESETS.find(p => p.id === id);
    if (preset && id !== 'custom') {
      setConfig(prev => ({ ...prev, api_base: preset.base, api_model: preset.model }));
    }
  };

  const handleSave = async () => {
    try {
      await authApi.updateApiConfig({
        api_key: config.api_key || undefined,
        api_base: config.api_base,
        api_model: config.api_model,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">🤖 AI 模型配置</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400">加载中...</p>
          ) : (
            <>
              {/* Model Preset */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">选择模型</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map(p => (
                    <button key={p.id} onClick={() => handlePresetChange(p.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedPreset === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
                <input type="password" value={config.api_key}
                  onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="输入你的 API Key（不保存留空则不更新）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <p className="text-xs text-gray-400 mt-1">留空则保持之前的 Key 不变</p>
              </div>

              {/* API Base */}
              {selectedPreset === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">API Base URL</label>
                  <input type="text" value={config.api_base}
                    onChange={(e) => setConfig(prev => ({ ...prev, api_base: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              )}

              {selectedPreset === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model 名称</label>
                  <input type="text" value={config.api_model}
                    onChange={(e) => setConfig(prev => ({ ...prev, api_model: e.target.value }))}
                    placeholder="model-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">关闭</button>
          <button onClick={handleSave}
            className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition-colors ${saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saved ? '✓ 已保存' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
