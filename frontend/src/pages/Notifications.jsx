import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllRead, markRead } from '../api/notificationApi'

const STATUS_ICONS = {
  pending: '🕐',
  processing: '✅',
  shipped: '📦',
  delivered: '✅',
  cancelled: '❌',
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications()
      .then(res => {
        setNotifications(res.data.notifications)
        markAllRead()
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleClick = async (notif) => {
    await markRead(notif.id)
    if (notif.order_id) navigate(`/orders/${notif.order_id}`)
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-[#020818] pb-24">
      <div className="sticky top-0 z-10 bg-[#020818] border-b border-white/10 flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[#F4F4F2] flex-1">Notifications</h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={() => { markAllRead(); setNotifications(prev => prev.map(n => ({...n, is_read: true}))) }}
            className="text-xs text-[#F59E0B]">Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-[#94A3B8] text-sm">No notifications yet</p>
          <p className="text-[#475569] text-xs">You'll be notified about your orders here</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-3 px-4 py-4 cursor-pointer active:opacity-70 transition-opacity ${!notif.is_read ? 'bg-[#F59E0B]/5' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.is_read ? 'bg-[#F59E0B]' : 'bg-transparent'}`}/>
              <div className="w-10 h-10 rounded-full bg-[#060D22] border border-white/10 flex items-center justify-center flex-shrink-0 text-lg">
                {STATUS_ICONS[notif.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F4F4F2] leading-snug">{notif.title}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-[#475569] mt-1">{timeAgo(notif.created_at)}</p>
              </div>
              {notif.order_id && (
                <svg className="w-4 h-4 text-[#475569] flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
