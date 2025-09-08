import { PushNotifications } from '@capacitor/push-notifications'
export async function initPush(){
  try{
    const perm = await PushNotifications.checkPermissions()
    if(perm.receive !== 'granted'){
      const req = await PushNotifications.requestPermissions()
      if(req.receive !== 'granted') return null
    }
    await PushNotifications.register()
    return new Promise<string|null>((resolve)=>{
      PushNotifications.addListener('registration', t => resolve(t.value))
      PushNotifications.addListener('registrationError', e => { console.error('push reg error', e); resolve(null) })
    })
  }catch(e){
    console.warn('push not available', e)
    return null
  }
}
