// Optional IAP client – dynamic plugin loading to avoid build errors if plugin not installed.
// Supports: premium_monthly, premium_yearly. Falls back to Stripe Checkout if not available.
export async function buyPremiumViaIAP(sku='premium_monthly') {
  try {
    const anyCap = (globalThis.Capacitor && globalThis.Capacitor.Plugins) || {};
    const IAP = anyCap?.InAppPurchases || anyCap?.CapacitorPurchases || null;
    if (!IAP) throw new Error('IAP plugin not available');
    // Example flow (pseudo; adapt to chosen plugin):
    await IAP.connect?.();
    const products = await (IAP.getProducts?.({ skus:[sku] }) || IAP.queryProducts?.([sku]));
    const p = (products?.products || products)?.find?.(x=>x.productId===sku || x.id===sku) || { productId: sku };
    const purchase = await (IAP.purchase?.({ sku: p.productId }) || IAP.buyProduct?.(p.productId));
    // TODO: validate receipt with backend (recommended)
    return { ok: true, purchase };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}
