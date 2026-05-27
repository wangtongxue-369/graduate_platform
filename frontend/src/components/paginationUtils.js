export function totalPages(items, size) {
  return Math.max(1, Math.ceil((items?.length || 0) / size))
}

export function pageItems(items, page, size) {
  const start = (page - 1) * size
  return (items || []).slice(start, start + size)
}
