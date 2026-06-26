const MAX_ITEMS = 8
const KEY = 'shivora_recently_viewed'

export function addToRecentlyViewed(product) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]')
    const filtered = stored.filter(p => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {}
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
