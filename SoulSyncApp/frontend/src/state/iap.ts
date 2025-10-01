import { addProduct } from './billingState'

export type ProductKey = 'direct'|'questionnaire'|'verifier'

export async function purchase(product: ProductKey){
  // TODO: Integrate StoreKit / Play Billing. For now, simulate success:
  addProduct(product)
  return { ok: true }
}

export async function restorePurchases(){
  // TODO: Integrate restore flow
  return { ok: true }
}
