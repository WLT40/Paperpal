import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Lightbulb, HelpCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { analysisApi } from '../../api/analysis'

const FIELDS = [
  { key: 'summary', label: '我的总结', icon: FileText, placeholder: '用自己的话总结这篇论文...' },
  { key: 'innovations', label: '创新点', icon: Lightbulb, placeholder: '这篇论文提出了什么新方法/新观点...' },
  { key: 'scientific_questions', label: '科学问题', icon: HelpCircle, placeholder: '研究要回答什么核心问题...' },
  { key: 'limitations', label: '局限性', icon: AlertTriangle, placeholder: '方法/实验有什么局限...' },
  { key: 'research_methods', label: '研究方法', icon: null, placeholder: '使用了什么实验方法和数据分析方法...' },
  { key: 'key_findings', label: '关键发现', icon: null, placeholder: '最重要的实验结果或发现...' },
  { key: 'personal_notes', label: '个人杂记', icon: null, placeholder: '随意的想法、关联、灵感...' },
]

export default function AnalysisEditor({ paperId }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', paperId],
    queryFn: () => analysisApi.get(paperId).catch(() => null),
    enabled: !!paperId,
  })

  const mutation = useMutation({
    mutationFn: (data) => analysisApi.upsert(paperId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis', paperId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  useEffect(() => {
    if (analysis) {
      const init = {}
      FIELDS.forEach((f) => { init[f.key] = analysis[f.key] || '' })
      setForm(init)
    }
  }, [analysis])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    mutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">深度分析</h3>
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg
                     text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : saved ? (
            '已保存 ✓'
          ) : (
            <>
              <Save size={12} />
              保存
            </>
          )}
        </button>
      </div>

      {FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
        <div key={key}>
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1.5">
            {Icon && <Icon size={12} />}
            {label}
          </label>
          <textarea
            value={form[key] || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-blue-400
                       resize-y min-h-[60px] leading-relaxed
                       placeholder:text-gray-300"
          />
        </div>
      ))}
    </div>
  )
}
