const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'OWNER',
      isVerified: true,
    },
  });

  const renter = await prisma.user.upsert({
    where: { email: 'renter@example.com' },
    update: {},
    create: {
      email: 'renter@example.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Chen',
      role: 'RENTER',
    },
  });

  const listing = await prisma.listing.upsert({
    where: { id: 'seed-listing-1' },
    update: {},
    create: {
      id: 'seed-listing-1',
      ownerId: owner.id,
      title: 'Oceanfront Paradise at Marriott Aruba',
      description: 'Beautiful 2-bedroom unit with stunning ocean views. Steps from the beach, full kitchen, private balcony.',
      resortName: 'Marriott Aruba Ocean Club',
      location: 'Aruba',
      state: 'Noord',
      country: 'AW',
      membershipTier: 'Platinum',
      unitSize: '2BR/2BA',
      maxGuests: 6,
      pricePerWeek: 1850.00,
      amenities: ['pool', 'beach_access', 'kitchen', 'parking', 'wifi', 'gym', 'spa'],
      photos: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      ],
      isVerified: true,
      avgRating: 4.8,
      totalReviews: 12,
    },
  });

  // Add some available weeks
  const weeks = [
    { start: '2026-06-07', end: '2026-06-14' },
    { start: '2026-06-14', end: '2026-06-21' },
    { start: '2026-07-05', end: '2026-07-12' },
    { start: '2026-08-02', end: '2026-08-09' },
  ];

  for (const week of weeks) {
    await prisma.availableWeek.create({
      data: {
        listingId: listing.id,
        startDate: new Date(week.start),
        endDate: new Date(week.end),
        isBooked: false,
      },
    });
  }

  console.log('Seed complete:', { owner: owner.email, renter: renter.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
