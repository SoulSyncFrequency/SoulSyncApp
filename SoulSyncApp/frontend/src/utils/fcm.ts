import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { firebaseConfig } from '../firebaseConfig'

export async function registerFCM(){
  const supported = await isSupported().catch(()=>false)
  if(!supported) throw new Error('FCM not supported in this environment')
  const app = initializeApp(firebaseConfig)
  const messaging = getMessaging(app)
  const vapidKey = (window as any).__VAPID_PUBLIC_KEY__ || import.meta.env.VITE_VAPID_PUBLIC_KEY
  const token = await getToken(messaging, { vapidKey })
  if(!token) throw new Error('No FCM token')
  await await DefaultService.postApiDevicesRegister(/* body */)
  })
  return token
}
