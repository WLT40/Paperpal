import useAppStore from '../../stores/appStore'

export default function SearchResults() {
  const { searchResults, openPaper } = useAppStore()

  if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
    return <div style={{padding: 40, textAlign: 'center', color: '#999'}}>未找到结果</div>
  }

  const { items, total } = searchResults

  return (
    <div style={{height: '100%', overflow: 'auto'}}>
      <div style={{padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #eee'}}>
        <span style={{fontWeight: 600}}>搜索结果</span>
        <span style={{marginLeft: 8, color: '#999', fontSize: 13}}>共 {total} 条</span>
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer'}}
          onClick={() => openPaper(item.id)}>
          <div style={{fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 4}}>
            {item.title || '(无标题)'}
          </div>
          {item.journal && <div style={{fontSize: 12, color: '#888'}}>{item.journal}{item.year ? ` (${item.year})` : ''}</div>}
          {item.matched_fields?.length > 0 && (
            <div style={{marginTop: 6}}>
              {item.matched_fields.map(f => (
                <span key={f} style={{display: 'inline-block', padding: '1px 6px', marginRight: 4, background: '#eff6ff', color: '#2563eb', borderRadius: 4, fontSize: 11}}>{f}</span>
              ))}
            </div>
          )}
          {item.snippet && <div style={{fontSize: 11, color: '#999', marginTop: 6, fontStyle: 'italic'}}>...{item.snippet}...</div>}
        </div>
      ))}
    </div>
  )
}
