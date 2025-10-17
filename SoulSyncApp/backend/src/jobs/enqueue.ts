import { therapyQueue, smilesQueue, f0Queue } from './queue'

export async function enqueueTherapy(payload: any){
  return therapyQueue.add('therapy', payload, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
}
export async function enqueueSmiles(payload: any){
  return smilesQueue.add('smiles', payload, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
}
export async function enqueueF0(payload: any){
  return f0Queue.add('f0', payload, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
}
