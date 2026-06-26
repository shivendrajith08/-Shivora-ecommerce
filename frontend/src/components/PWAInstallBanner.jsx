import { useState, useEffect } from 'react'

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setPrompt(null)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#060D22] border border-[#F59E0B]/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4 md:left-auto md:right-6 md:w-80">
      <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xl font-bold text-[#F59E0B] font-serif">S</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F4F4F2]">Install Shivora</p>
        <p className="text-xs text-[#94A3B8]">Add to home screen for faster access</p>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button onClick={handleInstall} className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#020818] text-xs font-bold">Install</button>
        <button onClick={() => setShow(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-[#94A3B8] text-xs">Later</button>
      </div>
    </div>
  )
}
