import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import apiClient from '../lib/apiClient';

const emptySlot = { startTime: '10:00 AM', endTime: '01:00 PM', isActive: true };

export default function RoomSlotsPage() {
  const { theaterId, roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(emptySlot);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const response = await apiClient.get(`/rooms/${roomId}?includeInactive=true`);
    setRoom(response.data.data);
    setSlots(response.data.data?.slots || []);
  };

  useEffect(() => { load().catch((error) => toast.error(error.response?.data?.message || 'Failed to load slots')); }, [roomId]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await apiClient.put(`/rooms/${roomId}/slots/${editingId}`, form);
      else await apiClient.post(`/rooms/${roomId}/slots`, form);
      toast.success(editingId ? 'Slot updated' : 'Slot added');
      setForm(emptySlot); setEditingId(null); await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save slot'); }
  };

  const remove = async (slotId) => {
    try { await apiClient.delete(`/rooms/${roomId}/slots/${slotId}`); toast.success('Slot deleted'); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to delete slot'); }
  };

  return <div className="flex h-full flex-col">
    <PageHeader title={`${room?.name || 'Room'} Slots`} description="Configure this room's available time slots." actions={<Link to={`/admin/theaters/${theaterId}/rooms`}><Button variant="outline">Back to rooms</Button></Link>} />
    <div className="max-w-3xl space-y-4">
      {slots.map((slot) => <div key={slot._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><div><p className="font-semibold text-slate-900">{slot.startTime} - {slot.endTime}</p><p className="text-xs text-slate-500">{slot.isActive ? 'Active' : 'Inactive'}</p></div><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingId(slot._id); setForm({ startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive }); }} title="Edit"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(slot._id)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div>)}
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto_auto]"><input value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} className="rounded-md border border-slate-300 px-3 py-2" placeholder="10:00 AM" /><input value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} className="rounded-md border border-slate-300 px-3 py-2" placeholder="01:00 PM" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active</label><Button type="submit" leftIcon={editingId ? Edit : Plus}>{editingId ? 'Update' : 'Add Slot'}</Button></form>
    </div>
  </div>;
}
