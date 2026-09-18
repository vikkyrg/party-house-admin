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

import { useCakes } from '../hooks/useCakes';
import { cakeSchema } from '../validations/cakeSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function CakesPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cakeToDelete, setCakeToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(cakeSchema),
    defaultValues: { 
      isActive: true, 
      sortOrder: 1, 
      category: 'standard',
      sizes: [{ name: '0.5kg', label: 'Half Kg', price: 500 }] 
    },
  });

  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
    control,
    name: 'sizes',
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useCakes({
    page,
    limit: 50,
    search: debouncedSearch,
    category: activeCategory,
    includeInactive: true,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/cakes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Cake created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.cakes.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create cake'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/cakes/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Cake updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.cakes.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update cake'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/cakes/${id}`),
    onSuccess: () => {
      toast.success('Cake deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.cakes.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete cake'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingCake(null);
    setImageFile(null);
    reset({ name: '', description: '', category: activeCategory, isActive: true, sortOrder: 1, sizes: [{ name: '0.5kg', label: 'Half Kg', price: 500 }] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cake) => {
    setEditingCake(cake);
    setImageFile(cake.image?.url || null);
    setValue('name', cake.name);
    setValue('description', cake.description || '');
    setValue('category', cake.category || 'standard');
    setValue('isActive', cake.isActive);
    setValue('sortOrder', cake.sortOrder);
    setValue('sizes', cake.sizes || []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (cake) => {
    setCakeToDelete(cake);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        if (key === 'sizes') {
          data.append(key, JSON.stringify(formData[key]));
        } else if (Array.isArray(formData[key])) {
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
    } else if (!editingCake) {
      toast.error('Cake image is required.');
      return;
    }

    if (editingCake) {
      updateMutation.mutate({ id: editingCake._id, data });
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
    { key: 'name', header: 'Cake Name', sortable: true },
    { key: 'category', header: 'Category', render: (row) => row.category === 'premium' ? 'Premium' : 'Standard' },
    { 
      key: 'sizes', 
      header: 'Sizes/Prices', 
      render: (row) => (
        <div className="text-sm text-slate-600">
          {row.sizes?.map(size => (
            <div key={size.name}>{size.label}: ₹{size.price}</div>
          ))}
        </div>
      )
    },
    { key: 'sortOrder', header: 'Sort Order' },
    { key: 'isActive', header: 'Published', render: (row) => <StatusBadge status={row.isActive} type="boolean" /> },
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
        title="Cakes" 
        description="Manage standard and premium cakes available for customer bookings." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add {activeCategory === 'premium' ? 'Premium' : 'Standard'} Cake
          </Button>
        }
      />

      <div className="mt-4 mb-4 flex gap-2 border-b border-slate-200">
        {[['standard', 'Standard Cakes'], ['premium', 'Premium Cakes']].map(([category, label]) => (
          <button
            key={category}
            type="button"
            onClick={() => { setActiveCategory(category); setPage(1); }}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeCategory === category ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search cakes..."
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
            totalPages: data?.pagination?.pages || 1
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'No cakes found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new cake.',
            actionLabel: debouncedSearch ? null : 'Add Cake',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCake ? 'Edit Cake' : `Add New ${activeCategory === 'premium' ? 'Premium' : 'Standard'} Cake`}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select {...register('category')} disabled={Boolean(editingCake)} className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm">
              <option value="standard">Standard Cake</option>
              <option value="premium">Premium Cake</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cake Image</label>
            <ImageUploader 
              value={imageFile} 
              onChange={setImageFile} 
              aspectRatio="square"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cake Name</label>
            <input
              type="text"
              {...register('name')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Chocolate Truffle Cake"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.description ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="Rich chocolate cake suitable for birthdays..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Cake Sizes / Pricing</label>
              <Button type="button" variant="outline" size="sm" onClick={() => appendSize({ name: '2kg', label: '2 Kg', price: 1500 })}>
                <Plus className="h-4 w-4 mr-1" /> Add Size
              </Button>
            </div>
            <div className="space-y-2 p-1">
              {sizeFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    {...register(`sizes.${index}.name`)}
                    placeholder="e.g. 0.5kg"
                    className="hidden" // hide system name if not strictly needed, but let's keep it visible for dev
                  />
                  <input
                    type="text"
                    {...register(`sizes.${index}.label`)}
                    placeholder="e.g. Half Kg"
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                  />
                  <input
                    type="number"
                    {...register(`sizes.${index}.price`, { valueAsNumber: true })}
                    placeholder="Price (₹)"
                    className="block w-32 rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-primary-600 sm:text-sm sm:leading-6 px-3"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSize(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.sizes && <p className="mt-1 text-sm text-red-600">{errors.sizes.message || "Invalid sizes"}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
            <input
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.sortOrder ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
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
              Published (Visible on website)
            </label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => deleteMutation.mutate(cakeToDelete?._id)}
        title="Delete Cake"
        description={`Are you sure you want to delete "${cakeToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
