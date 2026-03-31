import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';
import { formatCurrency, formatDate } from '../../utils/format';

const AMENITY_ICONS = {
  pool: '🏊',
  beach_access: '🏖️',
  kitchen: '🍳',
  parking: '🚗',
  wifi: '📶',
  gym: '💪',
  spa: '🧖',
  golf: '⛳',
  ski: '⛷️',
  pet_friendly: '🐾',
};

export default function ListingCard({ listing }) {
  const photo = Array.isArray(listing.photos) && listing.photos[0]
    ? listing.photos[0]
    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';

  const nextWeek = listing.availableWeeks?.[0];
  const amenities = Array.isArray(listing.amenities) ? listing.amenities.slice(0, 4) : [];

  return (
    <Link to={`/listings/${listing.id}`} className="card overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
        <img
          src={photo}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'; }}
        />
        {listing.isVerified && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            ✓ Verified
          </span>
        )}
        <span className="absolute top-2 right-2 bg-white/90 text-gray-800 text-xs px-2 py-0.5 rounded-full font-semibold">
          {listing.membershipTier}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
            <p className="text-sm text-gray-500 truncate">{listing.resortName} · {listing.location}</p>
          </div>
          {listing.avgRating && (
            <div className="flex-shrink-0">
              <StarRating rating={listing.avgRating} count={listing.totalReviews} />
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {amenities.map((a) => (
            <span key={a} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {AMENITY_ICONS[a] || ''} {a.replace('_', ' ')}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(listing.pricePerWeek)}</span>
            <span className="text-sm text-gray-500"> / week</span>
          </div>
          <div className="text-right text-xs text-gray-500">
            {listing._count?.availableWeeks > 0 ? (
              <span className="text-green-600 font-medium">{listing._count.availableWeeks} weeks available</span>
            ) : (
              <span className="text-gray-400">Check availability</span>
            )}
          </div>
        </div>

        {nextWeek && (
          <p className="mt-1 text-xs text-gray-400">
            Next: {formatDate(nextWeek.startDate)}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 border-t pt-3">
          {listing.owner?.avatarUrl ? (
            <img src={listing.owner.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">
              {listing.owner?.firstName?.[0]}
            </div>
          )}
          <span>{listing.owner?.firstName} {listing.owner?.lastName?.[0]}.</span>
          <span>·</span>
          <span>{listing.unitSize} · Up to {listing.maxGuests} guests</span>
        </div>
      </div>
    </Link>
  );
}
