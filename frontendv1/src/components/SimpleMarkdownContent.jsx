export default function SimpleMarkdownContent({ content }) {
  const blocks = (content || '')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div className="v1-simple-markdown">
      {blocks.map((block, index) => {
        if (block.startsWith('### ')) {
          return <h3 key={`${index}-h3`}>{block.slice(4)}</h3>
        }

        if (block.startsWith('## ')) {
          return <h2 key={`${index}-h2`}>{block.slice(3)}</h2>
        }

        if (block.startsWith('# ')) {
          return <h1 key={`${index}-h1`}>{block.slice(2)}</h1>
        }

        if (block.startsWith('- ')) {
          const items = block
            .split('\n')
            .map((item) => item.replace(/^- /, '').trim())
            .filter(Boolean)

          return (
            <ul key={`${index}-ul`}>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        }

        return <p key={`${index}-p`}>{block.replace(/\n/g, ' ')}</p>
      })}
    </div>
  )
}
