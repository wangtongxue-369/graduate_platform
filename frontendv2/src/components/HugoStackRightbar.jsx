export default function HugoStackRightbar({ children }) {
  if (!children) return null

  return (
    <aside className="v2-side-column">
      {children}
    </aside>
  )
}
