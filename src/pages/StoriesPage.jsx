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

import { useStories } from '../hooks/useStories';
import { storySchema } from '../validations/storySchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function StoriesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(storySchema),
    defaultValues: { isActive: true, author: 'Admin' },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useStories({
    page,
    limit: 10,
    search: debouncedSearch,
    includeInactive: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Story created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create story'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/stories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Story updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update story'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/stories/${id}`),
    onSuccess: () => {
      toast.success('Story deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete story'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingStory(null);
    setImageFile(null);
    reset({ title: '', content: '', author: 'Admin', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (story) => {
    setEditingStory(story);
    setImageFile(story.image || null);
    setValue('title', story.title);
    setValue('content', story.content);
    setValue('author', story.author || 'Admin');
    setValue('isActive', story.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (story) => {
    setStoryToDelete(story);
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
    } else if (!imageFile && !editingStory) {
      toast.error('Image is required');
      return;
    }

    if (editingStory) {
      updateMutation.mutate({ id: editingStory._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'image', 
      header: 'Cover', 
      render: (row) => (
        <div className="h-10 w-16 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {(row.image || typeof row.image === 'string') ? (
            <img src={getImageUrl(row.image)} alt={row.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'title', header: 'Title', sortable: true, render: (row) => <span className="font-medium">{row.title}</span> },
    { key: 'author', header: 'Author', sortable: true },
    { key: 'publishedAt', header: 'Published', sortable: true, render: (row) => new Date(row.publishedAt).toLocaleDateString() },
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
        title="Stories & Blogs" 
        description="Manage your platform's stories and blog posts." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add Story
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search stories..."
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
            title: 'No stories found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by publishing a new story.',
            actionLabel: debouncedSearch ? null : 'Add Story',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingStory ? 'Edit Story' : 'Create New Story'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
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
              placeholder="e.g. 10 Best Birthday Themes"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
            <input
              type="text"
              {...register('author')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.author ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. John Doe"
            />
            {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <textarea
              rows={8}
              {...register('content')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.content ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="Write your story content here..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Published (Visible on website)
            </label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => deleteMutation.mutate(storyToDelete?._id)}
        title="Delete Story"
        description={`Are you sure you want to delete "${storyToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
