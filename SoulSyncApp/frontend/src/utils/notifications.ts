export async function requestNotificationPermission(): Promise<NotificationPermission>{
  if(!('Notification' in window)) return 'denied'
  const perm = await Notification.requestPermission()
  return perm
}

export function showTestNotification(){
  if(!('Notification' in window)) return
  if(Notification.permission==='granted'){
    new Notification('SoulSync', { body: 'Notifikacije rade! 🎉' })
  }
}
