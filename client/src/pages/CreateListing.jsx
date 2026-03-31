import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MEMBERSHIP_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Presidential', 'Diamond', 'Points-Based', 'Fixed Week', 'Other'];
const UNIT_SIZES = ['Studio', '1BR/1BA', '1BR/2BA', '2BR/2BA', '3BR/3BA', '4BR/4BA', 'Penthouse'];
const AMENITIES = [
  { value: 'pool', label: 'Pool' },
  { value: 'beach_access', label: 'Beach Access' },
  { value: 'kitchen', label: 'Full Kitchen' },
  { value: 'parking', label: 'Parking' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'gym', label: 'Fitness Center' },
  { value: 'spa', label: 'Spa' },
  { value: 'golf', label: 'Golf' },
  { value: 'ski', label: 'Ski-In/Out' },
  { value: 'pet_friendly', label: 'Pet Friendly' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdListingId, setCreatedListingId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    resortName: '',
    location: '',
    state: '',
    country: 'US',
    membershipTier: '',
    unitSize: '',
    maxGuests: 4,
    pricePerWeek: '',
    amenities: [],
    photos: [],
  });

  const [weeks, setWeeks] = useState([]);
  const [newWeek, setNewWeek] = useState({ startDate: '', endDate: '' });
  const [icalFile, setIcalFile] = useState(null);
  const [photoUrls, setPhotoUrls] = useState(['']);
  const [errors, setErrors] = useState({});

  const toggleAmenity = (val) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(val) ? f.amenities.filter((a) => a !== val) : [...f.amenities, val],
    }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.resortName.trim()) e.resortName = 'Resort name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.membershipTier) e.membershipTier = 'Membership tier is required';
    if (!form.unitSize) e.unitSize = 'Unit size is required';
    if (!form.pricePerWeek || isNaN(form.pricePerWeek) || form.pricePerWeek <= 0) e.pricePerWeek = 'Valid price required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateListing = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const photos = photoUrls.filter(Boolean);
      const res = await api.post('/listings', { ...form, photos });
      setCreatedListingId(res.data.id);
      toast.success('Listing created!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const addWeekManually = () => {
    if (!newWeek.startDate || !newWeek.endDate) return toast.error('Select both start and end dates');
    if (new Date(newWeek.endDate) <= new Date(newWeek.startDate)) return toast.error('End date must be after start date');
    setWeeks([...weeks, { ...newWeek }]);
    setNewWeek({ startDate: '', endDate: '' });
  };

  const removeWeek = (i) => setWeeks(weeks.filter((_, idx) => idx !== i));

  const handleIcalUpload = async () => {
    if (!icalFile || !createdListingId) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('ical', icalFile);
    try {
      const res = await api.post(`/listings/${createdListingId}/ical`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Imported ${res.data.count} weeks from iCal!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'iCal import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeeks = async () => {
    if (weeks.length === 0) {
      navigate(`/listings/${createdListingId}`);
      return;
    }
    setLoading(true);
    try {
      await api.post(`/listings/${createdListingId}/weeks`, { weeks });
      toast.success(`Added ${weeks.length} available week${weeks.length > 1 ? 's' : ''}!`);
      navigate(`/listings/${createdListingId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save weeks');
    } finally {
      setLoading(false);
    }
  };

  const F = ({ name, label, children, error }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="flex items-center mb-8">
        {['Listing Details', 'Available Weeks'].map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? 'font-semibold' : 'text-gray-500'}`}>{s}</span>
            </div>
            {i < 1 && <div className={`flex-1 h-0.5 mx-4 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="card p-6 space-y-5">
          <h1 className="text-2xl font-bold">Create Your Listing</h1>

          <F name="title" label="Listing Title *" error={errors.title}>
            <input className="input" placeholder="e.g. Oceanfront Suite at Marriott Aruba" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F name="resortName" label="Resort Name *" error={errors.resortName}>
              <input className="input" placeholder="e.g. Marriott Aruba Ocean Club" value={form.resortName} onChange={(e) => setForm({ ...form, resortName: e.target.value })} />
            </F>
            <F name="location" label="Location / City *" error={errors.location}>
              <input className="input" placeholder="e.g. Aruba, Caribbean" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F name="state" label="State / Province">
              <input className="input" placeholder="e.g. Noord" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </F>
            <F name="country" label="Country">
              <input className="input" placeholder="e.g. US" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F name="membershipTier" label="Membership Tier *" error={errors.membershipTier}>
              <select className="input" value={form.membershipTier} onChange={(e) => setForm({ ...form, membershipTier: e.target.value })}>
                <option value="">Select tier</option>
                {MEMBERSHIP_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </F>
            <F name="unitSize" label="Unit Size *" error={errors.unitSize}>
              <select className="input" value={form.unitSize} onChange={(e) => setForm({ ...form, unitSize: e.target.value })}>
                <option value="">Select size</option>
                {UNIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F name="maxGuests" label="Max Guests">
              <input type="number" className="input" min="1" max="20" value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: parseInt(e.target.value) })} />
            </F>
            <F name="pricePerWeek" label="Price per Week (USD) *" error={errors.pricePerWeek}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" className="input pl-7" placeholder="1500" min="0" value={form.pricePerWeek} onChange={(e) => setForm({ ...form, pricePerWeek: e.target.value })} />
              </div>
            </F>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px] resize-none" placeholder="Describe your timeshare unit, the resort amenities, nearby attractions..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Amenities */}
          <div>
            <label className="label">Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map((a) => (
                <label key={a.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${form.amenities.includes(a.value) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" className="sr-only" checked={form.amenities.includes(a.value)} onChange={() => toggleAmenity(a.value)} />
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${form.amenities.includes(a.value) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                    {form.amenities.includes(a.value) && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                  </span>
                  <span className="text-sm">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="label">Photo URLs</label>
            <p className="text-xs text-gray-500 mb-2">Enter image URLs (upload support coming soon)</p>
            {photoUrls.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input flex-1" placeholder="https://..." value={url} onChange={(e) => { const u = [...photoUrls]; u[i] = e.target.value; setPhotoUrls(u); }} />
                {photoUrls.length > 1 && (
                  <button type="button" onClick={() => setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 px-2">✕</button>
                )}
              </div>
            ))}
            {photoUrls.length < 10 && (
              <button type="button" onClick={() => setPhotoUrls([...photoUrls, ''])} className="text-blue-600 text-sm hover:underline">+ Add photo URL</button>
            )}
          </div>

          <button onClick={handleCreateListing} disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Creating...' : 'Continue to Add Availability →'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6 space-y-6">
          <h1 className="text-2xl font-bold">Add Available Weeks</h1>
          <p className="text-gray-600 text-sm">Upload an iCal file from your timeshare system, or add weeks manually.</p>

          {/* iCal upload */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-semibold mb-1">Option A: Upload iCal (.ics) File</h3>
            <p className="text-xs text-gray-500 mb-3">Export from your timeshare owner portal and upload here. We'll auto-detect the available weeks.</p>
            <div className="flex gap-2">
              <input type="file" accept=".ics" onChange={(e) => setIcalFile(e.target.files[0])} className="input flex-1 text-sm" />
              <button onClick={handleIcalUpload} disabled={!icalFile || loading} className="btn-primary whitespace-nowrap">
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>

          {/* Manual entry */}
          <div>
            <h3 className="font-semibold mb-3">Option B: Add Weeks Manually</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="label">Check-in</label>
                <input type="date" className="input" value={newWeek.startDate} onChange={(e) => setNewWeek({ ...newWeek, startDate: e.target.value })} />
              </div>
              <div className="flex-1">
                <label className="label">Check-out</label>
                <input type="date" className="input" value={newWeek.endDate} onChange={(e) => setNewWeek({ ...newWeek, endDate: e.target.value })} />
              </div>
              <button onClick={addWeekManually} className="btn-secondary h-10 px-4 whitespace-nowrap">Add Week</button>
            </div>
          </div>

          {/* Week list */}
          {weeks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Weeks to Add ({weeks.length})</h3>
              <div className="space-y-2">
                {weeks.map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <span>{w.startDate} → {w.endDate}</span>
                    <button onClick={() => removeWeek(i)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSaveWeeks} disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'Saving...' : weeks.length > 0 ? `Save ${weeks.length} Week${weeks.length > 1 ? 's' : ''} & Publish` : 'Skip for Now & View Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
