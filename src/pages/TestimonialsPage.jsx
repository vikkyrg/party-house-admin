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

import { useTestimonials } from '../hooks/useTestimonials';
import { testimonialSchema } from '../validations/testimonialSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function TestimonialsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { isActive: true, isFeatured: false, rating: 5, sortOrder: 0 },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useTestimonials({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/testimonials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Testimonial created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.testimonials.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create testimonial'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/testimonials/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Testimonial updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.testimonials.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update testimonial'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/testimonials/${id}`),
    onSuccess: () => {
      toast.success('Testimonial deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.testimonials.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete testimonial'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingTestimonial(null);
    setImageFile(null);
    reset({ customerName: '', text: '', rating: 5, isFeatured: false, isActive: true, sortOrder: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (testimonial) => {
    setEditingTestimonial(testimonial);
    setImageFile(testimonial.image?.url || null);
    setValue('customerName', testimonial.customerName);
    setValue('text', testimonial.text || '');
    setValue('rating', testimonial.rating);
    setValue('isActive', testimonial.isActive);
    setValue('isFeatured', testimonial.isFeatured);
    setValue('sortOrder', testimonial.sortOrder);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (testimonial) => {
    setTestimonialToDelete(testimonial);
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

    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'image', 
      header: 'Avatar', 
      render: (row) => (
        <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {(row.image?.url || typeof row.image === 'string') ? (
            <img src={getImageUrl(row.image)} alt={row.customerName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'rating', header: 'Rating', render: (row) => `${row.rating}/5` },
    { key: 'text', header: 'Review', render: (row) => (
      <div className="max-w-xs truncate" title={row.text}>
        {row.text}
      </div>
    )},
    { key: 'isFeatured', header: 'Featured', render: (row) => <StatusBadge status={row.isFeatured} type="boolean" /> },
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
        title="Testimonials" 
        description="Manage customer reviews and testimonials shown on the website." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add Testimonial
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customer names..."
      />

      <div className="flex-1">
        <DataTable
          columns={columns}
          data={data?.data?.testimonials || data?.data || []}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          pagination={{
            currentPage: data?.pagination?.page || 1,
            totalPages: data?.pagination?.pages || 1
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'No testimonials found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new testimonial.',
            actionLabel: debouncedSearch ? null : 'Add Testimonial',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Avatar</label>
            <ImageUploader 
              value={imageFile} 
              onChange={setImageFile} 
              aspectRatio="square"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
            <input
              type="text"
              {...register('customerName')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.customerName ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. John Doe"
            />
            {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              {...register('rating', { valueAsNumber: true })}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.rating ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            />
            {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Review Text</label>
            <textarea
              {...register('text')}
              rows={4}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.text ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            />
            {errors.text && <p className="mt-1 text-sm text-red-600">{errors.text.message}</p>}
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Active
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                {...register('isFeatured')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-slate-700">
                Featured (Show on Home)
              </label>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => deleteMutation.mutate(testimonialToDelete?._id)}
        title="Delete Testimonial"
        description={`Are you sure you want to delete the review by "${testimonialToDelete?.customerName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
