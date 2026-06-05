import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { authApi } from '../../api/auth';

const PRESETS = [
  { id: 'deepseek', name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'doubao', name: '豆包', base: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-1-5-pro-32k-250115' },
  { id: 'qwen', name: '通义千问', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'glm', name: '智谱 GLM', base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { id: 'kimi', name: 'Kimi', base: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { id: 'custom', name: '自定义', base: '', model: '' },
];

export default function AISettingsDialog({ onClose }) {
  const [config, setConfig] = useState({ api_key: '', api_base: '', api_model: '', custom_prompt: '' });
  const [selectedPreset, setSelectedPreset] = useState('deepseek');
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('ai');

  const DEFAULT_PROMPT = `你是一个专业学术文献分析助手。请仔细阅读以下论文内容，用中文输出严格 JSON 格式的分析结果（不要输出 markdown 代码块，只输出纯 JSON）：

{
  "summary": "论文总结（200字以内）",
  "innovations": "创新点（每点用分号分隔）",
  "scientific_questions": "核心科学问题（简洁描述）",
  "limitations": "局限性（列出主要不足）",
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "category": "建议的分类"
}

注意：keywords 必须是字符串数组，所有字段都必须填写。

论文内容：
`;

  useEffect(() => {
    authApi.me().then(data => {
      if (data.api_base || data.api_model) {
        setConfig({ api_key: '', api_base: data.api_base || '', api_model: data.api_model || '', custom_prompt: data.custom_prompt || '' });
        const m = PRESETS.find(p => p.base === data.api_base);
        setSelectedPreset(m ? m.id : 'custom');
      }
    }).catch(() => {});
  }, []);

  const handleSaveAI = async () => {
    try {
      await authApi.updateApiConfig({ api_key: config.api_key || undefined, api_base: config.api_base, api_model: config.api_model, custom_prompt: config.custom_prompt || undefined });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert('保存失败: ' + e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">⚙️ 设置</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex border-b border-gray-100">
          {[{k:'ai',l:'🤖 AI'},{k:'prompt',l:'📝 提示词'},{k:'about',l:'ℹ️ 关于'}].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex-1 py-2 text-xs font-medium ${tab===t.k?'text-blue-600 border-b-2 border-blue-600':'text-gray-500'}`}>{t.l}</button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'ai' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPreset(p.id); if (p.id!=='custom') setConfig(pr => ({...pr, api_base:p.base, api_model:p.model})) }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedPreset===p.id?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p.name}</button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
                <input type="password" value={config.api_key} onChange={e => setConfig(pr => ({...pr, api_key: e.target.value}))}
                  placeholder="输入 Key（留空保持不变）" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              {selectedPreset === 'custom' && (
                <>
                  <input type="text" value={config.api_base} onChange={e => setConfig(pr => ({...pr, api_base: e.target.value}))}
                    placeholder="API Base URL" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <input type="text" value={config.api_model} onChange={e => setConfig(pr => ({...pr, api_model: e.target.value}))}
                    placeholder="Model 名称" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </>
              )}
              <div className="flex justify-end">
                <button onClick={handleSaveAI} className={`px-4 py-2 text-sm rounded-lg font-medium text-white ${saved?'bg-green-500':'bg-blue-600 hover:bg-blue-700'}`}>
                  {saved?'✓ 已保存':'保存 AI 配置'}
                </button>
              </div>
            </div>
          )}
          {tab === 'prompt' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">为每个 AI 输出字段设定你的标准。留空则使用默认标准。</p>
              {[
                {k:'summary',l:'总结标准',ph:'如：用中文总结，控制在200字以内，突出研究目的和主要结论'},
                {k:'innovations',l:'创新点标准',ph:'如：列出方法学创新和理论创新，每点用分号分隔'},
                {k:'scientific_questions',l:'科学问题标准',ph:'如：必须是当前领域尚未解决的难题，非已有常识'},
                {k:'limitations',l:'局限性标准',ph:'如：包含实验条件限制、样本量不足、未解决的问题等'},
                {k:'keywords',l:'关键词标准',ph:'如：5个以内，必须是领域专业术语'},
                {k:'category',l:'分类标准',ph:'如：可选方法学/综述/实验研究/理论研究/临床应用等'},
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.l}</label>
                  <input type="text" value={config.custom_prompt?.[f.k] || ''}
                    onChange={e => setConfig(p => ({...p, custom_prompt: {...p.custom_prompt, [f.k]: e.target.value}}))}
                    placeholder={f.ph}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <button onClick={() => setConfig(p => ({...p, custom_prompt: {}}))}
                  className="text-xs text-red-400 hover:text-red-600">清空所有</button>
                <button onClick={handleSaveAI} className={`px-4 py-2 text-sm rounded-lg font-medium text-white ${saved?'bg-green-500':'bg-blue-600 hover:bg-blue-700'}`}>
                  {saved?'✓ 已保存':'保存提示词'}
                </button>
              </div>
            </div>
          )}
          {tab === 'about' && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-xs text-gray-400">版本</span><span className="text-xs font-medium">PaperPal v0.2</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-400">作者</span><a href="https://github.com/WLT40" target="_blank" className="text-xs text-blue-500">WLT40@GitHub</a></div>
              <div className="flex justify-between"><span className="text-xs text-gray-400">网站</span><a href="https://wlt40.github.io/Paperpal/" target="_blank" className="text-xs text-blue-500">wlt40.github.io/Paperpal</a></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
