const Stripe = require('stripe');

let stripe;
function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
  return stripe;
}

/**
 * Create a PaymentIntent (holds funds, does not capture immediately).
 * capture_method: 'manual' means we hold the card and only charge on confirmation.
 */
async function createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
  return getStripe().paymentIntents.create({
    amount,
    currency,
    capture_method: 'manual',
    metadata,
  });
}

/**
 * Capture a previously created PaymentIntent (charge the card).
 */
async function capturePayment(paymentIntentId) {
  return getStripe().paymentIntents.capture(paymentIntentId);
}

/**
 * Cancel a PaymentIntent (releases hold, no charge).
 */
async function refundPayment(paymentIntentId) {
  try {
    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (pi.status === 'requires_capture') {
      return getStripe().paymentIntents.cancel(paymentIntentId);
    }
    if (pi.status === 'succeeded') {
      return getStripe().refunds.create({ payment_intent: paymentIntentId });
    }
    // Already cancelled or not chargeable
    return pi;
  } catch (err) {
    console.error('Stripe refund error:', err.message);
    throw err;
  }
}

/**
 * Construct a Stripe webhook event from raw body + signature.
 */
function constructWebhookEvent(rawBody, signature) {
  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = { createPaymentIntent, capturePayment, refundPayment, constructWebhookEvent };
