const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://shivora-ecommerce-production.up.railway.app'

export function startKeepAlive() {
  const ping = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/health`)
    } catch {}
  }
  ping()
  setInterval(ping, 14 * 60 * 1000)
}
