const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { createPaymentIntent, capturePayment, refundPayment } = require('../services/stripe');
const { sendBookingConfirmation, sendBookingDeclined } = require('../services/email');

const router = express.Router();

const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT || '10') / 100;

// GET /api/bookings — owner sees all bookings for their listings
router.get('/', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: {
      listing: { ownerId: req.user.id },
    },
    include: {
      renter: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      listing: { select: { id: true, title: true, resortName: true, location: true } },
      week: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bookings);
});

// GET /api/bookings/my — renter sees their own bookings
router.get('/my', authenticate, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { renterId: req.user.id },
    include: {
      listing: {
        select: {
          id: true, title: true, resortName: true, location: true, photos: true,
          owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      week: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bookings);
});

// GET /api/bookings/:id
router.get('/:id', authenticate, async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      renter: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      listing: {
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      },
      week: true,
      review: true,
    },
  });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  // Only allow renter or listing owner to view
  const isOwner = booking.listing.ownerId === req.user.id;
  const isRenter = booking.renterId === req.user.id;
  if (!isOwner && !isRenter && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  res.json(booking);
});

// POST /api/bookings — renter initiates booking + Stripe payment intent
router.post('/', authenticate, async (req, res) => {
  const schema = z.object({
    weekId: z.string(),
    guestCount: z.coerce.number().int().min(1).default(1),
    specialRequests: z.string().max(1000).optional(),
  });

  const { weekId, guestCount, specialRequests } = schema.parse(req.body);

  const week = await prisma.availableWeek.findUnique({
    where: { id: weekId },
    include: { listing: { include: { owner: true } } },
  });

  if (!week) return res.status(404).json({ error: 'Week not found' });
  if (week.isBooked) return res.status(409).json({ error: 'This week is already booked' });
  if (week.listing.status !== 'ACTIVE') return res.status(400).json({ error: 'Listing is not available' });
  if (week.listing.ownerId === req.user.id) return res.status(400).json({ error: 'You cannot book your own listing' });
  if (guestCount > week.listing.maxGuests) {
    return res.status(400).json({ error: `Max guests for this unit is ${week.listing.maxGuests}` });
  }

  const totalAmount = parseFloat(week.listing.pricePerWeek);
  const platformFee = +(totalAmount * PLATFORM_FEE_PERCENT).toFixed(2);
  const ownerPayout = +(totalAmount - platformFee).toFixed(2);

  // Create Stripe payment intent
  const paymentIntent = await createPaymentIntent({
    amount: Math.round(totalAmount * 100), // cents
    currency: 'usd',
    metadata: {
      weekId,
      renterId: req.user.id,
      listingId: week.listingId,
    },
  });

  // Mark week as pending (optimistic)
  await prisma.availableWeek.update({ where: { id: weekId }, data: { isBooked: true } });

  const booking = await prisma.booking.create({
    data: {
      listingId: week.listingId,
      renterId: req.user.id,
      weekId,
      totalAmount,
      platformFee,
      ownerPayout,
      guestCount,
      specialRequests,
      stripePaymentIntentId: paymentIntent.id,
      status: 'PENDING',
    },
    include: {
      listing: { select: { id: true, title: true, resortName: true } },
      week: true,
    },
  });

  res.status(201).json({
    booking,
    clientSecret: paymentIntent.client_secret,
  });
});

// POST /api/bookings/:id/confirm — owner confirms booking
router.post('/:id/confirm', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      listing: true,
      renter: true,
      week: true,
    },
  });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (booking.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot confirm a booking with status: ${booking.status}` });
  }

  // Capture the Stripe payment
  await capturePayment(booking.stripePaymentIntentId);

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'CONFIRMED' },
  });

  await sendBookingConfirmation({ booking, renter: booking.renter, listing: booking.listing, week: booking.week });

  res.json(updated);
});

// POST /api/bookings/:id/decline — owner declines booking
router.post('/:id/decline', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { listing: true, renter: true, week: true },
  });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (booking.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot decline a booking with status: ${booking.status}` });
  }

  // Cancel/refund the Stripe payment intent
  await refundPayment(booking.stripePaymentIntentId);

  const [updated] = await prisma.$transaction([
    prisma.booking.update({ where: { id: req.params.id }, data: { status: 'DECLINED' } }),
    prisma.availableWeek.update({ where: { id: booking.weekId }, data: { isBooked: false } }),
  ]);

  await sendBookingDeclined({ booking, renter: booking.renter, listing: booking.listing });

  res.json(updated);
});

// POST /api/bookings/:id/cancel — renter cancels booking
router.post('/:id/cancel', authenticate, async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { listing: true },
  });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.renterId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return res.status(400).json({ error: `Cannot cancel a booking with status: ${booking.status}` });
  }

  await refundPayment(booking.stripePaymentIntentId);

  await prisma.$transaction([
    prisma.booking.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } }),
    prisma.availableWeek.update({ where: { id: booking.weekId }, data: { isBooked: false } }),
  ]);

  res.json({ message: 'Booking cancelled and refund initiated' });
});

module.exports = router;
