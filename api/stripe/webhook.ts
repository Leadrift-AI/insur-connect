import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import getRawBody from 'raw-body';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecret) {
  console.warn('STRIPE_SECRET_KEY not set; webhook will fail');
}
const stripe = new Stripe(stripeSecret ?? '', {
  // Use your account's default API version if unset
  // apiVersion: '2025-08-27.basil',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic method guard
  if (req.method === 'GET') {
    return res.status(200).send('OK'); // health check
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET' });
  }

  // Stripe requires the exact raw body for signature verification
  let event: Stripe.Event;
  try {
    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let raw: string | Buffer;

    // For Vercel, the body is typically available directly
    if (typeof req.body === 'string') {
      raw = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      raw = req.body;
    } else if (req.body) {
      // If body exists but is neither string nor Buffer, stringify it
      raw = JSON.stringify(req.body);
    } else {
      console.error('No request body available');
      return res.status(400).json({ error: 'No request body available' });
    }

    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Signature verification failed:', err?.message);
    return res.status(400).json({ error: `Webhook Error: ${err?.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ checkout.session.completed', session.id);
        // TODO: activate subscription, link to user/org via session.metadata
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`✅ ${event.type}`, sub.id, sub.status);
        // TODO: upsert subscription status/plan in your DB
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice;
        console.log('✅ invoice.payment_succeeded', inv.id);
        // TODO: record successful invoice
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log('✅ payment_intent.succeeded', pi.id);
        break;
      }
      default: {
        // Minimal noise; still acknowledge
        console.log('ℹ️ Unhandled event type:', event.type);
      }
    }

    // Acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('💥 Webhook handler error:', err?.message);
    return res.status(500).json({ error: 'Internal handler error' });
  }
}