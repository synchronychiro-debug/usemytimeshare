const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/listing/:listingId
router.get('/listing/:listingId', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { listingId: req.params.listingId },
    include: {
      reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
});

// POST /api/reviews — renter submits review after completed stay
router.post('/', authenticate, async (req, res) => {
  const schema = z.object({
    bookingId: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  });

  const { bookingId, rating, comment } = schema.parse(req.body);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true, review: true },
  });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.renterId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  if (booking.status !== 'COMPLETED') {
    return res.status(400).json({ error: 'You can only review completed bookings' });
  }
  if (booking.review) return res.status(409).json({ error: 'You have already reviewed this booking' });

  const review = await prisma.review.create({
    data: {
      bookingId,
      reviewerId: req.user.id,
      revieweeId: booking.listing.ownerId,
      listingId: booking.listingId,
      rating,
      comment,
    },
  });

  // Recalculate listing average rating
  const { _avg, _count } = await prisma.review.aggregate({
    where: { listingId: booking.listingId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.listing.update({
    where: { id: booking.listingId },
    data: {
      avgRating: _avg.rating ? Math.round(_avg.rating * 10) / 10 : null,
      totalReviews: _count.rating,
    },
  });

  res.status(201).json(review);
});

module.exports = router;
