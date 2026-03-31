import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StarRating from '../components/common/StarRating';
import { formatCurrency, formatDate, formatDateRange } from '../utils/format';
import toast from 'react-hot-toast';

const AMENITY_LABELS = {
  pool: '🏊 Pool', beach_access: '🏖️ Beach Access', kitchen: '🍳 Full Kitchen',
  parking: '🚗 Parking', wifi: '📶 WiFi', gym: '💪 Fitness Center',
  spa: '🧖 Spa', golf: '⛳ Golf', ski: '⛷️ Ski-In/Out', pet_friendly: '🐾 Pet Friendly',
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [guestCount, setGuestCount] = useState(1);
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/listings/${id}`),
      api.get(`/reviews/listing/${id}`),
    ])
      .then(([listingRes, reviewsRes]) => {
        setListing(listingRes.data);
        setReviews(reviewsRes.data);
      })
      .catch(() => navigate('/browse'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!listing) return null;

  const photos = Array.isArray(listing.photos) && listing.photos.length > 0
    ? listing.photos
    : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'];

  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const isOwner = user?.id === listing.ownerId;

  const handleBook = () => {
    if (!user) return navigate('/login', { state: { from: { pathname: `/listings/${id}` } } });
    if (!selectedWeek) return toast.error('Please select a week first');
    navigate(`/checkout/${selectedWeek.id}?listingId=${id}&guests=${guestCount}`);
  };

  const handleFlag = async () => {
    try {
      await api.post(`/listings/${id}/flag`, { reason: flagReason });
      toast.success('Report submitted. Our team will review it.');
      setShowFlagModal(false);
      setFlagReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/browse" className="hover:text-blue-600">Browse</Link>
        <span className="mx-2">›</span>
        <span>{listing.location}</span>
        <span className="mx-2">›</span>
        <span className="text-gray-800 truncate">{listing.title}</span>
      </nav>

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
            {listing.avgRating && <StarRating rating={listing.avgRating} count={listing.totalReviews} />}
            <span>·</span>
            <span>{listing.resortName}</span>
            <span>·</span>
            <span>{listing.location}</span>
            {listing.isVerified && (
              <>
                <span>·</span>
                <span className="text-blue-600 font-medium">✓ Verified Listing</span>
              </>
            )}
          </div>
        </div>
        {isOwner && (
          <Link to={`/listings/${id}/edit`} className="btn-secondary whitespace-nowrap">Edit Listing</Link>
        )}
      </div>

      {/* Photo gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-8 rounded-2xl overflow-hidden">
        <div className="md:col-span-2">
          <img
            src={photos[selectedPhoto]}
            alt={listing.title}
            className="w-full h-72 md:h-96 object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'; }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {photos.slice(1, 4).map((p, i) => (
            <img
              key={i}
              src={p}
              alt=""
              onClick={() => setSelectedPhoto(i + 1)}
              className={`w-full h-24 md:h-28 object-cover cursor-pointer hover:opacity-90 transition-opacity ${selectedPhoto === i + 1 ? 'ring-2 ring-blue-500' : ''}`}
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400'; }}
            />
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 mb-6">
          {photos.map((_, i) => (
            <button key={i} onClick={() => setSelectedPhoto(i)} className={`w-2 h-2 rounded-full transition-colors ${selectedPhoto === i ? 'bg-blue-600' : 'bg-gray-300'}`} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Unit info */}
          <div className="flex flex-wrap gap-6 py-6 border-b">
            {[
              { label: 'Unit Size', value: listing.unitSize },
              { label: 'Max Guests', value: `${listing.maxGuests} guests` },
              { label: 'Membership', value: listing.membershipTier },
              { label: 'Country', value: listing.country },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</div>
                <div className="text-sm font-semibold mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="text-xl font-semibold mb-3">About this listing</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-lg">{AMENITY_LABELS[a]?.split(' ')[0] || '✓'}</span>
                    <span>{AMENITY_LABELS[a]?.split(' ').slice(1).join(' ') || a.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available weeks */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Weeks</h2>
            {listing.availableWeeks?.length === 0 ? (
              <p className="text-gray-500">No weeks currently available. Check back soon.</p>
            ) : (
              <div className="space-y-2">
                {listing.availableWeeks?.map((week) => (
                  <button
                    key={week.id}
                    onClick={() => setSelectedWeek(selectedWeek?.id === week.id ? null : week)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      selectedWeek?.id === week.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{formatDateRange(week.startDate, week.endDate)}</div>
                      <div className="text-sm text-gray-500">7 nights</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{formatCurrency(listing.pricePerWeek)}</div>
                      {selectedWeek?.id === week.id && (
                        <span className="text-xs text-blue-600 font-medium">Selected ✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Owner */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold mb-4">Your Host</h2>
            <div className="flex items-start gap-4">
              <Link to={`/users/${listing.owner.id}`} className="flex-shrink-0">
                {listing.owner.avatarUrl ? (
                  <img src={listing.owner.avatarUrl} className="w-16 h-16 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                    {listing.owner.firstName?.[0]}{listing.owner.lastName?.[0]}
                  </div>
                )}
              </Link>
              <div>
                <Link to={`/users/${listing.owner.id}`} className="font-semibold text-lg hover:text-blue-600">
                  {listing.owner.firstName} {listing.owner.lastName}
                  {listing.owner.isVerified && <span className="ml-2 text-sm text-blue-600">✓ Verified</span>}
                </Link>
                {listing.owner.bio && <p className="text-gray-600 text-sm mt-1">{listing.owner.bio}</p>}
                <p className="text-xs text-gray-400 mt-1">Member since {formatDate(listing.owner.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-2">
                Reviews
                {listing.avgRating && (
                  <span className="ml-3 text-base font-normal text-gray-500">
                    <StarRating rating={listing.avgRating} count={listing.totalReviews} size="md" />
                  </span>
                )}
              </h2>
              <div className="space-y-6 mt-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.reviewer?.firstName} {review.reviewer?.lastName?.[0]}.</span>
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.comment && <p className="text-gray-700 text-sm mt-1">{review.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flag */}
          {user && !isOwner && (
            <div className="pt-4 text-center">
              <button onClick={() => setShowFlagModal(true)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Report this listing
              </button>
            </div>
          )}
        </div>

        {/* Right: Booking widget */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">{formatCurrency(listing.pricePerWeek)}</span>
              <span className="text-gray-500">/ week</span>
            </div>

            {listing.avgRating && (
              <div className="flex items-center gap-1 mb-4 text-sm text-gray-600">
                <StarRating rating={listing.avgRating} size="sm" />
                <span>{listing.avgRating} ({listing.totalReviews} reviews)</span>
              </div>
            )}

            <div className="mb-4">
              <label className="label">Selected week</label>
              {selectedWeek ? (
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <div className="font-medium">{formatDateRange(selectedWeek.startDate, selectedWeek.endDate)}</div>
                  <button onClick={() => setSelectedWeek(null)} className="text-xs text-blue-600 hover:underline mt-1">
                    Change
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                  Select a week from the list above
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="label">Guests</label>
              <select
                className="input"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value))}
              >
                {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {selectedWeek && (
              <div className="mb-4 space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span>1 week rental</span>
                  <span>{formatCurrency(listing.pricePerWeek)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Platform fee (10%)</span>
                  <span>{formatCurrency(listing.pricePerWeek * 0.10)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(listing.pricePerWeek * 1.10)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={!selectedWeek}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {!user ? 'Sign In to Book' : selectedWeek ? 'Reserve This Week' : 'Select a Week'}
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
              You won't be charged until the owner confirms your booking
            </p>
          </div>
        </div>
      </div>

      {/* Flag modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Report This Listing</h3>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Please describe the issue (min 10 characters)"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleFlag} disabled={flagReason.length < 10} className="btn-danger flex-1">
                Submit Report
              </button>
              <button onClick={() => setShowFlagModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
