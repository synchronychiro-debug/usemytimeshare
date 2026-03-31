const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { uploadPhotos, uploadIcal } = require('../middleware/upload');
const { parseIcalFile } = require('../services/ical');

const router = express.Router();

const listingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  resortName: z.string().min(2),
  location: z.string().min(2),
  state: z.string().optional(),
  country: z.string().default('US'),
  membershipTier: z.string().min(1),
  unitSize: z.string().min(1),
  maxGuests: z.coerce.number().int().min(1).max(20),
  pricePerWeek: z.coerce.number().positive(),
  amenities: z.preprocess((v) => (typeof v === 'string' ? JSON.parse(v) : v), z.array(z.string())).default([]),
  photos: z.preprocess((v) => (typeof v === 'string' ? JSON.parse(v) : v), z.array(z.string())).default([]),
});

// GET /api/listings — browse & search
router.get('/', optionalAuth, async (req, res) => {
  const { location, minGuests, maxPrice, minPrice, startDate, endDate, page = 1, limit = 12 } = req.query;

  const where = {
    status: 'ACTIVE',
    ...(location && {
      OR: [
        { location: { contains: location, mode: 'insensitive' } },
        { resortName: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
      ],
    }),
    ...(minGuests && { maxGuests: { gte: parseInt(minGuests) } }),
    ...(maxPrice && { pricePerWeek: { lte: parseFloat(maxPrice) } }),
    ...(minPrice && { pricePerWeek: { gte: parseFloat(minPrice) } }),
    ...(startDate &&
      endDate && {
        availableWeeks: {
          some: {
            startDate: { gte: new Date(startDate) },
            endDate: { lte: new Date(endDate) },
            isBooked: false,
          },
        },
      }),
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true } },
        availableWeeks: { where: { isBooked: false }, orderBy: { startDate: 'asc' }, take: 3 },
        _count: { select: { availableWeeks: { where: { isBooked: false } } } },
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({
    listings,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/listings/my — owner's own listings
router.get('/my', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { ownerId: req.user.id },
    include: {
      availableWeeks: { orderBy: { startDate: 'asc' } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(listings);
});

// GET /api/listings/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true, bio: true, createdAt: true } },
      availableWeeks: { where: { isBooked: false }, orderBy: { startDate: 'asc' } },
      bookings: {
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        select: { week: { select: { startDate: true, endDate: true } } },
      },
    },
  });

  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== 'ACTIVE' && listing.ownerId !== req.user?.id) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  res.json(listing);
});

// POST /api/listings — create listing
router.post('/', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const data = listingSchema.parse(req.body);
  const listing = await prisma.listing.create({
    data: { ...data, ownerId: req.user.id },
  });
  res.status(201).json(listing);
});

// PUT /api/listings/:id — update listing
router.put('/:id', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const data = listingSchema.partial().parse(req.body);
  const updated = await prisma.listing.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

// DELETE /api/listings/:id
router.delete('/:id', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await prisma.listing.update({
    where: { id: req.params.id },
    data: { status: 'INACTIVE' },
  });
  res.json({ message: 'Listing deactivated' });
});

// POST /api/listings/:id/photos — upload photos
router.post('/:id/photos', authenticate, requireRole('OWNER', 'ADMIN'), (req, res, next) => {
  uploadPhotos(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const newPhotos = req.files.map((f) => `/uploads/photos/${f.filename}`);
    const existing = Array.isArray(listing.photos) ? listing.photos : [];
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { photos: [...existing, ...newPhotos] },
    });
    res.json({ photos: updated.photos });
  });
});

// POST /api/listings/:id/weeks — add available weeks manually
router.post('/:id/weeks', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const schema = z.object({
    weeks: z.array(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    ),
  });

  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { weeks } = schema.parse(req.body);
  const created = await prisma.availableWeek.createMany({
    data: weeks.map((w) => ({
      listingId: req.params.id,
      startDate: new Date(w.startDate),
      endDate: new Date(w.endDate),
    })),
    skipDuplicates: true,
  });
  res.status(201).json({ created: created.count });
});

// DELETE /api/listings/:id/weeks/:weekId — remove a week
router.delete('/:id/weeks/:weekId', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const week = await prisma.availableWeek.findUnique({ where: { id: req.params.weekId } });
  if (!week || week.listingId !== req.params.id) return res.status(404).json({ error: 'Week not found' });
  if (week.isBooked) return res.status(400).json({ error: 'Cannot remove a booked week' });

  await prisma.availableWeek.delete({ where: { id: req.params.weekId } });
  res.json({ message: 'Week removed' });
});

// POST /api/listings/:id/ical — upload iCal file
router.post('/:id/ical', authenticate, requireRole('OWNER', 'ADMIN'), (req, res, next) => {
  uploadIcal(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    try {
      const weeks = await parseIcalFile(req.file.path);
      if (weeks.length === 0) return res.status(400).json({ error: 'No valid weekly events found in iCal file' });

      const created = await prisma.availableWeek.createMany({
        data: weeks.map((w) => ({
          listingId: req.params.id,
          startDate: new Date(w.start),
          endDate: new Date(w.end),
        })),
        skipDuplicates: true,
      });

      res.json({ message: `Imported ${created.count} available weeks`, count: created.count });
    } catch (e) {
      res.status(400).json({ error: 'Failed to parse iCal file: ' + e.message });
    }
  });
});

// POST /api/listings/:id/flag — report a listing
router.post('/:id/flag', authenticate, async (req, res) => {
  const schema = z.object({ reason: z.string().min(10).max(500) });
  const { reason } = schema.parse(req.body);

  const existing = await prisma.flag.findFirst({
    where: { listingId: req.params.id, userId: req.user.id },
  });
  if (existing) return res.status(409).json({ error: 'You have already reported this listing' });

  await prisma.flag.create({
    data: { listingId: req.params.id, userId: req.user.id, reason },
  });
  res.status(201).json({ message: 'Report submitted' });
});

module.exports = router;
