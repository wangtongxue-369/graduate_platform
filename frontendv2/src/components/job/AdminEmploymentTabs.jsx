export default function AdminEmploymentTabs({ tabs = [], activeTab, onChange }) {
  return (
    <section className="v2-side-card">
      <div className="v2-segment-group" role="tablist" aria-label="就业运营对象">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`v2-segment-button ${activeTab === item.key ? 'is-active' : ''}`}
            type="button"
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  )
}
