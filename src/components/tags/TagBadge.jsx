export default function TagBadge({ tag, onClick }) {
  return (
    <span
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick(tag)
        }
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                 text-white cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: tag.color || '#4A90D9' }}
    >
      {tag.name}
    </span>
  )
}
