import { useEffect } from 'react'
import { useNotificationsState } from '../state/notificationsState'
import { useToast } from '../components/ToastProvider'

export function useNotificationsSSE(){
  const setUnread = useNotificationsState(s=>s.setUnread)
  const lastSeenId = useNotificationsState(s=>s.lastSeenId)
  const setLastSeenId = useNotificationsState(s=>s.setLastSeenId)
  const { show } = useToast()

  const criticalTypes = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED'];

  useEffect(()=>{
    let es: EventSource | null = null
    try{
      es = new EventSource('/api/notifications/stream')
      es.onmessage = (e)=>{
        try{
          const data = JSON.parse(e.data)
          // bump badge
          setUnread((u:number)=> u+1 as any)
          // toast
          const msg = data?.message || data?.type || 'Notification'
          const url = data?.meta?.url as string | undefined
          if(criticalTypes.includes(data?.type)) new Audio('/sounds/alert.mp3').play();
          show(msg, url)
          // last seen tracking
          if(typeof data?.id === 'number'){
            setLastSeenId(Math.max(lastSeenId, data.id))
          }
        }catch{}
      }
    }catch{}
    return ()=>{ es && es.close() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}