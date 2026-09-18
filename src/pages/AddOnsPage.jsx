import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
import { getImageUrl } from '../utils/imageUtils';

import { useAddOns } from '../hooks/useAddOns';
import { addonSchema } from '../validations/addonSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function AddOnsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(addonSchema),
    defaultValues: { isActive: true, price: 0, sortOrder: 0, category: 'Decoration', variants: [] },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useAddOns({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/addons', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Add-on created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.addons.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create add-on'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/addons/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Add-on updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.addons.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update add-on'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/addons/${id}`),
    onSuccess: () => {
      toast.success('Add-on deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.addons.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete add-on'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingAddOn(null);
    setImageFile(null);
    reset({ name: '', description: '', price: 0, category: 'Decoration', isActive: true, sortOrder: 0, variants: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addon) => {
    setEditingAddOn(addon);
    setImageFile(addon.image?.url || null);
    setValue('name', addon.name);
    setValue('description', addon.description || '');
    setValue('price', addon.price);
    setValue('category', addon.category);
    setValue('isActive', addon.isActive);
    setValue('sortOrder', addon.sortOrder);
    setValue('variants', addon.variants || []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (addon) => {
    setAddOnToDelete(addon);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        if (Array.isArray(formData[key])) {
          formData[key].forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              Object.keys(item).forEach(subKey => {
                data.append(`${key}[${index}][${subKey}]`, item[subKey]);
              });
            } else {
              data.append(`${key}[]`, item);
            }
          });
        } else {
          data.append(key, formData[key]);
        }
      }
    });

    if (imageFile instanceof File) {
      data.append('image', imageFile);
    }

    if (editingAddOn) {
      updateMutation.mutate({ id: editingAddOn._id, data });
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
            <img src={getImageUrl(row.image)} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'name', header: 'Add-on Name', sortable: true },
    { key: 'category', header: 'Category' },
    { key: 'price', header: 'Price (₹)', render: (row) => row.price },
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
        title="Services / Add-ons" 
        description="Manage the services and add-ons like Fog Entry, Cakes, Decorations, etc." 
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
          data={data?.data?.addons || data?.data || []}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          pagination={{
            currentPage: data?.pagination?.page || 1,
            totalPages: data?.pagination?.pages || 1
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
        title={editingAddOn ? 'Edit Service' : 'Add New Service'}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              {...register('name')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Fog Entry"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              {...register('category')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.category ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            >
              <option value="Food">Food</option>
              <option value="Decoration">Decoration</option>
              <option value="Experience">Experience</option>
              <option value="Gift">Gift</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Cake">Cake</option>
              <option value="Special Service">Special Service</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
            <input
              type="number"
              {...register('price', { valueAsNumber: true })}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.price ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Variants / Sizes (e.g., Cakes)</label>
              <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({ name: '1 Kg', price: 0 })}>
                <Plus className="h-4 w-4 mr-1" /> Add Variant
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {variantFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    {...register(`variants.${index}.name`)}
                    placeholder="e.g. Half Kg"
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                  />
                  <input
                    type="number"
                    {...register(`variants.${index}.price`, { valueAsNumber: true })}
                    placeholder="Price (₹)"
                    className="block w-32 rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.variants && <p className="mt-1 text-sm text-red-600">{errors.variants.message || "Invalid variants"}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.description ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            />
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
        onConfirm={() => deleteMutation.mutate(addOnToDelete?._id)}
        title="Delete Service"
        description={`Are you sure you want to delete "${addOnToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
