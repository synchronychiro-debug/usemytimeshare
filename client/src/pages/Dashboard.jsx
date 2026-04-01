import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StarRating from '../components/common/StarRating';
import { formatCurrency, formatDate, formatDateRange } from '../utils/format';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

function BookingRow({ booking, isOwner, onConfirm, onDecline }) {
  const week = booking.week;
  const [expanding, setExpanding] = useState(false);

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/listings/${booking.listingId}`} className="font-semibold text-gray-900 hover:text-blue-600 truncate">
              {booking.listing?.title}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[booking.status]}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{booking.listing?.resortName} · {booking.listing?.location}</p>
          {week && (
            <p className="text-sm text-gray-700 mt-1">
              {formatDateRange(week.startDate, week.endDate)} · {booking.guestCount} guest{booking.guestCount > 1 ? 's' : ''}
            </p>
          )}
          {isOwner && booking.renter && (
            <p className="text-sm text-gray-500 mt-0.5">
              Renter: <span className="font-medium">{booking.renter.firstName} {booking.renter.lastName}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</div>
            {isOwner && (
              <div className="text-xs text-gray-500">Your payout: {formatCurrency(booking.ownerPayout)}</div>
            )}
          </div>

          {isOwner && booking.status === 'PENDING' && (
            <div className="flex gap-2">
              <button onClick={() => onConfirm(booking.id)} className="btn-primary text-sm py-1.5 px-4">Confirm</button>
              <button onClick={() => onDecline(booking.id)} className="btn-danger text-sm py-1.5 px-4">Decline</button>
            </div>
          )}
          {!isOwner && booking.status === 'COMPLETED' && !booking.review && (
            <Link to={`/bookings/${booking.id}`} className="btn-secondary text-sm py-1.5">Leave Review</Link>
          )}
          <Link to={`/bookings/${booking.id}`} className="text-xs text-blue-600 hover:underline">View details</Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isOwner } = useAuth();
  const [tab, setTab] = useState(isOwner ? 'incoming' : 'bookings');
  const [bookings, setBookings] = useState({ my: [], incoming: [] });
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests = [api.get('/bookings/my')];
    if (isOwner) requests.push(api.get('/listings/my'), api.get('/bookings'));

    Promise.all(requests)
      .then(([myBookingsRes, listingsRes, ownerBookingsRes]) => {
        setBookings({ my: myBookingsRes.data, incoming: ownerBookingsRes?.data || [] });
        if (listingsRes) setMyListings(listingsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOwner]);

  const handleConfirm = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      toast.success('Booking confirmed!');
      const res = await api.get('/bookings');
      setBookings((b) => ({ ...b, incoming: res.data }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm');
    }
  };

  const handleDecline = async (bookingId) => {
    if (!confirm('Decline this booking? The renter will be refunded.')) return;
    try {
      await api.post(`/bookings/${bookingId}/decline`);
      toast.success('Booking declined and renter refunded');
      const res = await api.get('/bookings');
      setBookings((b) => ({ ...b, incoming: res.data }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to decline');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const tabs = [
    ...(isOwner ? [
      { id: 'incoming', label: `Booking Requests${bookings.incoming?.filter((b) => b.status === 'PENDING').length > 0 ? ` (${bookings.incoming.filter((b) => b.status === 'PENDING').length})` : ''}` },
      { id: 'listings', label: 'My Listings' },
    ] : []),
    { id: 'bookings', label: 'My Bookings' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user.firstName}!</p>
        </div>
        {isOwner && (
          <Link to="/listings/new" className="btn-primary">+ List a Week</Link>
        )}
      </div>

      {/* Stats (owner) */}
      {isOwner && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Listings', value: myListings.filter((l) => l.status === 'ACTIVE').length },
            { label: 'Pending Requests', value: bookings.incoming?.filter((b) => b.status === 'PENDING').length || 0 },
            { label: 'Total Bookings', value: bookings.incoming?.filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status)).length || 0 },
            { label: 'Estimated Earnings', value: formatCurrency((bookings.incoming?.filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status)) || []).reduce((s, b) => s + parseFloat(b.ownerPayout), 0)) },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'incoming' && (
        <div className="space-y-4">
          {bookings.incoming?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No booking requests yet. Make sure your listings are active!</p>
            </div>
          ) : (
            bookings.incoming.map((b) => (
              <BookingRow key={b.id} booking={b} isOwner onConfirm={handleConfirm} onDecline={handleDecline} />
            ))
          )}
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🏠</div>
              <p className="mb-4">You haven't listed any weeks yet.</p>
              <Link to="/listings/new" className="btn-primary">List Your First Week</Link>
            </div>
          ) : (
            myListings.map((listing) => (
              <div key={listing.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/listings/${listing.id}`} className="font-semibold hover:text-blue-600">{listing.title}</Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${listing.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {listing.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{listing.resortName} · {listing.location}</p>
                  <p className="text-sm mt-1 text-gray-700">
                    {listing.availableWeeks?.filter((w) => !w.isBooked).length || 0} available weeks
                    {listing.avgRating && <> · <StarRating rating={listing.avgRating} size="sm" /> {listing.avgRating}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{formatCurrency(listing.pricePerWeek)}<span className="text-sm font-normal text-gray-500">/wk</span></span>
                  <Link to={`/listings/${listing.id}/edit`} className="btn-secondary text-sm">Edit</Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-4">
          {bookings.my?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🏖️</div>
              <p className="mb-4">You haven't booked any weeks yet.</p>
              <Link to="/browse" className="btn-primary">Browse Available Weeks</Link>
            </div>
          ) : (
            bookings.my.map((b) => (
              <BookingRow key={b.id} booking={b} isOwner={false} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
