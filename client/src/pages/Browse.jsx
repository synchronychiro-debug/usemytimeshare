import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ListingCard from '../components/listings/ListingCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AMENITY_OPTIONS = [
  { value: 'pool', label: 'Pool' },
  { value: 'beach_access', label: 'Beach Access' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'parking', label: 'Parking' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'gym', label: 'Gym' },
  { value: 'spa', label: 'Spa' },
  { value: 'golf', label: 'Golf' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    minGuests: '',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const fetchListings = useCallback(async (f = filters, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 12 });
      if (f.location) params.set('location', f.location);
      if (f.minGuests) params.set('minGuests', f.minGuests);
      if (f.minPrice) params.set('minPrice', f.minPrice);
      if (f.maxPrice) params.set('maxPrice', f.maxPrice);
      if (f.startDate) params.set('startDate', f.startDate);
      if (f.endDate) params.set('endDate', f.endDate);

      const res = await api.get(`/listings?${params}`);
      setListings(res.data.listings || []);
      setPagination(res.data.pagination || {});
    } catch {}
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchListings(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings(filters, 1);
    setSearchParams(filters.location ? { location: filters.location } : {});
  };

  const clearFilters = () => {
    const empty = { location: '', minGuests: '', minPrice: '', maxPrice: '', startDate: '', endDate: '' };
    setFilters(empty);
    setPage(1);
    fetchListings(empty, 1);
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Available Weeks</h1>
        <p className="text-gray-600">Find and book timeshare weeks from verified owners</p>
      </div>

      {/* Search & Filter bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by location, resort..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary px-6">Search</button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-blue-500' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-600" />}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 card p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Check-in</label>
              <input type="date" className="input" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input type="date" className="input" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Min guests</label>
              <input type="number" className="input" placeholder="e.g. 4" min="1" max="20" value={filters.minGuests} onChange={(e) => setFilters({ ...filters, minGuests: e.target.value })} />
            </div>
            <div>
              <label className="label">Max price / week</label>
              <input type="number" className="input" placeholder="e.g. 2000" min="0" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-3">
              <button type="submit" className="btn-primary">Apply Filters</button>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="btn-secondary">Clear All</button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600 text-sm">
          {loading ? 'Searching...' : `${pagination.total || 0} listings found`}
        </p>
      </div>

      {/* Listings grid */}
      {loading ? (
        <LoadingSpinner />
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No listings found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or clearing filters</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
