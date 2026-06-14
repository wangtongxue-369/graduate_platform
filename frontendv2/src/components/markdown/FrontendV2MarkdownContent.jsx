import ShikiCodeBlock from './ShikiCodeBlock.jsx'

function renderInline(text, keyPrefix) {
  const nodes = []
  const pattern = /(!?\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/
  let remaining = text
  let partIndex = 0

  while (remaining) {
    const match = remaining.match(pattern)
    if (!match) {
      nodes.push(remaining)
      break
    }

    const token = match[0]
    const tokenIndex = match.index ?? 0
    if (tokenIndex > 0) {
      nodes.push(remaining.slice(0, tokenIndex))
    }

    if (token.startsWith('![')) {
      const imageMatch = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
      if (imageMatch) {
        nodes.push(
          <a
            key={`${keyPrefix}-img-${partIndex}`}
            className="markdown-image-link"
            href={imageMatch[2]}
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="markdown-image"
              src={imageMatch[2]}
              alt={imageMatch[1] || 'markdown image'}
              loading="lazy"
            />
          </a>,
        )
      } else {
        nodes.push(token)
      }
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${partIndex}`}
            className="markdown-link"
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
          >
            {linkMatch[1]}
          </a>,
        )
      } else {
        nodes.push(token)
      }
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={`${keyPrefix}-code-${partIndex}`} className="markdown-inline-code">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${partIndex}`}>
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('*')) {
      nodes.push(
        <em key={`${keyPrefix}-em-${partIndex}`}>
          {token.slice(1, -1)}
        </em>,
      )
    } else if (token.startsWith('~~')) {
      nodes.push(
        <del key={`${keyPrefix}-del-${partIndex}`}>
          {token.slice(2, -2)}
        </del>,
      )
    } else {
      nodes.push(token)
    }

    remaining = remaining.slice(tokenIndex + token.length)
    partIndex += 1
  }

  return nodes
}

function renderInlineWithBreaks(text, keyPrefix) {
  return text.split('\n').flatMap((line, index, array) => {
    const lineNodes = renderInline(line, `${keyPrefix}-${index}`)
    return index < array.length - 1
      ? [...lineNodes, <br key={`${keyPrefix}-br-${index}`} />]
      : lineNodes
  })
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableSeparator(line, columnCount) {
  const cells = splitTableRow(line)
  return cells.length === columnCount && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function parseTableAlignments(line) {
  return splitTableRow(line).map((cell) => {
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center'
    if (cell.endsWith(':')) return 'right'
    return 'left'
  })
}

function parseListItem(rawItem) {
  const taskMatch = rawItem.match(/^\[( |x|X)\]\s+(.*)$/)
  if (taskMatch) {
    return {
      content: taskMatch[2],
      checked: taskMatch[1].toLowerCase() === 'x',
    }
  }

  return {
    content: rawItem,
    checked: null,
  }
}

function parseMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) continue

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim()
      const codeLines = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      blocks.push({ type: 'code', language, content: codeLines.join('\n') })
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      })
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'rule' })
      continue
    }

    if (index + 1 < lines.length) {
      const headerCells = splitTableRow(line)
      const separatorLine = lines[index + 1]

      if (headerCells.length > 1 && isTableSeparator(separatorLine, headerCells.length)) {
        const rows = []
        const alignments = parseTableAlignments(separatorLine)
        index += 2

        while (index < lines.length) {
          const rowLine = lines[index]
          const rowTrimmed = rowLine.trim()
          if (!rowTrimmed) break

          const rowCells = splitTableRow(rowLine)
          if (rowCells.length !== headerCells.length) break

          rows.push(rowCells)
          index += 1
        }

        blocks.push({
          type: 'table',
          headers: headerCells,
          alignments,
          rows,
        })
        index -= 1
        continue
      }
    }

    if (trimmed.startsWith('>')) {
      const quoteLines = [trimmed.replace(/^>\s?/, '')]
      while (index + 1 < lines.length && lines[index + 1].trim().startsWith('>')) {
        index += 1
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
      }
      blocks.push({ type: 'quote', content: quoteLines.join('\n') })
      continue
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items = [parseListItem(trimmed.replace(/^[-*+]\s+/, ''))]
      while (index + 1 < lines.length && /^[-*+]\s+/.test(lines[index + 1].trim())) {
        index += 1
        items.push(parseListItem(lines[index].trim().replace(/^[-*+]\s+/, '')))
      }
      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [parseListItem(trimmed.replace(/^\d+\.\s+/, ''))]
      while (index + 1 < lines.length && /^\d+\.\s+/.test(lines[index + 1].trim())) {
        index += 1
        items.push(parseListItem(lines[index].trim().replace(/^\d+\.\s+/, '')))
      }
      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    const paragraphLines = [line]
    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1]
      const nextTrimmed = nextLine.trim()
      if (
        !nextTrimmed ||
        nextTrimmed.startsWith('```') ||
        /^#{1,6}\s+/.test(nextTrimmed) ||
        /^>\s?/.test(nextTrimmed) ||
        /^[-*+]\s+/.test(nextTrimmed) ||
        /^\d+\.\s+/.test(nextTrimmed) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(nextTrimmed)
      ) {
        break
      }
      index += 1
      paragraphLines.push(nextLine)
    }

    blocks.push({ type: 'paragraph', content: paragraphLines.join('\n') })
  }

  return blocks
}

export default function FrontendV2MarkdownContent({ content }) {
  const blocks = parseMarkdown(content || '')

  return (
    <div className="markdown-content">
      {blocks.map((block, index) => {
        const key = `block-${index}`

        if (block.type === 'heading') {
          const Tag = `h${block.level}`
          return (
            <Tag key={key} className={`markdown-heading markdown-h${block.level}`}>
              {renderInline(block.content, key)}
            </Tag>
          )
        }

        if (block.type === 'code') {
          return (
            <ShikiCodeBlock
              key={key}
              code={block.content}
              language={block.language}
            />
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="markdown-quote">
              {renderInlineWithBreaks(block.content, key)}
            </blockquote>
          )
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          const hasTaskItems = block.items.some((item) => item.checked !== null)
          return (
            <ListTag
              key={key}
              className={`markdown-list${hasTaskItems ? ' markdown-task-list' : ''}`}
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-item-${itemIndex}`}
                  className={item.checked !== null ? 'markdown-task-item' : undefined}
                >
                  {item.checked !== null ? (
                    <label className="markdown-task-label">
                      <input type="checkbox" checked={item.checked} readOnly disabled />
                      <span>{renderInline(item.content, `${key}-item-${itemIndex}`)}</span>
                    </label>
                  ) : (
                    renderInline(item.content, `${key}-item-${itemIndex}`)
                  )}
                </li>
              ))}
            </ListTag>
          )
        }

        if (block.type === 'rule') {
          return <hr key={key} className="markdown-rule" />
        }

        if (block.type === 'table') {
          return (
            <div key={key} className="markdown-table-wrap">
              <table className="markdown-table">
                <thead>
                  <tr>
                    {block.headers.map((header, cellIndex) => (
                      <th
                        key={`${key}-head-${cellIndex}`}
                        style={{ textAlign: block.alignments[cellIndex] }}
                      >
                        {renderInline(header, `${key}-head-${cellIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${key}-row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${key}-cell-${rowIndex}-${cellIndex}`}
                          style={{ textAlign: block.alignments[cellIndex] }}
                        >
                          {renderInline(cell, `${key}-cell-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return (
          <p key={key} className="markdown-paragraph">
            {renderInlineWithBreaks(block.content, key)}
          </p>
        )
      })}
    </div>
  )
}

