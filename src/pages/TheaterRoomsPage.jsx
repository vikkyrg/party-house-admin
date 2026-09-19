import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import apiClient from '../lib/apiClient';
import { getImageUrl } from '../utils/imageUtils';

const emptyRoom = { name: '', description: '', capacity: 10, basePrice: 0, additionalGuestPrice: 0, features: '', amenities: '', slots: '10:00 AM - 01:00 PM', isActive: true };

export default function TheaterRoomsPage() {
  const { theaterId } = useParams();
  const [theater, setTheater] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyRoom);
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [theaterResponse, roomsResponse] = await Promise.all([apiClient.get(`/theaters/${theaterId}`), apiClient.get(`/rooms/theater/${theaterId}?includeInactive=true`)]);
    setTheater(theaterResponse.data.data);
    setRooms(roomsResponse.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load().catch((error) => { toast.error(error.response?.data?.message || 'Failed to load rooms'); setLoading(false); }); }, [theaterId]);

  const submit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'features' || key === 'amenities') data.append(key, JSON.stringify(value.split(',').map((item) => item.trim()).filter(Boolean)));
      else if (key === 'slots') data.append(key, JSON.stringify(value.split(',').map((item) => { const [startTime, endTime] = item.split(' - '); return { startTime: startTime?.trim(), endTime: endTime?.trim(), isActive: true }; })));
      else data.append(key, value);
    });
    if (image) data.append('images', image);
    try {
      if (editingId) await apiClient.put(`/rooms/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await apiClient.post(`/rooms/theater/${theaterId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editingId ? 'Room updated' : 'Room added');
      setForm(emptyRoom); setImage(null); setEditingId(null); await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save room'); }
  };

  const edit = (room) => setForm({ name: room.name, description: room.description || '', capacity: room.capacity, basePrice: room.basePrice, additionalGuestPrice: room.additionalGuestPrice ?? room.extraGuestPrice ?? 0, features: (room.features || []).join(', '), amenities: (room.amenities || []).join(', '), slots: (room.slots || []).map((slot) => `${slot.startTime} - ${slot.endTime}`).join(', '), isActive: room.isActive });
  const remove = async (id) => { if (!window.confirm('Delete this room?')) return; try { await apiClient.delete(`/rooms/${id}`); toast.success('Room deleted'); await load(); } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete room'); } };

  return <div className="flex h-full flex-col">
    <PageHeader title={`${theater?.name || 'Theater'} Rooms`} description="Manage rooms and room-specific time slots." actions={<Link to="/admin/theaters"><Button variant="outline">Back to theaters</Button></Link>} />
    <div className="grid gap-6 xl:grid-cols-[1fr_360px] overflow-y-auto p-1">
      <div className="space-y-3">{!loading && rooms.map((room) => <div key={room._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-4">{room.image && <img src={getImageUrl(room.image)} alt={room.name} className="h-16 w-20 rounded-lg object-cover" />}<div><h3 className="font-bold text-slate-900">{room.name}</h3><p className="text-sm text-slate-500">₹{room.basePrice}/hour · Additional ₹{room.additionalGuestPrice ?? room.extraGuestPrice ?? 0} · Capacity {room.capacity}</p><p className="text-xs text-slate-500">{room.isActive ? 'Active' : 'Inactive'}</p></div></div><div className="flex gap-2"><Link to={`/admin/theaters/${theaterId}/rooms/${room._id}/slots`}><Button variant="ghost" size="icon" title="Manage Slots">⌚</Button></Link><Button variant="ghost" size="icon" onClick={() => { setEditingId(room._id); edit(room); }} title="Edit"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(room._id)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div>)}</div>
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">{editingId ? 'Edit Room' : 'Add Room'}</h2>{['name', 'description', 'features', 'amenities', 'slots'].map((field) => <label key={field} className="block text-sm font-medium capitalize text-slate-700">{field}<input required={field === 'name'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder={field === 'slots' ? '10:00 AM - 01:00 PM, 03:00 PM - 06:00 PM' : ''} /></label>)}<div className="grid grid-cols-3 gap-3"><label className="text-sm font-medium text-slate-700">Capacity<input type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Base Price<input type="number" min="0" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Additional Guest<input type="number" min="0" value={form.additionalGuestPrice} onChange={(event) => setForm({ ...form, additionalGuestPrice: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label></div><label className="block text-sm font-medium text-slate-700">Image<input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} className="mt-1 w-full text-sm" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active</label><Button type="submit" leftIcon={editingId ? Edit : Plus}>{editingId ? 'Update Room' : 'Save Room'}</Button></form>
    </div>
  </div>;
}
