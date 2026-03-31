const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      isVerified: true,
      createdAt: true,
      listings: {
        where: { status: 'ACTIVE' },
        select: { id: true, title: true, location: true, pricePerWeek: true, photos: true, avgRating: true },
        take: 10,
      },
      reviewsReceived: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/users/me — update own profile
router.put('/me', authenticate, async (req, res) => {
  const schema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  });

  const data = schema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// PUT /api/users/me/password
router.put('/me/password', authenticate, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
  });

  const { currentPassword, newPassword } = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
  res.json({ message: 'Password updated' });
});

// GET /api/users/me/bookings — own bookings
router.get('/me/bookings', authenticate, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { renterId: req.user.id },
    include: {
      listing: {
        select: { id: true, title: true, resortName: true, location: true, photos: true },
      },
      week: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bookings);
});

module.exports = router;
