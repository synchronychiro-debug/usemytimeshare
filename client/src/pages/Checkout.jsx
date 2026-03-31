import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDateRange } from '../utils/format';
import toast from 'react-hot-toast';

// Replace with your Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutForm({ booking, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${booking.id}?confirmed=true`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
    }
    // On success, Stripe redirects to return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>
      )}
      <button type="submit" disabled={!stripe || processing} className="btn-primary w-full py-3 text-base">
        {processing ? 'Processing...' : `Pay ${formatCurrency(booking.totalAmount)}`}
      </button>
      <p className="text-xs text-center text-gray-500">
        Your payment is held securely until the owner confirms your booking
      </p>
    </form>
  );
}

export default function Checkout() {
  const { weekId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const guestCount = parseInt(searchParams.get('guests') || '1');
  const listingId = searchParams.get('listingId');

  useEffect(() => {
    const initBooking = async () => {
      try {
        // First fetch listing info
        if (listingId) {
          const listingRes = await api.get(`/listings/${listingId}`);
          setListing(listingRes.data);
        }

        // Create booking + payment intent
        const res = await api.post('/bookings', { weekId, guestCount });
        setBooking(res.data.booking);
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to initialize checkout');
      } finally {
        setLoading(false);
      }
    };

    initBooking();
  }, [weekId, guestCount]);

  if (loading) return <LoadingSpinner fullPage />;

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">Unable to Proceed</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const week = booking?.week;
  const platformFeeAmount = listing ? parseFloat(listing.pricePerWeek) * 0.10 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Complete Your Booking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Summary */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Booking Summary</h2>

          {listing?.photos?.[0] && (
            <img
              src={listing.photos[0]}
              alt=""
              className="w-full h-40 object-cover rounded-xl mb-4"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900 text-base">{listing?.title || booking?.listing?.title}</p>
              <p className="text-gray-500">{listing?.resortName || booking?.listing?.resortName}</p>
            </div>

            {week && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium">Check-in / Check-out</p>
                <p className="text-gray-700 mt-0.5">{formatDateRange(week.startDate, week.endDate)}</p>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Guests</span>
              <span>{guestCount}</span>
            </div>

            <hr />

            <div className="flex justify-between text-gray-600">
              <span>1 week rental</span>
              <span>{formatCurrency(listing?.pricePerWeek || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Platform service fee (10%)</span>
              <span>{formatCurrency(platformFeeAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(booking?.totalAmount || 0)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <p className="font-semibold mb-1">How payment works</p>
            <p>Your card is authorized but <strong>not charged</strong> until the owner confirms. You'll receive an email confirmation or refund within 24 hours.</p>
          </div>
        </div>

        {/* Payment form */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm booking={booking} />
            </Elements>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No Stripe key configured. Add VITE_STRIPE_PUBLISHABLE_KEY to client .env</p>
              <p className="text-xs mt-2">clientSecret: {clientSecret ? 'present' : 'missing'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
