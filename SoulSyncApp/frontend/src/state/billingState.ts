import { atom } from 'jotai'

// List of purchased features (e.g. ['direct','therapy','nutrition'])
export const ownedProductsAtom = atom<string[]>(() => {
  try {
    return JSON.parse(localStorage.getItem('ownedProducts') || '[]')
  } catch {
    return []
  }
})

export const isProAtom = atom((get)=>{
  const owned = get(ownedProductsAtom)
  return owned.length >= 1
})

export function addProduct(product: string){
  const owned = JSON.parse(localStorage.getItem('ownedProducts') || '[]')
  if(!owned.includes(product)){
    owned.push(product)
    localStorage.setItem('ownedProducts', JSON.stringify(owned))
  }
}
