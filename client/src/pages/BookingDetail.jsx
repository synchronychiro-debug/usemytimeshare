import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StarRating from '../components/common/StarRating';
import { formatCurrency, formatDate, formatDateRange } from '../utils/format';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  DECLINED: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function BookingDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const justConfirmed = searchParams.get('confirmed') === 'true';

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then((res) => setBooking(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!booking) return <div className="text-center py-16 text-gray-500">Booking not found</div>;

  const isOwner = booking.listing?.ownerId === user.id;
  const isRenter = booking.renterId === user.id;
  const canReview = isRenter && booking.status === 'COMPLETED' && !booking.review;

  const handleCancelBooking = async () => {
    if (!confirm('Cancel this booking? You will be refunded.')) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled and refund initiated');
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (review.rating === 0) return toast.error('Please select a rating');
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { bookingId: id, rating: review.rating, comment: review.comment });
      toast.success('Review submitted!');
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const { listing, week, renter } = booking;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {justConfirmed && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
          <div className="font-semibold text-lg mb-1">Payment Received!</div>
          <p className="text-sm">Your booking request has been submitted. The owner will confirm within 24 hours and you'll receive an email notification.</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Booking Details</h1>
        <Link to="/dashboard" className="btn-secondary text-sm">← Dashboard</Link>
      </div>

      <div className="card p-6 space-y-6">
        {/* Status */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${STATUS_STYLES[booking.status]}`}>
          <div className="text-2xl">
            {booking.status === 'CONFIRMED' ? '✅' : booking.status === 'PENDING' ? '⏳' : booking.status === 'COMPLETED' ? '🎉' : '❌'}
          </div>
          <div>
            <div className="font-semibold">Status: {booking.status}</div>
            <div className="text-xs opacity-75">
              {booking.status === 'PENDING' && 'Waiting for owner confirmation'}
              {booking.status === 'CONFIRMED' && 'Your booking is confirmed!'}
              {booking.status === 'COMPLETED' && 'Stay completed'}
              {booking.status === 'DECLINED' && 'Booking declined — full refund issued'}
              {booking.status === 'CANCELLED' && 'Booking cancelled — refund issued'}
            </div>
          </div>
        </div>

        {/* Listing */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Property</h2>
          <div className="flex items-start gap-4">
            {listing?.photos?.[0] && (
              <img src={listing.photos[0]} alt="" className="w-20 h-16 rounded-lg object-cover flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <div>
              <Link to={`/listings/${listing?.id}`} className="font-semibold hover:text-blue-600">{listing?.title}</Link>
              <p className="text-sm text-gray-500">{listing?.resortName}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        {week && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Dates</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Check-in</span><p className="font-medium mt-0.5">{formatDate(week.startDate)}</p></div>
              <div><span className="text-gray-500">Check-out</span><p className="font-medium mt-0.5">{formatDate(week.endDate)}</p></div>
            </div>
          </div>
        )}

        {/* Guests */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Guests</h2>
          <p className="text-sm font-medium">{booking.guestCount} guest{booking.guestCount > 1 ? 's' : ''}</p>
          {booking.specialRequests && (
            <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Special requests:</span> {booking.specialRequests}</p>
          )}
        </div>

        {/* Payment */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Payment</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Rental amount</span><span>{formatCurrency(booking.totalAmount)}</span></div>
            {isOwner && <div className="flex justify-between"><span className="text-gray-600">Platform fee (10%)</span><span>-{formatCurrency(booking.platformFee)}</span></div>}
            {isOwner && <div className="flex justify-between font-bold border-t pt-2"><span>Your payout</span><span>{formatCurrency(booking.ownerPayout)}</span></div>}
            {isRenter && !isOwner && <div className="flex justify-between font-bold"><span>Total charged</span><span>{formatCurrency(booking.totalAmount)}</span></div>}
          </div>
        </div>

        {/* Renter info (for owners) */}
        {isOwner && renter && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Renter</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                {renter.firstName?.[0]}{renter.lastName?.[0]}
              </div>
              <div>
                <p className="font-medium">{renter.firstName} {renter.lastName}</p>
                <p className="text-sm text-gray-500">{renter.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {isRenter && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
          <button onClick={handleCancelBooking} className="btn-danger w-full">Cancel Booking</button>
        )}

        {/* Leave review */}
        {canReview && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Leave a Review</h2>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="label">Your Rating</label>
                <StarRating
                  rating={review.rating}
                  size="lg"
                  interactive
                  onChange={(r) => setReview({ ...review, rating: r })}
                />
              </div>
              <div>
                <label className="label">Comment (optional)</label>
                <textarea
                  className="input min-h-[100px] resize-none"
                  placeholder="Share your experience..."
                  value={review.comment}
                  onChange={(e) => setReview({ ...review, comment: e.target.value })}
                />
              </div>
              <button type="submit" disabled={submittingReview || review.rating === 0} className="btn-primary w-full">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        {/* Existing review */}
        {booking.review && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Your Review</h2>
            <StarRating rating={booking.review.rating} size="md" />
            {booking.review.comment && <p className="text-gray-700 text-sm mt-2">{booking.review.comment}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
