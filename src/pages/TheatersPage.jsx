import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, DoorOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/common/DataTable';
import DataTableToolbar from '../components/common/DataTableToolbar';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import FormModal from '../components/common/FormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MultipleImageUploader from '../components/common/MultipleImageUploader';
import { getImageUrl } from '../utils/imageUtils';

import { useTheaters } from '../hooks/useTheaters';
import { useLocations } from '../hooks/useLocations';
import { theaterSchema } from '../validations/theaterSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

const blankRoom = () => ({
  _id: null,
  name: '',
  description: '',
  couple: 2,
  maximumMembers: 10,
  price: 0,
  slots: [{ startTime: '10:00 AM', endTime: '01:00 PM', isActive: true }],
  image: null,
  isActive: true,
});

export default function TheatersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheater, setEditingTheater] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [theaterToDelete, setTheaterToDelete] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [roomDrafts, setRoomDrafts] = useState([]);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(theaterSchema),
    defaultValues: { isActive: true, location: '' },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useTheaters({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  const { data: locationsData } = useLocations({ limit: 100 });
  const locations = locationsData?.data?.locations || locationsData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: ({ formData, rooms }) => apiClient.post('/theaters', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((response) => ({ response, rooms })),
    onSuccess: async ({ response, rooms }) => {
      await saveRooms(response.data.data._id, rooms);
      toast.success('Theater created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.theaters.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create theater'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, rooms }) => apiClient.put(`/theaters/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((response) => ({ response, rooms })),
    onSuccess: async ({ response, rooms }) => {
      await saveRooms(response.data.data._id, rooms);
      toast.success('Theater updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.theaters.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update theater'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/theaters/${id}`),
    onSuccess: () => {
      toast.success('Theater deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.theaters.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete theater'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingTheater(null);
    setImageFiles([]);
    setRoomDrafts([]);
    reset({ name: '', description: '', address: '', googleMapsLink: '', location: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (theater) => {
    setEditingTheater(theater);
    setImageFiles(theater.images || []);
    try {
      const roomsResponse = await apiClient.get(`/theaters/${theater._id}/rooms?includeInactive=true`);
      setRoomDrafts((roomsResponse.data.data || []).map((room) => ({ ...blankRoom(), ...room, slots: room.slots || [] })));
    } catch (error) {
      toast.error('Failed to load theater rooms');
      setRoomDrafts([]);
    }
    setValue('name', theater.name);
    setValue('description', theater.description || '');
    setValue('address', theater.address || '');
    setValue('googleMapsLink', theater.googleMapsLink || '');
    setValue('location', theater.location?._id || theater.location);
    setValue('isActive', theater.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFiles([]);
    setRoomDrafts([]);
  };

  const confirmDelete = (theater) => {
    setTheaterToDelete(theater);
    setDeleteConfirmOpen(true);
  };

  const saveRooms = async (theaterId, rooms) => {
    for (const room of rooms) {
      if (!room.name?.trim()) continue;
      const roomData = new FormData();
      ['name', 'description', 'couple', 'maximumMembers', 'price', 'isActive'].forEach((field) => roomData.append(field, room[field] ?? ''));
      roomData.append('slots', JSON.stringify(room.slots || []));
      if (room.image instanceof File) roomData.append('images', room.image);
      if (room._id) {
        await apiClient.put(`/rooms/${room._id}`, roomData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await apiClient.post(`/theaters/${theaterId}/rooms`, roomData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    }
  };

  const onSubmit = (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        if (key === 'slots') {
          data.append(key, JSON.stringify(formData[key] || []));
        } else if (Array.isArray(formData[key])) {
          if (formData[key].length > 0 && typeof formData[key][0] === 'object' && formData[key][0] !== null) {
             data.append(key, JSON.stringify(formData[key]));
          } else {
            formData[key].forEach(item => {
              data.append(`${key}[]`, item);
            });
          }
        } else {
          data.append(key, formData[key]);
        }
      }
    });

    imageFiles.forEach(file => {
      if (file instanceof File) {
        data.append('images', file);
      }
    });

    if (editingTheater) {
      updateMutation.mutate({ id: editingTheater._id, data, rooms: roomDrafts });
    } else {
      createMutation.mutate({ formData: data, rooms: roomDrafts });
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'image', 
      header: 'Image', 
      render: (row) => (
        <div className="h-10 w-10 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {row.images?.length > 0 ? (
            <img src={getImageUrl(row.images[0])} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'location', header: 'Location', render: (row) => row.location?.name || 'N/A' },
    { key: 'rooms', header: 'Rooms', render: (row) => `${row.rooms?.filter((room) => room.isActive !== false).length || 0} Rooms` },
    { key: 'isActive', header: 'Status', render: (row) => <StatusBadge status={row.isActive} type="boolean" /> },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(row)} title="Edit">
            <Edit className="h-4 w-4 text-slate-500" />
          </Button>
          <Link to={`/admin/theaters/${row._id}/rooms`}>
            <Button variant="ghost" size="icon" title="Manage Rooms">
              <DoorOpen className="h-4 w-4 text-primary-600" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => confirmDelete(row)} title="Delete" className="hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], []);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Theaters" 
        description="Manage the theaters where events can be booked." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add Theater
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search theaters..."
      />

      <div className="flex-1">
        <DataTable
          columns={columns}
          data={data?.data?.theaters || data?.data || []}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          pagination={{
            currentPage: data?.pagination?.page || 1,
            totalPages: data?.pagination?.pages || 1
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'No theaters found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new theater.',
            actionLabel: debouncedSearch ? null : 'Add Theater',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTheater ? 'Edit Theater' : 'Add New Theater'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 pb-6">
          {/* GENERAL */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">General Information</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Theater Name</label>
              <input
                type="text"
                {...register('name')}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                placeholder="e.g. Grand Cinema Hall 1"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.description ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>
          </div>

          {/* MEDIA */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">Media</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gallery Images</label>
              <MultipleImageUploader 
                value={imageFiles} 
                onChange={setImageFiles} 
                aspectRatio="video"
              />
            </div>
          </div>

          {/* LOCATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <select
                  {...register('location')}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.location ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                >
                  <option value="">Select location</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
              <input
                type="text"
                {...register('address')}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.address ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps Link</label>
              <input
                type="url"
                {...register('googleMapsLink')}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.googleMapsLink ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                placeholder="e.g. https://maps.google.com/..."
              />
              {errors.googleMapsLink && <p className="mt-1 text-sm text-red-600">{errors.googleMapsLink.message}</p>}
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Rooms</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setRoomDrafts((rooms) => [...rooms, blankRoom()])}>
                <Plus className="mr-1 h-4 w-4" /> Add Room
              </Button>
            </div>
            {roomDrafts.map((room, roomIndex) => (
              <div key={room._id || roomIndex} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800">Room {roomIndex + 1}</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRoomDrafts((rooms) => rooms.filter((_, index) => index !== roomIndex))} className="text-red-500">Remove Room</Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={room.name} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, name: event.target.value } : item))} placeholder="Room Name *" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, image: event.target.files?.[0] || null } : item))} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
                  <textarea value={room.description} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, description: event.target.value } : item))} placeholder="Description" className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" rows="2" />
                  <label className="text-sm font-medium text-slate-700">Couple *<input type="number" min="1" value={room.couple} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, couple: event.target.value } : item))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
                  <label className="text-sm font-medium text-slate-700">Maximum Members *<input type="number" min="1" value={room.maximumMembers} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, maximumMembers: event.target.value } : item))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
                  <label className="text-sm font-medium text-slate-700">Price / Hr *<input type="number" min="0" value={room.price} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, price: event.target.value } : item))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Time Slots</span><Button type="button" variant="outline" size="sm" onClick={() => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, slots: [...item.slots, { startTime: '', endTime: '', isActive: true }] } : item))}>Add Time Slot</Button></div>
                  {room.slots.map((slot, slotIndex) => <div key={slot._id || slotIndex} className="flex gap-2"><input value={slot.startTime} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, slots: item.slots.map((value, current) => current === slotIndex ? { ...value, startTime: event.target.value } : value) } : item))} placeholder="10:00 AM" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" /><input value={slot.endTime} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, slots: item.slots.map((value, current) => current === slotIndex ? { ...value, endTime: event.target.value } : value) } : item))} placeholder="01:00 PM" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" /><Button type="button" variant="ghost" size="icon" onClick={() => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, slots: item.slots.filter((_, current) => current !== slotIndex) } : item))}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>)}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={room.isActive} onChange={(event) => setRoomDrafts((rooms) => rooms.map((item, index) => index === roomIndex ? { ...item, isActive: event.target.checked } : item))} /> Active</label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
            <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600" />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active (Visible on website)</label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => deleteMutation.mutate(theaterToDelete?._id)}
        title="Delete Theater"
        description={`Are you sure you want to delete "${theaterToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
