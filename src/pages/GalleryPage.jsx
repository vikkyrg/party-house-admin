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
import { getImageUrl } from '../utils/imageUtils';

import { useGallery } from '../hooks/useGallery';
import { gallerySchema } from '../validations/gallerySchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(gallerySchema),
    defaultValues: { isActive: true, sortOrder: 0, category: 'Home' },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useGallery({
    page,
    limit: 10,
    search: debouncedSearch,
    includeInactive: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Gallery item created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create gallery item'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/gallery/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Gallery item updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update gallery item'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/gallery/${id}`),
    onSuccess: () => {
      toast.success('Gallery item deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete gallery item'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingGallery(null);
    setImageFile(null);
    reset({ title: '', category: 'Home', sortOrder: 0, isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gallery) => {
    setEditingGallery(gallery);
    setImageFile(gallery.image || null);
    setValue('title', gallery.title || '');
    setValue('category', gallery.category || 'Home');
    setValue('sortOrder', gallery.sortOrder || 0);
    setValue('isActive', gallery.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (gallery) => {
    setGalleryToDelete(gallery);
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
    } else if (!imageFile && !editingGallery) {
      toast.error('Image is required');
      return;
    }

    if (editingGallery) {
      updateMutation.mutate({ id: editingGallery._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'image', 
      header: 'Image', 
      render: (row) => (
        <div className="h-16 w-16 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {(row.image || typeof row.image === 'string') ? (
            <img src={getImageUrl(row.image)} alt={row.title || 'Gallery'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'title', header: 'Title', render: (row) => row.title || <span className="text-slate-400 italic">No Title</span> },
    { key: 'category', header: 'Category', sortable: true },
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
        title="Gallery" 
        description="Manage the gallery images and their categories." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add Image
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search gallery..."
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
            title: 'No gallery items found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new image to the gallery.',
            actionLabel: debouncedSearch ? null : 'Add Image',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGallery ? 'Edit Gallery Item' : 'Add New Gallery Item'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
            <ImageUploader 
              value={imageFile} 
              onChange={setImageFile} 
              aspectRatio="video"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title (Optional)</label>
            <input
              type="text"
              {...register('title')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.title ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Birthday Setup"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              {...register('category')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.category ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            >
              <option value="Home">Home</option>
              <option value="Theater">Theater</option>
              <option value="Celebration">Celebration</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
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
        onConfirm={() => deleteMutation.mutate(galleryToDelete?._id)}
        title="Delete Gallery Item"
        description={`Are you sure you want to delete this gallery item? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
