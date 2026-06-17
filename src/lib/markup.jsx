// Render text containing **bold** markers as React nodes, with the bold parts
// emphasized. Used to highlight corrections in writing feedback.
export function renderBold(text) {
  if (!text) return null
  // Split on **...**, keeping the captured inner text at odd indices.
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
  )
}
