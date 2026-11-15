import Stripe from 'stripe'

let stripeClient: Stripe | null | undefined

export function getStripeClient() {
  if (stripeClient !== undefined) return stripeClient
  stripeClient = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
  return stripeClient
}
