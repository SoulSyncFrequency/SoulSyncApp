import { create } from 'zustand'

type NState = {
  unread: number
  lastSeenId: number
  setUnread: (n:number)=>void
  setLastSeenId: (id:number)=>void
}

export const useNotificationsState = create<NState>((set)=> ({
  unread: 0,
  lastSeenId: 0,
  setUnread: (n)=> set({ unread: n }),
  setLastSeenId: (id)=> set({ lastSeenId: id })
}))