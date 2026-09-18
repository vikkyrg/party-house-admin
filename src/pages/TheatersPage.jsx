import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { useCities } from '../hooks/useCities';
import { useLocations } from '../hooks/useLocations';
import { useEventTypes } from '../hooks/useEventTypes';
import { theaterSchema } from '../validations/theaterSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

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

  // Form setup
  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm({
    resolver: zodResolver(theaterSchema),
    defaultValues: { isActive: true, city: '', location: '', eventTypes: [], features: [], rules: [], slots: [{ startTime: '10:00 AM', endTime: '01:00 PM' }] },
  });

  const { fields: slotFields, append: appendSlot, remove: removeSlot, replace: replaceSlots } = useFieldArray({
    control,
    name: 'slots',
  });

  const selectedCity = watch('city');

  // Data fetching
  const { data, isLoading, error, refetch } = useTheaters({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  const { data: citiesData } = useCities({ limit: 100 });
  const cities = citiesData?.data?.cities || citiesData?.data || [];

  const { data: locationsData } = useLocations({ city: selectedCity, limit: 100 });
  const locations = locationsData?.data?.locations || locationsData?.data || [];

  const { data: eventTypesData } = useEventTypes({ limit: 100 });
  const eventTypes = eventTypesData?.data?.eventTypes || eventTypesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/theaters', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Theater created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.theaters.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create theater'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/theaters/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
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
    reset({ name: '', description: '', address: '', capacity: 10, pricePerHour: 0, additionalGuestPrice: 0, googleMapsLink: '', theatreVideoUrl: '', branchVideoUrl: '', city: '', location: '', eventTypes: [], slots: [{ startTime: '10:00 AM', endTime: '01:00 PM' }], isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (theater) => {
    setEditingTheater(theater);
    setImageFiles(theater.images || []);
    setValue('name', theater.name);
    setValue('description', theater.description || '');
    setValue('address', theater.address || '');
    setValue('googleMapsLink', theater.googleMapsLink || '');
    setValue('theatreVideoUrl', theater.theatreVideoUrl || '');
    setValue('branchVideoUrl', theater.branchVideoUrl || '');
    setValue('capacity', theater.capacity);
    setValue('pricePerHour', theater.pricePerHour);
    setValue('additionalGuestPrice', theater.additionalGuestPrice || 0);
    setValue('city', theater.city?._id || theater.city);
    // Allow city to settle before setting location if needed, though react-hook-form does it sync.
    setTimeout(() => {
      setValue('location', theater.location?._id || theater.location);
    }, 100);
    setValue('eventTypes', theater.eventTypes?.map(e => e._id || e) || []);
    replaceSlots(theater.slots?.length > 0 ? theater.slots.map(s => ({ startTime: s.startTime, endTime: s.endTime })) : []);
    setValue('isActive', theater.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFiles([]);
  };

  const confirmDelete = (theater) => {
    setTheaterToDelete(theater);
    setDeleteConfirmOpen(true);
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
      updateMutation.mutate({ id: editingTheater._id, data });
    } else {
      createMutation.mutate(data);
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
    { key: 'city', header: 'City', render: (row) => row.city?.name || 'N/A' },
    { key: 'location', header: 'Location', render: (row) => row.location?.name || 'N/A' },
    { key: 'capacity', header: 'Capacity' },
    { key: 'pricePerHour', header: 'Price/Hr', render: (row) => `₹${row.pricePerHour}` },
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Theatre Video URL</label>
                <input
                  type="url"
                  {...register('theatreVideoUrl')}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.theatreVideoUrl ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                  placeholder="e.g. https://youtube.com/..."
                />
                {errors.theatreVideoUrl && <p className="mt-1 text-sm text-red-600">{errors.theatreVideoUrl.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch Video URL</label>
                <input
                  type="url"
                  {...register('branchVideoUrl')}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.branchVideoUrl ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                  placeholder="e.g. https://youtube.com/..."
                />
                {errors.branchVideoUrl && <p className="mt-1 text-sm text-red-600">{errors.branchVideoUrl.message}</p>}
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <select
                  {...register('city')}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.city ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                >
                  <option value="">Select city</option>
                  {cities.map(city => (
                    <option key={city._id} value={city._id}>{city.name}</option>
                  ))}
                </select>
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <select
                  {...register('location')}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.location ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                  disabled={!selectedCity}
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

          {/* PRICING & CAPACITY */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">Pricing & Capacity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.capacity ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                />
                {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base Price / Hr</label>
                <input
                  type="number"
                  {...register('pricePerHour', { valueAsNumber: true })}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.pricePerHour ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                />
                {errors.pricePerHour && <p className="mt-1 text-sm text-red-600">{errors.pricePerHour.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Guest Price</label>
                <input
                  type="number"
                  {...register('additionalGuestPrice', { valueAsNumber: true })}
                  className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.additionalGuestPrice ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                />
                {errors.additionalGuestPrice && <p className="mt-1 text-sm text-red-600">{errors.additionalGuestPrice.message}</p>}
              </div>
            </div>
          </div>

          {/* FEATURES */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">Features</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Types (Select multiple)</label>
              <Controller
                name="eventTypes"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2 p-3 border border-slate-300 rounded-md min-h-[80px]">
                    {eventTypes.length === 0 ? (
                      <p className="text-xs text-slate-400 m-auto">No event types available. Add some in Event Types page.</p>
                    ) : (
                      eventTypes.map(type => {
                        const isSelected = (field.value || []).includes(type._id);
                        return (
                          <button
                            key={type._id}
                            type="button"
                            onClick={() => {
                              const current = field.value || [];
                              if (isSelected) {
                                field.onChange(current.filter(id => id !== type._id));
                              } else {
                                field.onChange([...current, type._id]);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              isSelected
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-primary-400'
                            }`}
                          >
                            {type.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              />
              {errors.eventTypes && <p className="mt-1 text-sm text-red-600">{errors.eventTypes.message}</p>}
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">Availability</h3>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Time Slots</label>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSlot({ startTime: '10:00 AM', endTime: '01:00 PM' })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Slot
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                {slotFields.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-md">
                    No time slots added. Click "+ Add Slot" to add one.
                  </p>
                ) : (
                  slotFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        {...register(`slots.${index}.startTime`)}
                        placeholder="e.g. 10:00 AM"
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="text"
                        {...register(`slots.${index}.endTime`)}
                        placeholder="e.g. 01:00 PM"
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
                {errors.slots && <p className="mt-1 text-sm text-red-600">{errors.slots.message || "Invalid slots"}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Active (Visible on website)
              </label>
            </div>
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
