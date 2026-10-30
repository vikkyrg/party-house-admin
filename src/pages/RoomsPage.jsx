import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import apiClient from '../lib/apiClient';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

const emptyRoom = {
  name: '',
  description: '',
  location: '',
  googleMapLink: '',
  couple: '',
  maximumMembers: 10,
  price1Hour: 0,
  price2Hours: 0,
  price3Hours: 0,
  features: '',
  amenities: '',
  slots: '10:00 AM - 01:00 PM',
  isActive: true,
  galleryImages: [],
  removeGalleryImages: [],
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyRoom);
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const load = async () => {
    const res = await apiClient.get('/rooms?includeInactive=true');
    setRooms(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((err) => {
      toast.error(err.response?.data?.message || 'Failed to load rooms');
      setLoading(false);
    });
  }, []);

  const saveOrder = async (updatedRooms) => {
    setRooms(updatedRooms);
    setIsReordering(true);
    try {
      const roomIds = updatedRooms.map((r) => r._id);
      await apiClient.put('/rooms/reorder', { roomIds });
      toast.success('Room order updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room order');
      await load();
    } finally {
      setIsReordering(false);
    }
  };

  const moveUp = (index) => {
    if (index <= 0 || isReordering) return;
    const newRooms = [...rooms];
    const temp = newRooms[index];
    newRooms[index] = newRooms[index - 1];
    newRooms[index - 1] = temp;
    saveOrder(newRooms);
  };

  const moveDown = (index) => {
    if (index >= rooms.length - 1 || isReordering) return;
    const newRooms = [...rooms];
    const temp = newRooms[index];
    newRooms[index] = newRooms[index + 1];
    newRooms[index + 1] = temp;
    saveOrder(newRooms);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (index) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newRooms = [...rooms];
    const [draggedRoom] = newRooms.splice(draggedIndex, 1);
    newRooms.splice(targetIndex, 0, draggedRoom);
    setDraggedIndex(null);
    saveOrder(newRooms);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const submit = async (event) => {
    event.preventDefault();

    // Validate location
    if (!form.location || form.location.trim() === '') {
      toast.error('Location name is required.');
      return;
    }

    // Validate couple vs maximumMembers
    if (form.couple !== '' && Number(form.maximumMembers) < Number(form.couple)) {
      toast.error('Maximum Members must be greater than or equal to Couple.');
      return;
    }

    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description || '');
    data.append('location', form.location.trim());
    data.append('googleMapLink', form.googleMapLink.trim());
    data.append('couple', form.couple ?? '');
    data.append('maximumMembers', form.maximumMembers);
    data.append('price1Hour', form.price1Hour);
    data.append('price2Hours', form.price2Hours);
    data.append('price3Hours', form.price3Hours);
    data.append('isActive', form.isActive);
    data.append('features', JSON.stringify(form.features.split(',').map((i) => i.trim()).filter(Boolean)));
    data.append('amenities', JSON.stringify(form.amenities.split(',').map((i) => i.trim()).filter(Boolean)));
    data.append(
      'slots',
      JSON.stringify(
        form.slots.split(',').map((item) => {
          const [startTime, endTime] = item.split(' - ');
          return { startTime: startTime?.trim(), endTime: endTime?.trim(), isActive: true };
        })
      )
    );

    if (form.removeGalleryImages?.length) {
      data.append('removeGalleryImages', JSON.stringify(form.removeGalleryImages));
    }

    if (images && images.length) {
      Array.from(images).forEach((img) => data.append('images', img));
    }

    try {
      let res;
      if (editingId) {
        res = await apiClient.put(`/rooms/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await apiClient.post('/rooms', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Verify the saved location from API response
      const saved = res.data?.data;
      if (saved) {
        console.log('Saved room location:', saved.location, '| googleMapLink:', saved.googleMapLink);
      }

      toast.success(editingId ? 'Room updated successfully' : 'Room added successfully');
      setForm(emptyRoom);
      setImages([]);
      setEditingId(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save room');
    }
  };

  const edit = (room) => {
    const imgs = [];
    if (room.image) imgs.push(room.image);
    (room.galleryImages || []).forEach((img) => {
      if (!imgs.some((ex) => (ex.publicId && ex.publicId === img.publicId) || ex.url === img.url)) {
        imgs.push(img);
      }
    });
    setEditingId(room._id);
    setForm({
      name: room.name || '',
      description: room.description || '',
      location: room.location || '',
      googleMapLink: room.googleMapLink || '',
      couple: room.couple || '',
      maximumMembers: room.maximumMembers ?? 10,
      price1Hour: room.price1Hour ?? 0,
      price2Hours: room.price2Hours ?? 0,
      price3Hours: room.price3Hours ?? 0,
      features: (room.features || []).join(', '),
      amenities: (room.amenities || []).join(', '),
      slots: (room.slots || []).map((s) => `${s.startTime} - ${s.endTime}`).join(', '),
      isActive: room.isActive,
      galleryImages: imgs,
      removeGalleryImages: [],
    });
    setImages([]);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await apiClient.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const cancel = () => {
    setForm(emptyRoom);
    setImages([]);
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader title="Rooms" description="Manage rooms and room-specific time slots." />
      <div className="grid gap-6 items-start p-1 xl:grid-cols-[1fr_390px]">

        {/* Room List - Fixed/Sticky on viewport so it remains visible while scrolling */}
        <div className="space-y-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto pr-1">
          {!loading && rooms.map((room, index) => (
            <div
              key={room._id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => handleDragLeave(index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-all ${
                draggedIndex === index
                  ? 'opacity-40 border-dashed border-amber-500 scale-[0.98]'
                  : dragOverIndex === index
                  ? 'border-amber-500 ring-2 ring-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Drag Handle & Position Indicator */}
                <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Drag to reorder room"
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col -my-1">
                    <button
                      type="button"
                      disabled={index === 0 || isReordering}
                      onClick={() => moveUp(index)}
                      className="p-0.5 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === rooms.length - 1 || isReordering}
                      onClick={() => moveDown(index)}
                      className="p-0.5 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-5 text-center font-bold text-xs text-slate-400">
                    {index + 1}
                  </span>
                </div>

                {room.image && (
                  <img
                    src={getImageUrl(room.image)}
                    alt={room.name}
                    onError={handleImageError}
                    className="h-16 w-20 rounded-lg object-contain bg-slate-100 p-0.5 border border-slate-200 shrink-0 select-none"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{room.name}</h3>
                  <p className="text-sm text-slate-500 truncate">
                    {room.couple ? `Couple: ${room.couple} · ` : ''}Max: {room.maximumMembers ?? 10} · 1H: ₹{room.price1Hour ?? 0} · 2H: ₹{room.price2Hours ?? 0} · 3H: ₹{room.price3Hours ?? 0}
                  </p>
                  {room.location && (
                    <p className="text-xs text-slate-400 truncate">📍 {room.location}</p>
                  )}
                  <p className="text-xs text-slate-500 font-medium">{room.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link to={`/admin/rooms/${room._id}/slots`}>
                  <Button variant="ghost" size="icon" title="Manage Slots">⌚</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => edit(room)} title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(room._id)} title="Delete">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Form */}
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">{editingId ? 'Edit Room' : 'Add Room'}</h2>

          {/* Name */}
          <label className="block text-sm font-medium text-slate-700">
            Name *
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Room name"
            />
          </label>

          {/* Description */}
          <label className="block text-sm font-medium text-slate-700">
            Description
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Short description"
            />
          </label>

          {/* Location */}
          <label className="block text-sm font-medium text-slate-700">
            Location Name *
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Koramangala, Bengaluru"
            />
            <span className="text-xs text-slate-400">This name appears on the website room card</span>
          </label>

          {/* Google Map Link */}
          <label className="block text-sm font-medium text-slate-700">
            Google Map Link
            <input
              type="url"
              value={form.googleMapLink}
              onChange={(e) => setForm({ ...form, googleMapLink: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="https://maps.google.com/..."
            />
            <span className="text-xs text-slate-400">Clicking the location name on the website opens this link</span>
          </label>

          {/* Features */}
          <label className="block text-sm font-medium text-slate-700">
            Features
            <input
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Feature1, Feature2"
            />
          </label>

          {/* Amenities */}
          <label className="block text-sm font-medium text-slate-700">
            Amenities
            <input
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Amenity1, Amenity2"
            />
          </label>

          {/* Slots */}
          <label className="block text-sm font-medium text-slate-700">
            Slots
            <input
              value={form.slots}
              onChange={(e) => setForm({ ...form, slots: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="10:00 AM - 01:00 PM, 03:00 PM - 06:00 PM"
            />
          </label>

          {/* Couple / MaxMembers / Prices */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Couple
              <input
                type="number"
                min="1"
                value={form.couple}
                onChange={(e) => setForm({ ...form, couple: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Max Members *
              <input
                required
                type="number"
                min="1"
                value={form.maximumMembers}
                onChange={(e) => setForm({ ...form, maximumMembers: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              1 Hour Price *
              <input
                required
                type="number"
                min="0"
                value={form.price1Hour}
                onChange={(e) => setForm({ ...form, price1Hour: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              2 Hours Price *
              <input
                required
                type="number"
                min="0"
                value={form.price2Hours}
                onChange={(e) => setForm({ ...form, price2Hours: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              3 Hours Price *
              <input
                required
                type="number"
                min="0"
                value={form.price3Hours}
                onChange={(e) => setForm({ ...form, price3Hours: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {/* Room Images */}
          <div className="block text-sm font-medium text-slate-700">
            Room Images
            <div className="mt-2 flex flex-wrap gap-3">
              {editingId && form.galleryImages && form.galleryImages.map((img, idx) => (
                <div key={idx} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img src={getImageUrl(img)} alt="Room" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        galleryImages: form.galleryImages.filter((_, i) => i !== idx),
                        removeGalleryImages: [...form.removeGalleryImages, img.publicId || img.url],
                      })}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-red-600 shadow-sm hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex h-24 w-full sm:w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer relative">
                <Plus className="h-6 w-6 text-slate-400" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImages(Array.from(e.target.files))}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  title="Add images"
                />
              </div>
            </div>
            {images.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">{images.length} new image(s) selected</p>
            )}
          </div>

          {/* Active */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button type="submit" leftIcon={editingId ? Edit : Plus}>
              {editingId ? 'Update Room' : 'Add Room'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
