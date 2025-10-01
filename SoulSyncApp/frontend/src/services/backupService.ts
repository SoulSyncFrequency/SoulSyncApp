import { toCSV } from '../utils/csvUtils'
import type { Item } from '../utils/csvUtils'

export type BackupEntry = { name: string, time: string, items: Item[], pinned?: boolean }

const KEY = 'backupHistory'
const MAX = 10

export function loadHistory(): BackupEntry[]{
  try{
    const raw = localStorage.getItem(KEY)
    return raw? JSON.parse(raw): []
  }catch{ return [] }
}

export function saveHistory(list: BackupEntry[]){
  const size = JSON.stringify(list).length
  if(size>4_000_000){
    // signal to caller via exception (UI shows toast)
    throw new Error('Backup povijest je vrlo velika (>4MB)')
  }
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function rotateAndAdd(entry: BackupEntry){
  const list = [entry, ...loadHistory()].slice(0, MAX)
  saveHistory(list)
  return list
}

export function autoBackup(items: Item[], kind: string){
  const name = `auto_${kind}_${new Date().toISOString()}.csv`
  const entry: BackupEntry = { name, time: new Date().toLocaleString(), items: JSON.parse(JSON.stringify(items)) }
  const list = rotateAndAdd(entry)
  // also trigger file download for user
  const csv = toCSV(items)
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click()
  return { entry, list }
}
