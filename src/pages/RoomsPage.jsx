import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  Tv,
  Film,
  Video,
  Play,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import apiClient from '../lib/apiClient';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const emptyRoom = {
  name: '',
  description: '',
  location: '',
  googleMapLink: '',
  screenSize: '',
  pictureQuality: '',
  soundQuality: '',
  couple: '',
  maximumMembers: 10,
  price1Hour: 0,
  price2Hours: 0,
  price3Hours: 0,
  features: '',
  amenities: '',
  slots: '10:00 AM - 01:00 PM',
  isActive: true,
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyRoom);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Reordering rooms in list
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Media management state
  const [mediaItems, setMediaItems] = useState([]); // Array of { id, isNew, file, mediaType, contentType, url, originalName, size, order, duration }
  const [removedMediaIds, setRemovedMediaIds] = useState([]);
  const [mediaDragIndex, setMediaDragIndex] = useState(null);
  const [mediaDragOverIndex, setMediaDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);

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

  // MEDIA MANAGEMENT HANDLERS
  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map((file, idx) => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);
      return {
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${idx}`,
        isNew: true,
        file,
        mediaType: isVideo ? 'video' : 'image',
        contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        url: URL.createObjectURL(file),
        originalName: file.name,
        size: file.size,
        duration: isVideo ? 0 : 4,
        order: mediaItems.length + idx,
      };
    });

    setMediaItems((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveMedia = (index) => {
    const item = mediaItems[index];
    if (!item) return;

    if (item.isNew && item.url && item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    } else if (!item.isNew && (item.mediaId || item.id)) {
      setRemovedMediaIds((prev) => [...prev, item.mediaId || item.id]);
    }

    setMediaItems((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      return updated.map((m, idx) => ({ ...m, order: idx }));
    });
  };

  const moveMedia = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= mediaItems.length) return;
    setMediaItems((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((m, idx) => ({ ...m, order: idx }));
    });
  };

  const handleMediaDragStart = (e, index) => {
    setMediaDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMediaDragOver = (e, index) => {
    e.preventDefault();
    if (mediaDragIndex === null || mediaDragIndex === index) return;
    setMediaDragOverIndex(index);
  };

  const handleMediaDrop = (e, targetIndex) => {
    e.preventDefault();
    setMediaDragOverIndex(null);
    if (mediaDragIndex === null || mediaDragIndex === targetIndex) {
      setMediaDragIndex(null);
      return;
    }
    moveMedia(mediaDragIndex, targetIndex);
    setMediaDragIndex(null);
  };

  const cleanupBlobUrls = () => {
    mediaItems.forEach((item) => {
      if (item.isNew && item.url && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
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

    setIsSubmitting(true);
    setUploadProgress(0);

    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description || '');
    data.append('location', form.location.trim());
    data.append('googleMapLink', form.googleMapLink.trim());
    data.append('screenSize', (form.screenSize || '').trim());
    data.append('pictureQuality', (form.pictureQuality || '').trim());
    data.append('soundQuality', (form.soundQuality || '').trim());
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

    // Append new media files (images and/or videos)
    mediaItems.forEach((item) => {
      if (item.isNew && item.file) {
        data.append('media', item.file);
      }
    });

    // Provide ordered media metadata
    const mediaOrder = mediaItems.map((item, idx) => ({
      mediaId: item.isNew ? null : (item.mediaId || item.id),
      originalName: item.originalName,
      order: idx,
      duration: item.duration || 4,
    }));
    data.append('mediaOrder', JSON.stringify(mediaOrder));

    // Append removed media IDs
    if (removedMediaIds.length > 0) {
      data.append('removeMediaIds', JSON.stringify(removedMediaIds));
      data.append('removeGalleryImages', JSON.stringify(removedMediaIds));
    }

    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      };

      if (editingId) {
        await apiClient.put(`/rooms/${editingId}`, data, config);
      } else {
        await apiClient.post('/rooms', data, config);
      }

      toast.success(editingId ? 'Room updated successfully' : 'Room added successfully');
      cleanupBlobUrls();
      setForm(emptyRoom);
      setMediaItems([]);
      setRemovedMediaIds([]);
      setEditingId(null);
      setUploadProgress(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save room');
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const edit = (room) => {
    cleanupBlobUrls();
    setEditingId(room._id);
    setForm({
      name: room.name || '',
      description: room.description || '',
      location: room.location || '',
      googleMapLink: room.googleMapLink || '',
      screenSize: room.screenSize || '',
      pictureQuality: room.pictureQuality || '',
      soundQuality: room.soundQuality || '',
      couple: room.couple || '',
      maximumMembers: room.maximumMembers ?? 10,
      price1Hour: room.price1Hour ?? 0,
      price2Hours: room.price2Hours ?? 0,
      price3Hours: room.price3Hours ?? 0,
      features: (room.features || []).join(', '),
      amenities: (room.amenities || []).join(', '),
      slots: (room.slots || []).map((s) => `${s.startTime} - ${s.endTime}`).join(', '),
      isActive: room.isActive,
    });

    // Populate media items from room.media (or fallback to legacy room.image/galleryImages)
    let existing = [];
    if (room.media && room.media.length > 0) {
      existing = [...room.media]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((m, idx) => ({
          id: m.mediaId || m._id || `m_${idx}`,
          mediaId: m.mediaId || m._id,
          isNew: false,
          mediaType: m.mediaType || 'image',
          contentType: m.contentType || (m.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
          url: m.url,
          originalName: m.originalName || `${m.mediaType === 'video' ? 'Video' : 'Image'} ${idx + 1}`,
          size: m.size || 0,
          order: idx,
          duration: m.duration || (m.mediaType === 'video' ? 0 : 4),
        }));
    } else {
      const legacy = [room.image, ...(room.galleryImages || [])].filter(Boolean);
      const seen = new Set();
      const unique = legacy.filter((img) => {
        const key = img.url || img.publicId;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      existing = unique.map((img, idx) => ({
        id: img.publicId || `legacy_${idx}`,
        mediaId: img.publicId,
        isNew: false,
        mediaType: 'image',
        contentType: 'image/jpeg',
        url: img.url,
        originalName: `Image ${idx + 1}`,
        size: 0,
        order: idx,
        duration: 4,
      }));
    }

    setMediaItems(existing);
    setRemovedMediaIds([]);
    setUploadProgress(null);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this room and its media?')) return;
    try {
      await apiClient.delete(`/rooms/${id}`);
      toast.success('Room and media deleted');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const cancel = () => {
    cleanupBlobUrls();
    setForm(emptyRoom);
    setMediaItems([]);
    setRemovedMediaIds([]);
    setEditingId(null);
    setUploadProgress(null);
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader title="Rooms" description="Manage rooms, image & video carousels, and time slots." />
      <div className="grid gap-6 items-start p-1 xl:grid-cols-[1fr_420px]">

        {/* Room List */}
        <div className="space-y-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto pr-1">
          {!loading && rooms.map((room, index) => {
            const firstMedia = (room.media && room.media[0]) || null;
            const isVideo = firstMedia?.mediaType === 'video';
            const displayUrl = firstMedia ? getImageUrl(firstMedia.url) : (room.image ? getImageUrl(room.image) : null);

            return (
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

                  {displayUrl ? (
                    <div className="relative h-16 w-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 select-none">
                      {isVideo ? (
                        <>
                          <video src={displayUrl} className="h-full w-full object-cover" preload="metadata" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-4 w-4 text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={displayUrl}
                          alt={room.name}
                          onError={handleImageError}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[8px] font-bold text-white uppercase">
                        {isVideo ? 'Video' : 'Image'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 border border-slate-200 shrink-0">
                      No Media
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{room.name}</h3>
                    <p className="text-sm text-slate-500 truncate">
                      {room.couple ? `Couple: ${room.couple} · ` : ''}Max: {room.maximumMembers ?? 10} · 2H: ₹{room.price2Hours ?? 0}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {room.location && <span className="truncate">📍 {room.location}</span>}
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800 border border-amber-200/60">
                        <Film className="h-3 w-3" />
                        {room.media?.length || (room.galleryImages?.length || (room.image ? 1 : 0))} media
                      </span>
                    </div>
                    {room.screenSize && (
                      <p className="text-xs text-amber-800 font-medium truncate mt-0.5">
                        📺 Screen: {room.screenSize}
                      </p>
                    )}
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
            );
          })}
        </div>

        {/* Add / Edit Form */}
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-lg">
              {editingId ? 'Edit Room' : 'Add Room'}
            </h2>
            {editingId && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Editing
              </span>
            )}
          </div>

          {/* Name */}
          <label className="block text-sm font-medium text-slate-700">
            Room Name *
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Velvet, Sigma, The Paradise"
            />
          </label>

          {/* Description */}
          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Short description of the room experience..."
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
          </label>

          {/* Screen Experience */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Tv className="h-4 w-4 text-amber-700" />
              <span>Screen Experience</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-medium text-slate-700">
                Screen Size
                <input
                  value={form.screenSize}
                  onChange={(e) => setForm({ ...form, screenSize: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white"
                  placeholder="e.g. 85-inch, 100-inch, 120-inch"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Picture Quality
                <input
                  value={form.pictureQuality}
                  onChange={(e) => setForm({ ...form, pictureQuality: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white"
                  placeholder="e.g. Clear picture with rich colors."
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Sound Quality
                <input
                  value={form.soundQuality}
                  onChange={(e) => setForm({ ...form, soundQuality: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white"
                  placeholder="e.g. Clear sound with deep bass."
                />
              </label>
            </div>
          </div>

          {/* DYNAMIC ROOM MEDIA (IMAGES & VIDEOS) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Film className="h-4 w-4 text-amber-700" />
                  <span>Room Media (Images & Videos)</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload multiple JPG, PNG, WebP images or MP4, WebM videos. Drag to reorder.
                </p>
              </div>
              <span className="rounded bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {mediaItems.length} item{mediaItems.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Media Items List / Drag & Drop Grid */}
            {mediaItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto p-1">
                {mediaItems.map((item, idx) => {
                  const isVideo = item.mediaType === 'video';
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={item.id || idx}
                      draggable
                      onDragStart={(e) => handleMediaDragStart(e, idx)}
                      onDragOver={(e) => handleMediaDragOver(e, idx)}
                      onDrop={(e) => handleMediaDrop(e, idx)}
                      className={`group relative flex items-center gap-2.5 rounded-lg border bg-white p-2 shadow-sm transition-all ${
                        mediaDragIndex === idx
                          ? 'opacity-40 border-dashed border-amber-500 scale-[0.98]'
                          : mediaDragOverIndex === idx
                          ? 'border-amber-500 ring-2 ring-amber-300'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-0.5">
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {/* Thumbnail Preview */}
                      <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded bg-slate-100 border border-slate-200">
                        {isVideo ? (
                          <>
                            <video
                              src={item.url.startsWith('blob:') ? item.url : getImageUrl(item.url)}
                              className="h-full w-full object-cover"
                              preload="metadata"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                              <Play className="h-3.5 w-3.5 text-white fill-white" />
                            </div>
                          </>
                        ) : (
                          <img
                            src={item.url.startsWith('blob:') ? item.url : getImageUrl(item.url)}
                            alt={item.originalName || 'Preview'}
                            onError={handleImageError}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      {/* Info & Badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              isVideo ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isVideo ? 'Video' : 'Image'}
                          </span>
                          {isFirst && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                              Cover / 1st
                            </span>
                          )}
                          {item.isNew && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-700 truncate mt-0.5" title={item.originalName}>
                          {item.originalName || (isVideo ? 'video.mp4' : 'image.jpg')}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {item.size > 0 && <span>{formatFileSize(item.size)}</span>}
                          {!isVideo && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" /> 4s
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions: Move Up/Down + Remove */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveMedia(idx, idx - 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20"
                            title="Move Earlier in Carousel"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === mediaItems.length - 1}
                            onClick={() => moveMedia(idx, idx + 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20"
                            title="Move Later in Carousel"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove this media"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 bg-white">
                No images or videos added yet. Upload files below to start building the room carousel.
              </div>
            )}

            {/* Upload Area */}
            <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300/80 bg-amber-50/40 p-4 text-center hover:bg-amber-50/80 transition-colors cursor-pointer">
              <UploadCloud className="h-7 w-7 text-amber-600 mb-1" />
              <p className="text-xs font-bold text-slate-800">
                Click or drop files to upload Images & Videos
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Images (JPG, PNG, WebP) & Videos (MP4, WebM) can be selected together
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleAddFiles}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                title="Add Images or Videos"
              />
            </div>

            {/* Upload Progress Indicator */}
            {uploadProgress !== null && (
              <div className="rounded-lg bg-white border border-slate-200 p-2.5 shadow-sm space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Uploading media to MongoDB GridFS...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

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

          {/* Active */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active (Visible on public website)
          </label>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? Loader2 : editingId ? Edit : Plus}>
              {isSubmitting ? 'Saving...' : editingId ? 'Update Room' : 'Add Room'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={cancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
