export class LRU<K, V> {
  private map = new Map<K, { value: V, ts: number }>()
  constructor(private max = 500, private ttlMs = 5*60*1000) {}
  get(key: K): V | undefined {
    const hit = this.map.get(key)
    if(!hit) return undefined
    if(Date.now() - hit.ts > this.ttlMs){ this.map.delete(key); return undefined }
    // refresh recency
    this.map.delete(key); this.map.set(key, { value: hit.value, ts: Date.now() })
    return hit.value
  }
  set(key: K, value: V){
    if(this.map.size >= this.max){
      // delete oldest
      const k = this.map.keys().next().value
      this.map.delete(k)
    }
    this.map.set(key, { value, ts: Date.now() })
  }
}
