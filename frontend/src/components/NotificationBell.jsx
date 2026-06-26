import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications } from '../api/notificationApi'
import { useAuth } from '../context/AuthContext'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user])

  const fetchUnread = async () => {
    try {
      const res = await getNotifications()
      setUnreadCount(res.data.unread_count)
    } catch {}
  }

  if (!user) return null

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
      aria-label="Notifications"
    >
      <svg className="w-5 h-5 text-[#F4F4F2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#E07A5F] text-white text-[10px] font-bold flex items-center justify-center px-1">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
