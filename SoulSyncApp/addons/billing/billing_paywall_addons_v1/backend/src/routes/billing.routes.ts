import { Router } from 'express'
import Stripe from 'stripe'
import { setActive } from '../services/entitlementService'

const router = Router()
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || ''
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8080'

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

// Create hosted Checkout Session (no external JS required)
router.post('/api/billing/create-checkout-session', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId_required' })
    if (!STRIPE_PRICE_ID) return res.status(500).json({ error: 'missing_price_id' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${APP_BASE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/billing/cancel`,
      metadata: { userId }
    })
    return res.json({ url: session.url })
  } catch (e:any) {
    return res.status(500).json({ error: 'stripe_error', message: e.message })
  }
})

// Webhook to activate entitlement when payment succeeds
router.post('/api/billing/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string
    const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
    let event = req.body

    if (secret) {
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
      event = stripe.webhooks.constructEvent(req['rawBody'] || req.body, sig, secret)
    }

    const type = event.type || event['type']
    if (type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (userId) await setActive(userId, true)
    }
    res.status(200).send('[ok]')
  } catch (e:any) {
    res.status(400).json({ error: 'webhook_error', message: e.message })
  }
})

export default router
