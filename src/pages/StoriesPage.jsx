import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  const [sectionImages, setSectionImages] = useState({});

  // Form setup
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(storySchema),
    defaultValues: { isActive: true, author: 'Admin', sections: [] },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'sections',
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
    setSectionImages({});
    reset({ title: '', shortDescription: '', content: '', author: 'Admin', isActive: true, sections: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (story) => {
    setEditingStory(story);
    setImageFile(story.image || null);
    
    const initialSectionImages = {};
    const sections = story.sections || [];
    sections.forEach((sec, idx) => {
      if (sec.image) {
        initialSectionImages[idx] = sec.image;
      }
    });
    setSectionImages(initialSectionImages);

    setValue('title', story.title || '');
    setValue('shortDescription', story.shortDescription || '');
    setValue('content', story.content || '');
    setValue('author', story.author || 'Admin');
    setValue('isActive', story.isActive !== undefined ? story.isActive : true);
    setValue('sections', sections);
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
    setSectionImages({});
  };

  const confirmDelete = (story) => {
    setStoryToDelete(story);
    setDeleteConfirmOpen(true);
  };

  const handleSectionImageChange = (index, file) => {
    setSectionImages(prev => ({ ...prev, [index]: file }));
  };

  const handleRemoveSection = (index) => {
    remove(index);
    setSectionImages(prev => {
      const newImages = { ...prev };
      // Shift indices down for images after the removed one
      for (let i = index; i < fields.length; i++) {
        if (newImages[i + 1] !== undefined) {
          newImages[i] = newImages[i + 1];
        } else {
          delete newImages[i];
        }
      }
      return newImages;
    });
  };

  const handleMoveSection = (index, direction) => {
    if (direction === 'up' && index > 0) {
      move(index, index - 1);
      setSectionImages(prev => {
        const newImages = { ...prev };
        const temp = newImages[index - 1];
        newImages[index - 1] = newImages[index];
        newImages[index] = temp;
        return newImages;
      });
    } else if (direction === 'down' && index < fields.length - 1) {
      move(index, index + 1);
      setSectionImages(prev => {
        const newImages = { ...prev };
        const temp = newImages[index + 1];
        newImages[index + 1] = newImages[index];
        newImages[index] = temp;
        return newImages;
      });
    }
  };

  const onSubmit = (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'sections' && formData[key] !== undefined && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    const sectionsPayload = formData.sections ? formData.sections.map((sec, idx) => ({
      title: sec.title,
      description: sec.description,
      image: typeof sectionImages[idx] === 'string' ? sectionImages[idx] : undefined
    })) : [];

    data.append('sections', JSON.stringify(sectionsPayload));

    if (imageFile instanceof File) {
      data.append('image', imageFile);
    } else if (!imageFile && !editingStory) {
      toast.error('Cover image is required');
      return;
    }

    Object.entries(sectionImages).forEach(([idx, file]) => {
      if (file instanceof File) {
        data.append(`section_image_${idx}`, file);
      }
    });

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
            <img src={getImageUrl(row.image)} alt={row.title} onError={handleImageError} className="h-full w-full object-contain p-0.5" />
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

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingStory ? 'Edit Story' : 'Create New Story'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-8 pb-8">
          
          {/* Cover & General Info */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Story Information</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image *</label>
                <div className="max-w-2xl">
                  <ImageUploader 
                    value={imageFile} 
                    onChange={setImageFile} 
                    aspectRatio="video"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    {...register('title')}
                    className={`block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ${errors.title ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                    placeholder="e.g. Make Every Birthday A Movie Night"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Author *</label>
                  <input
                    type="text"
                    {...register('author')}
                    className={`block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ${errors.author ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                    placeholder="e.g. John Doe"
                  />
                  {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Short Description / Excerpt</label>
                <textarea
                  rows={2}
                  {...register('shortDescription')}
                  className={`block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ${errors.shortDescription ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                  placeholder="A brief summary for the public listing page..."
                />
                {errors.shortDescription && <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
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
          </div>

          {/* Sections Builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Story Sections</h3>
              <Button type="button" size="sm" leftIcon={Plus} onClick={() => append({ title: '', description: '', image: null })}>
                Add Section
              </Button>
            </div>
            
            {fields.length === 0 ? (
              <div className="text-center py-10 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-500 mb-4">No sections added yet. A story should have at least one section.</p>
                <Button type="button" variant="outline" leftIcon={Plus} onClick={() => append({ title: '', description: '', image: null })}>
                  Add First Section
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    {/* Section Header Controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                       <button type="button" onClick={() => handleMoveSection(index, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors">
                         <ArrowUp className="w-4 h-4" />
                       </button>
                       <button type="button" onClick={() => handleMoveSection(index, 'down')} disabled={index === fields.length - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors">
                         <ArrowDown className="w-4 h-4" />
                       </button>
                       <div className="w-px h-4 bg-slate-300 mx-1"></div>
                       <button type="button" onClick={() => handleRemoveSection(index)} className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="flex items-center gap-3 mb-5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className="font-semibold text-slate-700 tracking-wide">SECTION {String(index + 1).padStart(2, '0')}</h4>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-8 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Section Title *</label>
                          <input
                            type="text"
                            {...register(`sections.${index}.title`)}
                            className="block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                            placeholder="e.g. Choose Your Theatre"
                          />
                          {errors.sections?.[index]?.title && <p className="mt-1 text-sm text-red-600">{errors.sections[index].title.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Section Description *</label>
                          <textarea
                            rows={6}
                            {...register(`sections.${index}.description`)}
                            className="block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                            placeholder="Detailed content for this section..."
                          />
                          {errors.sections?.[index]?.description && <p className="mt-1 text-sm text-red-600">{errors.sections[index].description.message}</p>}
                        </div>
                      </div>
                      <div className="lg:col-span-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Section Image (Optional)</label>
                        <ImageUploader 
                          value={sectionImages[index]} 
                          onChange={(file) => handleSectionImageChange(index, file)} 
                          aspectRatio="video"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {fields.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button type="button" variant="outline" leftIcon={Plus} onClick={() => append({ title: '', description: '', image: null })}>
                  Add Another Section
                </Button>
              </div>
            )}
          </div>

          {/* Legacy Content Support - Only show if it's an existing story with legacy content but no sections */}
          {editingStory && editingStory.content && fields.length === 0 && (
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Legacy Content (Deprecated)</h3>
              <p className="text-sm text-amber-700 mb-4">This story uses the old format. Consider migrating this content into new dynamic sections above.</p>
              <textarea
                rows={4}
                {...register('content')}
                className="block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-amber-300 focus:ring-amber-500 sm:text-sm sm:leading-6 px-3 bg-amber-50/50"
              />
            </div>
          )}

        </div>
      </FormModal>

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
