import { Capacitor } from '@capacitor/core'
// @ts-ignore
import { PushNotifications } from '@capacitor/push-notifications'

export async function registerAPNs(){
  if(!Capacitor.isNativePlatform()) throw new Error('Not a native platform')
  await PushNotifications.requestPermissions()
  await PushNotifications.register()
  return new Promise<string>((resolve, reject)=>{
    const sub = PushNotifications.addListener('registration', (token) => {
      await DefaultService.postApiDevicesRegister(/* body */)
      }).then(()=>resolve(token.value)).catch(reject)
      sub.remove()
    })
    PushNotifications.addListener('registrationError', (err) => reject(err))
  })
}
