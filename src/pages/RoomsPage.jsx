import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import apiClient from '../lib/apiClient';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

const emptyRoom = { name: '', description: '', couple: '', maximumMembers: 10, price: 0, features: '', amenities: '', slots: '10:00 AM - 01:00 PM', isActive: true, galleryImages: [], removeGalleryImages: [] };

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyRoom);
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const roomsResponse = await apiClient.get(`/rooms?includeInactive=true`);
    setRooms(roomsResponse.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load().catch((error) => { toast.error(error.response?.data?.message || 'Failed to load rooms'); setLoading(false); }); }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (form.couple !== '' && Number(form.maximumMembers) < Number(form.couple)) {
      toast.error('Maximum Members must be greater than or equal to Couple.');
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'couple') {
        // Only send couple if a value was entered; skip if empty so backend treats it as not set
        if (value !== '' && value !== null && value !== undefined) data.append(key, value);
      } else if (key === 'features' || key === 'amenities') data.append(key, JSON.stringify(value.split(',').map((item) => item.trim()).filter(Boolean)));
      else if (key === 'slots') data.append(key, JSON.stringify(value.split(',').map((item) => { const [startTime, endTime] = item.split(' - '); return { startTime: startTime?.trim(), endTime: endTime?.trim(), isActive: true }; })));
      else if (key === 'removeImage') { if (value) data.append('removeImage', 'true'); }
      else if (key === 'removeGalleryImages') { if (value.length) data.append('removeGalleryImages', JSON.stringify(value)); }
      else if (key !== 'hasImage' && key !== 'imageUrl' && key !== 'galleryImages') data.append(key, value);
    });
    if (images && images.length) { Array.from(images).forEach(img => data.append('images', img)); }
    try {
      if (editingId) await apiClient.put(`/rooms/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await apiClient.post(`/rooms`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editingId ? 'Room updated' : 'Room added');
      setForm(emptyRoom); setImages([]); setEditingId(null); await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save room'); }
  };

  const edit = (room) => {
    const images = [];
    if (room.image) images.push(room.image);
    (room.galleryImages || []).forEach(img => {
      if (!images.some(existing => (existing.publicId && existing.publicId === img.publicId) || existing.url === img.url)) {
        images.push(img);
      }
    });
    setForm({ name: room.name, description: room.description || '', couple: room.couple || '', maximumMembers: room.maximumMembers ?? 10, price: room.price ?? 0, features: (room.features || []).join(', '), amenities: (room.amenities || []).join(', '), slots: (room.slots || []).map((slot) => `${slot.startTime} - ${slot.endTime}`).join(', '), isActive: room.isActive, galleryImages: images, removeGalleryImages: [] });
  };
  const remove = async (id) => { if (!window.confirm('Delete this room?')) return; try { await apiClient.delete(`/rooms/${id}`); toast.success('Room deleted'); await load(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete room'); } };

  return <div className="flex h-full flex-col">
    <PageHeader title="Rooms" description="Manage rooms and room-specific time slots." />
    <div className="grid gap-6 overflow-y-auto p-1 xl:grid-cols-[1fr_360px]">
      <div className="space-y-3">{!loading && rooms.map((room) => <div key={room._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-4">{room.image && <img src={getImageUrl(room.image)} alt={room.name} onError={handleImageError} className="h-16 w-20 rounded-lg object-contain bg-slate-100 p-0.5 border border-slate-200" />}<div><h3 className="font-bold text-slate-900">{room.name}</h3><p className="text-sm text-slate-500">{room.couple ? `Couple: ${room.couple} · ` : ''}Maximum Members: {room.maximumMembers ?? 10} · ₹{room.price ?? 0}/hour</p><p className="text-xs text-slate-500">{room.isActive ? 'Active' : 'Inactive'}</p></div></div><div className="flex gap-2"><Link to={`/admin/rooms/${room._id}/slots`}><Button variant="ghost" size="icon" title="Manage Slots">⌚</Button></Link><Button variant="ghost" size="icon" onClick={() => { setEditingId(room._id); edit(room); }} title="Edit"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(room._id)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div>)}</div>
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">{editingId ? 'Edit Room' : 'Add Room'}</h2>
        {['name', 'description', 'features', 'amenities', 'slots'].map((field) => <label key={field} className="block text-sm font-medium capitalize text-slate-700">{field}<input required={field === 'name'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder={field === 'slots' ? '10:00 AM - 01:00 PM, 03:00 PM - 06:00 PM' : ''} /></label>)}
        <div className="grid grid-cols-3 gap-3"><label className="text-sm font-medium text-slate-700">Couple<input type="number" min="1" value={form.couple} onChange={(event) => setForm({ ...form, couple: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Maximum Members *<input required type="number" min="1" value={form.maximumMembers} onChange={(event) => setForm({ ...form, maximumMembers: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Price / Hr *<input required type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label></div>
        <div className="block text-sm font-medium text-slate-700">Room Images
          <div className="mt-2 flex flex-wrap gap-3">
            {editingId && form.galleryImages && form.galleryImages.map((img, idx) => (
              <div key={idx} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={getImageUrl(img)} alt="Room" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => setForm({ ...form, galleryImages: form.galleryImages.filter((_, i) => i !== idx), removeGalleryImages: [...form.removeGalleryImages, img.publicId || img.url] })} className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-red-600 shadow-sm hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex h-24 w-full sm:w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer relative">
              <Plus className="h-6 w-6 text-slate-400" />
              <input type="file" multiple accept="image/*" onChange={(event) => setImages(Array.from(event.target.files))} className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" title="Add images" />
            </div>
          </div>
          {images.length > 0 && <p className="mt-1 text-xs text-slate-500">{images.length} new image(s) selected</p>}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active</label><Button type="submit" leftIcon={editingId ? Edit : Plus}>{editingId ? 'Update Room' : 'Add Room'}</Button>
      </form>
    </div>
  </div>;
}
