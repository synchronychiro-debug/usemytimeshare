import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StarRating from '../components/common/StarRating';
import ListingCard from '../components/listings/ListingCard';
import { formatDate, formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const isOwnProfile = currentUser?.id === id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/users/${id}`)
      .then((res) => {
        setProfile(res.data);
        setForm({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          bio: res.data.bio || '',
          avatarUrl: res.data.avatarUrl || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/me', form);
      toast.success('Profile updated!');
      await refreshUser();
      const res = await api.get(`/users/${id}`);
      setProfile(res.data);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!profile) return <div className="text-center py-16 text-gray-500">User not found</div>;

  const avgRating = profile.reviewsReceived?.length > 0
    ? profile.reviewsReceived.reduce((s, r) => s + r.rating, 0) / profile.reviewsReceived.length
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </div>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">First name</label>
                    <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Last name</label>
                    <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea className="input resize-none" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell renters a bit about yourself..." />
                </div>
                <div>
                  <label className="label">Avatar URL</label>
                  <input className="input" type="url" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      {profile.isVerified && <span className="text-blue-600 font-medium">✓ Verified</span>}
                      <span>Member since {formatDate(profile.createdAt)}</span>
                    </div>
                    {avgRating && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating rating={avgRating} size="sm" />
                        <span className="text-sm text-gray-500">({profile.reviewsReceived.length} reviews)</span>
                      </div>
                    )}
                  </div>
                  {isOwnProfile && (
                    <button onClick={() => setEditing(true)} className="btn-secondary text-sm">Edit Profile</button>
                  )}
                </div>
                {profile.bio && <p className="mt-3 text-gray-700">{profile.bio}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      {profile.listings?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isOwnProfile ? 'My Listings' : `${profile.firstName}'s Listings`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.listings.map((listing) => (
              <ListingCard key={listing.id} listing={{ ...listing, owner: profile }} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews received */}
      {profile.reviewsReceived?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Reviews</h2>
          <div className="space-y-4">
            {profile.reviewsReceived.map((review) => (
              <div key={review.id} className="card p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{review.reviewer?.firstName} {review.reviewer?.lastName?.[0]}.</span>
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
