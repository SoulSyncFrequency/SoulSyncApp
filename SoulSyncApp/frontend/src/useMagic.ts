import { useState } from 'react'
export function useMagic(){
  const [value,setValue] = useState(0)
  const inc = () => setValue(v=>v+1)
  return { value, inc }
}
