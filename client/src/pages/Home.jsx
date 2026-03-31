import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ListingCard from '../components/listings/ListingCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Home() {
  const navigate = useNavigate();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    api.get('/listings?limit=6')
      .then((res) => setFeaturedListings(res.data.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?location=${encodeURIComponent(searchLocation)}`);
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&h=700&fit=crop"
            alt="Resort"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Rent a Luxury Resort Week<br />
            <span className="text-blue-200">Directly from the Owner</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Timeshare owners rent their unused weeks. You get a resort vacation at a fraction of hotel prices. Win-win.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex gap-2 bg-white rounded-xl p-2 shadow-xl">
              <input
                type="text"
                placeholder="Search by location, resort, or destination..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="flex-1 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
              />
              <button type="submit" className="btn-primary px-6 whitespace-nowrap">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: 'Browse Available Weeks', desc: 'Search verified listings from real timeshare owners. Filter by location, dates, guests, and price.' },
            { icon: '📅', title: 'Book Securely', desc: 'Select your week and pay via Stripe. Your payment is held until the owner confirms — no risk.' },
            { icon: '🏖️', title: 'Enjoy Your Stay', desc: 'Travel to a luxury resort at owner rates. Leave a review to help the community.' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured listings */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Listings</h2>
            <Link to="/browse" className="btn-secondary">View All</Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : featuredListings.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No listings yet. Be the first to list your week!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Owner CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Own a Timeshare?</h2>
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          Stop letting your weeks go unused. List them on UseMyTimeshare and earn rental income while covering your maintenance fees.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register?role=OWNER" className="btn-primary px-8 py-3 text-base">List Your Week Free</Link>
          <a href="#" className="btn-secondary px-8 py-3 text-base">Learn More</a>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-6 text-center">
          {[
            { stat: '10%', label: 'Platform fee only' },
            { stat: '0', label: 'Listing fee' },
            { stat: '24h', label: 'Avg booking response' },
          ].map((item, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-blue-600">{item.stat}</div>
              <div className="text-sm text-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
