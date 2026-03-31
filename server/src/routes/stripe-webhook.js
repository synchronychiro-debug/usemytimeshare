const express = require('express');
const prisma = require('../lib/prisma');
const { constructWebhookEvent } = require('../services/stripe');

const router = express.Router();

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      await prisma.booking.updateMany({
        where: { stripePaymentIntentId: pi.id, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      const booking = await prisma.booking.findFirst({
        where: { stripePaymentIntentId: pi.id },
      });
      if (booking) {
        await prisma.$transaction([
          prisma.booking.update({ where: { id: booking.id }, data: { status: 'DECLINED' } }),
          prisma.availableWeek.update({ where: { id: booking.weekId }, data: { isBooked: false } }),
        ]);
      }
      break;
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object;
      const booking = await prisma.booking.findFirst({
        where: { stripePaymentIntentId: pi.id },
      });
      if (booking && booking.status === 'PENDING') {
        await prisma.$transaction([
          prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }),
          prisma.availableWeek.update({ where: { id: booking.weekId }, data: { isBooked: false } }),
        ]);
      }
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
});

module.exports = router;
