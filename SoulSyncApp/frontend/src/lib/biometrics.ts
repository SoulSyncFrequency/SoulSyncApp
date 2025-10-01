import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'
export async function isBiometricsAvailable(){
  try{
    return await BiometricAuth.isAvailable()
  }catch{ return { isAvailable:false, strongBiometrics:false, reason:'unavailable' } as any }
}
export async function authenticate(prompt='Authenticate'){
  try{
    return await BiometricAuth.authenticate({ reason: prompt, cancelTitle: 'Cancel' })
  }catch(e){ return { success:false, error:e } as any }
}
