import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
import ImageUploader from '../components/common/ImageUploader';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

import { useServices } from '../hooks/useServices';
import { serviceSchema } from '../validations/serviceSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { isActive: true, sortOrder: 0 },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useServices({
    page,
    limit: 10,
    search: debouncedSearch,
    includeInactive: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/services', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Service created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create service'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/services/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Service updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update service'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/services/${id}`),
    onSuccess: () => {
      toast.success('Service deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete service'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingService(null);
    setImageFile(null);
    reset({ title: '', description: '', features: '', sortOrder: 0, isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setImageFile(service.image || null);
    setValue('title', service.title);
    setValue('description', service.description);
    setValue('features', service.features ? service.features.join(', ') : '');
    setValue('sortOrder', service.sortOrder || 0);
    setValue('isActive', service.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (service) => {
    setServiceToDelete(service);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        if (key === 'features') {
            // Split features by comma if not empty
            if (formData[key].trim()) {
                const featuresArray = formData[key].split(',').map(f => f.trim()).filter(f => f);
                featuresArray.forEach(f => data.append('features[]', f));
            }
        } else {
            data.append(key, formData[key]);
        }
      }
    });

    if (imageFile instanceof File) {
      data.append('image', imageFile);
    } else if (!imageFile && !editingService) {
      toast.error('Image is required');
      return;
    }

    if (editingService) {
      updateMutation.mutate({ id: editingService._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'image', 
      header: 'Image', 
      render: (row) => (
        <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {(row.image || typeof row.image === 'string') ? (
            <img src={getImageUrl(row.image)} alt={row.title} onError={handleImageError} className="h-full w-full object-contain p-0.5" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'sortOrder', header: 'Order', sortable: true },
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
        title="Services" 
        description="Manage the services offered on the platform." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add Service
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search services..."
      />

      <div className="flex-1">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          pagination={{
            currentPage: data?.pagination?.page || 1,
            totalPages: data?.pagination?.totalPages || 1
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'No services found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new service.',
            actionLabel: debouncedSearch ? null : 'Add Service',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Image</label>
            <ImageUploader 
              value={imageFile} 
              onChange={setImageFile} 
              aspectRatio="video"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              {...register('title')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.title ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Birthday Party"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              {...register('description')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.description ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="Detailed description of the service..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Features (comma separated)</label>
            <input
              type="text"
              {...register('features')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.features ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Decorations, Catering, Music"
            />
            {errors.features && <p className="mt-1 text-sm text-red-600">{errors.features.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
            <input
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.sortOrder ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            />
            {errors.sortOrder && <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => deleteMutation.mutate(serviceToDelete?._id)}
        title="Delete Service"
        description={`Are you sure you want to delete "${serviceToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
