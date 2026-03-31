# UseMyTimeshare.com

Peer-to-peer timeshare rental marketplace — owners list unused weeks, renters book them directly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (7-day expiry) |
| Payments | Stripe (capture-on-confirm flow) |
| Calendar | iCal.js for `.ics` parsing + manual picker |

---

## Project Structure

```
usemytimeshare/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Navbar, Footer, LoadingSpinner, StarRating
│   │   │   └── listings/        # ListingCard
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT auth state
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Browse.jsx       # Search + filter listings
│   │   │   ├── ListingDetail.jsx
│   │   │   ├── CreateListing.jsx  # 2-step wizard
│   │   │   ├── EditListing.jsx
│   │   │   ├── Checkout.jsx     # Stripe payment
│   │   │   ├── Dashboard.jsx    # Owner + renter views
│   │   │   ├── BookingDetail.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── utils/
│   │       ├── api.js           # Axios instance
│   │       └── format.js        # Date/currency helpers
│   └── .env.example
│
└── server/                      # Express API
    ├── prisma/
    │   ├── schema.prisma         # Full database schema
    │   └── seed.js               # Demo data
    ├── src/
    │   ├── index.js              # App entry point
    │   ├── lib/
    │   │   └── prisma.js         # Prisma client singleton
    │   ├── middleware/
    │   │   ├── auth.js           # JWT authenticate/requireRole/optionalAuth
    │   │   ├── upload.js         # Multer for photos + iCal
    │   │   └── errorHandler.js   # Global error handler
    │   ├── routes/
    │   │   ├── auth.js           # POST /register, POST /login, GET /me
    │   │   ├── users.js          # GET /users/:id, PUT /users/me
    │   │   ├── listings.js       # CRUD + photos + weeks + iCal + flag
    │   │   ├── bookings.js       # Book, confirm, decline, cancel
    │   │   ├── reviews.js        # Post-stay reviews
    │   │   └── stripe-webhook.js # Stripe event handler
    │   └── services/
    │       ├── stripe.js         # createPaymentIntent, capture, refund
    │       ├── ical.js           # Parse .ics files
    │       └── email.js          # Booking emails via Nodemailer
    └── .env.example
```

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo>
cd usemytimeshare
npm install        # installs root + workspace deps
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Fill in: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, SMTP_*

# Client
cp client/.env.example client/.env
# Fill in: VITE_STRIPE_PUBLISHABLE_KEY
```

### 3. Database setup

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js     # creates demo accounts + listing
```

### 4. Run development

```bash
# From root (runs both client + server)
npm run dev

# Or separately:
cd server && npm run dev      # http://localhost:5000
cd client && npm run dev      # http://localhost:5173
```

---

## Database Schema

```
Users           → Listings (owner)
                → Bookings (renter)
                → Reviews (reviewer / reviewee)
                → Flags

Listings        → AvailableWeeks
                → Bookings
                → Reviews
                → Flags

Bookings        → Listing
                → User (renter)
                → AvailableWeek (1:1)
                → Review (optional)
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (returns JWT) |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Get current user |

### Listings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/listings` | Optional | Browse + search + filter |
| GET | `/api/listings/my` | OWNER | Owner's own listings |
| GET | `/api/listings/:id` | Optional | Listing detail |
| POST | `/api/listings` | OWNER | Create listing |
| PUT | `/api/listings/:id` | OWNER | Update listing |
| DELETE | `/api/listings/:id` | OWNER | Deactivate listing |
| POST | `/api/listings/:id/photos` | OWNER | Upload photos (multipart) |
| POST | `/api/listings/:id/weeks` | OWNER | Add available weeks |
| DELETE | `/api/listings/:id/weeks/:weekId` | OWNER | Remove a week |
| POST | `/api/listings/:id/ical` | OWNER | Upload `.ics` file |
| POST | `/api/listings/:id/flag` | Auth | Report listing |

### Bookings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookings` | OWNER | Incoming bookings for owner |
| GET | `/api/bookings/my` | Auth | Renter's own bookings |
| GET | `/api/bookings/:id` | Auth | Booking detail |
| POST | `/api/bookings` | Auth | Create booking + payment intent |
| POST | `/api/bookings/:id/confirm` | OWNER | Confirm + capture payment |
| POST | `/api/bookings/:id/decline` | OWNER | Decline + cancel PI |
| POST | `/api/bookings/:id/cancel` | Auth | Renter cancels |

### Reviews
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reviews/listing/:listingId` | — | Reviews for a listing |
| POST | `/api/reviews` | Auth | Submit post-stay review |

---

## Stripe Setup

1. Create a Stripe account at stripe.com
2. Add `STRIPE_SECRET_KEY=sk_test_...` to `server/.env`
3. Add `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` to `client/.env`
4. For webhooks (local testing): `stripe listen --forward-to localhost:5000/api/webhooks/stripe`
5. Add `STRIPE_WEBHOOK_SECRET=whsec_...` to `server/.env`

**Payment flow:**
1. Renter clicks "Reserve" → creates `PaymentIntent` with `capture_method: manual`
2. Renter enters card → payment authorized (hold, not charged)
3. Owner confirms → `capturePayment()` charges the card
4. Owner declines → `cancelPaymentIntent()` releases hold, no charge

**Platform fee:** 10% taken at booking time, reflected in `platformFee` and `ownerPayout` fields.

---

## Demo Accounts

After running seed:
- **Owner:** `owner@example.com` / `password123`
- **Renter:** `renter@example.com` / `password123`

---

## Deploying

### Vercel (Frontend)
```bash
cd client
vercel deploy
# Set VITE_STRIPE_PUBLISHABLE_KEY in Vercel env vars
```

### Render / Railway (Backend)
- Set all env vars from `server/.env.example`
- Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command: `node src/index.js`

### Replit
- Import repo, set secrets from `.env.example`
- Run `npm run dev` in root

---

## Future Enhancements

- [ ] Owner Stripe Connect (direct payouts)
- [ ] Photo upload (S3/Cloudinary)
- [ ] Email verification
- [ ] Admin dashboard for verified badges
- [ ] Google Maps integration
- [ ] Mobile app (React Native)
