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

import { reviewService } from '../services/reviewService';
import { useTheaters } from '../hooks/useTheaters';
import { reviewSchema } from '../validations/reviewSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  
  const [mediaFile, setMediaFile] = useState(null);

  const { data: theatersData } = useTheaters();
  const theaters = theatersData?.data || [];

  // Form setup
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { isPublished: true, rating: 5, mediaType: 'none', mediaUrl: '', theater: '' },
  });

  const mediaType = watch('mediaType');

  // Data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', 'admin', { page, limit: 10, search: debouncedSearch }],
    queryFn: () => reviewService.getAll({ page, limit: 10, search: debouncedSearch }),
    keepPreviousData: true,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => reviewService.create(formData),
    onSuccess: () => {
      toast.success('Review created successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create review'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => reviewService.update(id, data),
    onSuccess: () => {
      toast.success('Review updated successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update review'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => reviewService.delete(id),
    onSuccess: () => {
      toast.success('Review deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete review'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingReview(null);
    setMediaFile(null);
    reset({ customerName: '', comment: '', rating: 5, isPublished: true, mediaType: 'none', mediaUrl: '', theater: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (review) => {
    setEditingReview(review);
    setMediaFile(review.mediaType !== 'link' && review.mediaUrl ? review.mediaUrl : null);
    setValue('customerName', review.customerName || review.user?.name || '');
    setValue('comment', review.comment || '');
    setValue('rating', review.rating);
    setValue('isPublished', review.isPublished ?? review.isApproved);
    setValue('mediaType', review.mediaType || 'none');
    setValue('mediaUrl', review.mediaType === 'link' ? review.mediaUrl : '');
    setValue('theater', review.theater?._id || review.theater || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setMediaFile(null);
  };

  const confirmDelete = (review) => {
    setReviewToDelete(review);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    if (mediaFile instanceof File) {
      data.append('media', mediaFile);
    }

    if (editingReview) {
      updateMutation.mutate({ id: editingReview._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'customerName', 
      header: 'Customer', 
      render: (row) => row.customerName || row.user?.name || 'Unknown',
      sortable: true 
    },
    { 
      key: 'rating', 
      header: 'Rating',
      render: (row) => (
        <div className="flex items-center text-yellow-500">
          {'★'.repeat(row.rating)}{'☆'.repeat(5 - row.rating)}
        </div>
      )
    },
    { 
      key: 'comment', 
      header: 'Review',
      render: (row) => (
        <div className="max-w-xs truncate" title={row.comment}>
          {row.comment}
        </div>
      )
    },
    {
      key: 'mediaType',
      header: 'Media',
      render: (row) => (
        <span className="capitalize">{row.mediaType || 'None'}</span>
      )
    },
    { 
      key: 'theater', 
      header: 'Theater',
      render: (row) => row.theater?.name || '-'
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge 
          status={row.isPublished ? 'active' : 'inactive'} 
          text={row.isPublished ? 'Published' : 'Draft'} 
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(row)}>
            <Edit className="h-4 w-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => confirmDelete(row)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ], []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading reviews: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reviews" 
        description="Manage customer reviews and media"
        actions={
          <Button onClick={handleOpenAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Review
          </Button>
        }
      />

      <div className="card">
        <DataTableToolbar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search customer or review..."
        />
        
        <DataTable 
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          keyExtractor={(item) => item._id}
          emptyStateProps={{
            title: 'No reviews found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new customer review.',
            actionLabel: debouncedSearch ? null : 'Add Review',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingReview ? 'Edit Review' : 'Add Review'}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
              <input
                {...register('customerName')}
                type="text"
                className={`input-field ${errors.customerName ? 'border-red-500' : ''}`}
                placeholder="Enter customer name"
              />
              {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location / Theatre</label>
              <select {...register('theater')} className="input-field">
                <option value="">Select theatre (Optional)</option>
                {theaters.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
            <select {...register('rating')} className="input-field">
              {[5, 4, 3, 2, 1].map(r => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Review</label>
            <textarea
              {...register('comment')}
              rows={4}
              className={`input-field ${errors.comment ? 'border-red-500' : ''}`}
              placeholder="Write customer review..."
            />
            {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment.message}</p>}
          </div>

          <div className="border-t pt-4 border-slate-100">
            <h4 className="font-medium text-slate-800 mb-3">Media</h4>
            <div className="flex gap-4 mb-4">
              {['none', 'image', 'video', 'link'].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={type}
                    {...register('mediaType')}
                    className="accent-primary-600"
                  />
                  <span className="capitalize text-sm text-slate-700">{type}</span>
                </label>
              ))}
            </div>

            {(mediaType === 'image' || mediaType === 'video') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload Review {mediaType === 'image' ? 'Image' : 'Video'}
                </label>
                <ImageUploader 
                  value={typeof mediaFile === 'string' ? mediaFile : mediaFile}
                  onChange={setMediaFile}
                  onClear={() => setMediaFile(null)}
                  accept={mediaType === 'video' ? 'video/mp4, video/webm' : 'image/png, image/jpeg, image/webp'}
                />
                {mediaType === 'video' && <p className="text-xs text-slate-500 mt-2">Maximum file size: 10MB (MP4, WEBM)</p>}
              </div>
            )}

            {mediaType === 'link' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Video / Media URL</label>
                <input
                  {...register('mediaUrl')}
                  type="url"
                  className={`input-field ${errors.mediaUrl ? 'border-red-500' : ''}`}
                  placeholder="https://..."
                />
                {errors.mediaUrl && <p className="text-red-500 text-xs mt-1">{errors.mediaUrl.message}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublished"
              {...register('isPublished')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="text-sm text-slate-700 font-medium">
              Published (Visible on website)
            </label>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(reviewToDelete?._id)}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
