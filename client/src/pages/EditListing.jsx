import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';

const MEMBERSHIP_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Presidential', 'Diamond', 'Points-Based', 'Fixed Week', 'Other'];
const UNIT_SIZES = ['Studio', '1BR/1BA', '1BR/2BA', '2BR/2BA', '3BR/3BA', '4BR/4BA', 'Penthouse'];
const AMENITIES = [
  { value: 'pool', label: 'Pool' }, { value: 'beach_access', label: 'Beach Access' },
  { value: 'kitchen', label: 'Full Kitchen' }, { value: 'parking', label: 'Parking' },
  { value: 'wifi', label: 'WiFi' }, { value: 'gym', label: 'Fitness Center' },
  { value: 'spa', label: 'Spa' }, { value: 'golf', label: 'Golf' },
  { value: 'ski', label: 'Ski-In/Out' }, { value: 'pet_friendly', label: 'Pet Friendly' },
];

export default function EditListing() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [newWeek, setNewWeek] = useState({ startDate: '', endDate: '' });
  const [icalFile, setIcalFile] = useState(null);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then((res) => {
        const l = res.data;
        if (l.ownerId !== user.id && user.role !== 'ADMIN') {
          navigate('/dashboard');
          return;
        }
        setListing(l);
        setForm({
          title: l.title, description: l.description || '', resortName: l.resortName,
          location: l.location, state: l.state || '', country: l.country,
          membershipTier: l.membershipTier, unitSize: l.unitSize,
          maxGuests: l.maxGuests, pricePerWeek: l.pricePerWeek,
          amenities: Array.isArray(l.amenities) ? l.amenities : [],
          photos: Array.isArray(l.photos) ? l.photos : [],
        });
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;

  const toggleAmenity = (val) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(val) ? f.amenities.filter((a) => a !== val) : [...f.amenities, val],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/listings/${id}`, form);
      toast.success('Listing updated!');
      navigate(`/listings/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const addWeek = async () => {
    if (!newWeek.startDate || !newWeek.endDate) return toast.error('Select both dates');
    try {
      await api.post(`/listings/${id}/weeks`, { weeks: [newWeek] });
      toast.success('Week added!');
      const res = await api.get(`/listings/${id}`);
      setListing(res.data);
      setNewWeek({ startDate: '', endDate: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add week');
    }
  };

  const removeWeek = async (weekId) => {
    if (!confirm('Remove this week?')) return;
    try {
      await api.delete(`/listings/${id}/weeks/${weekId}`);
      toast.success('Week removed');
      setListing((l) => ({ ...l, availableWeeks: l.availableWeeks.filter((w) => w.id !== weekId) }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove week');
    }
  };

  const handleIcalUpload = async () => {
    if (!icalFile) return;
    const formData = new FormData();
    formData.append('ical', icalFile);
    try {
      const res = await api.post(`/listings/${id}/ical`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${res.data.count} weeks!`);
      const updated = await api.get(`/listings/${id}`);
      setListing(updated.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'iCal import failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>

      <div className="card p-6 space-y-5 mb-8">
        <h2 className="text-lg font-semibold">Listing Details</h2>

        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Resort Name</label>
            <input className="input" value={form.resortName || ''} onChange={(e) => setForm({ ...form, resortName: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Membership Tier</label>
            <select className="input" value={form.membershipTier || ''} onChange={(e) => setForm({ ...form, membershipTier: e.target.value })}>
              {MEMBERSHIP_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Unit Size</label>
            <select className="input" value={form.unitSize || ''} onChange={(e) => setForm({ ...form, unitSize: e.target.value })}>
              {UNIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Max Guests</label>
            <input type="number" className="input" min="1" max="20" value={form.maxGuests || ''} onChange={(e) => setForm({ ...form, maxGuests: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="label">Price / Week (USD)</label>
            <input type="number" className="input" min="0" value={form.pricePerWeek || ''} onChange={(e) => setForm({ ...form, pricePerWeek: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[80px] resize-none" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITIES.map((a) => (
              <label key={a.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${form.amenities?.includes(a.value) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="checkbox" className="sr-only" checked={form.amenities?.includes(a.value) || false} onChange={() => toggleAmenity(a.value)} />
                <span className={`w-4 h-4 rounded border-2 flex-shrink-0 ${form.amenities?.includes(a.value) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                <span className="text-sm">{a.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Manage weeks */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Manage Available Weeks</h2>

        {/* iCal */}
        <div className="flex gap-2">
          <input type="file" accept=".ics" onChange={(e) => setIcalFile(e.target.files[0])} className="input flex-1 text-sm" />
          <button onClick={handleIcalUpload} disabled={!icalFile} className="btn-secondary whitespace-nowrap">Import iCal</button>
        </div>

        {/* Manual add */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Check-in</label>
            <input type="date" className="input" value={newWeek.startDate} onChange={(e) => setNewWeek({ ...newWeek, startDate: e.target.value })} />
          </div>
          <div className="flex-1">
            <label className="label">Check-out</label>
            <input type="date" className="input" value={newWeek.endDate} onChange={(e) => setNewWeek({ ...newWeek, endDate: e.target.value })} />
          </div>
          <button onClick={addWeek} className="btn-secondary h-10 px-4">Add</button>
        </div>

        {/* Existing weeks */}
        {listing?.availableWeeks?.length > 0 ? (
          <div className="space-y-2">
            {listing.availableWeeks.map((week) => (
              <div key={week.id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${week.isBooked ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <span>{formatDate(week.startDate)} → {formatDate(week.endDate)}</span>
                <div className="flex items-center gap-2">
                  {week.isBooked && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Booked</span>}
                  {!week.isBooked && (
                    <button onClick={() => removeWeek(week.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No weeks added yet.</p>
        )}
      </div>
    </div>
  );
}
