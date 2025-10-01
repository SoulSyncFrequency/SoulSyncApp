import { Router } from 'express'
import Stripe from 'stripe'
import { prisma } from '../db/prismaClient'
import express from 'express'
const r=Router()
const stripe=new Stripe(process.env.STRIPE_SECRET||'',{apiVersion:'2022-11-15'})
r.post('/webhooks/stripe',express.raw({type:'application/json'}),async(req:any,res)=>{
 try{
  const sig=req.headers['stripe-signature']
  const event=stripe.webhooks.constructEvent(req.body,sig||'',process.env.STRIPE_WEBHOOK_SECRET||'')
  if(event.type==='checkout.session.completed'){
    const s=event.data.object as any
    await prisma.payment.upsert({ where:{ id:s.id }, update:{ status:s.payment_status }, create:{ id:s.id, status:s.payment_status, provider:'stripe', meta:s } })
  }
  res.json({received:true})
 }catch(e:any){ console.error(e.message||e); res.status(400).send(`Webhook Error:${e.message||e}`)}
})
export default r
