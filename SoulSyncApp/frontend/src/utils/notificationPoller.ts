import { useEffect } from 'react'
import { useNotificationsState } from '../state/notificationsState'

export function useNotificationPoller(){
  const setUnread = useNotificationsState(s=>s.setUnread)
  const lastSeenId = useNotificationsState(s=>s.lastSeenId)
  const setLastSeenId = useNotificationsState(s=>s.setLastSeenId)

  useEffect(()=>{
    let timer: any
    const tick = async ()=>{
      try{
        const r = await fetch('/api/notifications?unread=true')
        const j = await r.json()
        const items = (j.items||[]) as {id:number; message:string}[]
        setUnread(items.length)
        if(items.length>0){
          const newest = items[0].id
          if(newest > lastSeenId){
            // fire browser notifications for new ones
            if('Notification' in window && Notification.permission==='granted'){
              for(const it of items.filter(i=>i.id>lastSeenId)){
                new Notification('SoulSync', { body: it.message })
              }
            }
            setLastSeenId(newest)
          }
        }
      }catch{}
      timer = setTimeout(tick, 30000) // 30s
    }
    tick()
    return ()=> timer && clearTimeout(timer)
  }, [lastSeenId, setUnread, setLastSeenId])
}