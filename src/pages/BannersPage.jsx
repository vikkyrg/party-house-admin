import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
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

import { useBanners } from '../hooks/useBanners';
import { bannerSchema } from '../validations/bannerSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(bannerSchema),
    defaultValues: { isActive: true, position: 'homepage-hero', priority: 0 },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useBanners({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/banners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Banner created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create banner'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/banners/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Banner updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/banners/${id}`),
    onSuccess: () => {
      toast.success('Banner deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete banner'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setImageFile(null);
    reset({ title: '', link: '', position: 'homepage-hero', priority: 0, isActive: true, startDate: '', endDate: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setImageFile(banner.image?.url || null);
    setValue('title', banner.title);
    setValue('link', banner.link || '');
    setValue('position', banner.position);
    setValue('priority', banner.priority || 0);
    setValue('isActive', banner.isActive);
    setValue('startDate', banner.startDate ? banner.startDate.substring(0, 10) : '');
    setValue('endDate', banner.endDate ? banner.endDate.substring(0, 10) : '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (banner) => {
    setBannerToDelete(banner);
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
    } else if (!imageFile && !editingBanner) {
      toast.error('Image is required');
      return;
    }

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'image', 
      header: 'Image', 
      render: (row) => (
        <div className="h-12 w-24 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
          {(row.image?.url || typeof row.image === 'string') ? (
            <img src={getImageUrl(row.image)} alt={row.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-slate-400">No Image</span>
          )}
        </div>
      )
    },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'position', header: 'Position', sortable: true, render: (row) => <span className="uppercase text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{row.position}</span> },
    { key: 'priority', header: 'Priority', sortable: true },
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
        title="Banners" 
        description="Manage the promotional banners shown on the website." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add Banner
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search banners..."
      />

      <div className="flex-1">
        <DataTable
          columns={columns}
          data={data?.data?.banners || data?.data || []}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          pagination={{
            currentPage: data?.pagination?.page || 1,
            totalPages: data?.pagination?.pages || 1
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'No banners found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new banner.',
            actionLabel: debouncedSearch ? null : 'Add Banner',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          
          <ImageUploader
            value={imageFile}
            onChange={setImageFile}
            onClear={() => setImageFile(null)}
            label="Banner Image"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              {...register('title')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.title ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Summer Blockbusters"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
              <select
                {...register('position')}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.position ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              >
                <option value="homepage-hero">Homepage Hero</option>
                <option value="homepage-mid">Homepage Mid</option>
                <option value="city-page">City Page</option>
                <option value="footer">Footer</option>
              </select>
              {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link URL (Optional)</label>
              <input
                type="text"
                {...register('link')}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.link ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                placeholder="https://..."
              />
              {errors.link && <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date (Optional)</label>
              <input
                type="date"
                {...register('startDate')}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.startDate ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                {...register('endDate')}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.endDate ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority (Higher = first)</label>
            <input
              type="number"
              {...register('priority', { valueAsNumber: true })}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.priority ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="0"
            />
            {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>}
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
        onConfirm={() => deleteMutation.mutate(bannerToDelete?._id)}
        title="Delete Banner"
        description={`Are you sure you want to delete "${bannerToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
