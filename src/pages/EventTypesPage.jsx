import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import FormModal from '../components/common/FormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import ImageUploader from '../components/common/ImageUploader';

import { useEventTypes } from '../hooks/useEventTypes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

// Simple schema just for the form
const eventTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  isActive: z.boolean().default(true),
});

export default function EventTypesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventTypeToDelete, setEventTypeToDelete] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: { isActive: true },
  });

  const { data, isLoading, error, refetch } = useEventTypes();

  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/event-types', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Event type created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create event type'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiClient.put(`/event-types/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Event type updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update event type'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/event-types/${id}`),
    onSuccess: () => {
      toast.success('Event type deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete event type'),
  });

  const handleOpenAddModal = () => {
    setEditingEventType(null);
    setImageFile(null);
    reset({ name: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (eventType) => {
    setEditingEventType(eventType);
    setImageFile(eventType.image?.url || null);
    setValue('name', eventType.name);
    setValue('isActive', eventType.isActive !== false); // Default true if undefined
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (eventType) => {
    setEventTypeToDelete(eventType);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    if (imageFile instanceof File) {
      data.append('image', imageFile);
    }

    if (editingEventType) {
      updateMutation.mutate({ id: editingEventType._id, payload: data });
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
          {(row.image?.url || typeof row.image === 'string') ? (
            <img src={row.image?.url || row.image} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'isActive', header: 'Status', render: (row) => <StatusBadge status={row.isActive !== false} type="boolean" /> },
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
  const eventTypesList = data?.data || [];

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Event Types" 
        description="Manage the types of events (e.g. Birthday, Anniversary) customers can book." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add Event Type
          </Button>
        }
      />

      <div className="flex-1 mt-4">
        <DataTable
          columns={columns}
          data={eventTypesList}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyStateProps={{
            title: 'No event types found',
            description: 'Get started by adding a new event type.',
            actionLabel: 'Add Event Type',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEventType ? 'Edit Event Type' : 'Add New Event Type'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Type Image</label>
            <ImageUploader 
              value={imageFile} 
              onChange={setImageFile} 
              aspectRatio="video"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Type Name</label>
            <input
              type="text"
              {...register('name')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Birthday Party"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="flex items-center gap-2 mt-4">
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
      </FormModal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => deleteMutation.mutate(eventTypeToDelete?._id)}
        title="Delete Event Type"
        description={`Are you sure you want to delete "${eventTypeToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
