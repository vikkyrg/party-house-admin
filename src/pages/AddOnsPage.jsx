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

import { useAddOns } from '../hooks/useAddOns';
import { addonSchema } from '../validations/addonSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function AddOnsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Extra Decoration');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(addonSchema),
    defaultValues: { isActive: true, price: 0, sortOrder: 0, category: activeTab },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useAddOns({
    page,
    limit: 50,
    search: debouncedSearch,
    category: activeTab
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/addons', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('Add-on created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.addOns.all() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.addOns.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update add-on'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/addons/${id}`),
    onSuccess: () => {
      toast.success('Add-on deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.addOns.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete add-on'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingAddOn(null);
    setImageFile(null);
    reset({ name: '', price: 0, category: activeTab, isActive: true, sortOrder: 1 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addon) => {
    setEditingAddOn(addon);
    setImageFile(addon.image?.url || null);
    setValue('name', addon.name);
    setValue('price', addon.price);
    setValue('category', addon.category);
    setValue('isActive', addon.isActive);
    setValue('sortOrder', addon.sortOrder);
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
          formData[key].forEach((item) => {
            data.append(`${key}[]`, item);
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
            <img src={getImageUrl(row.image)} alt={row.name} onError={handleImageError} className="h-full w-full object-contain p-0.5" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'name', header: 'Add-on Name', sortable: true },
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
        title="Add-ons" 
        description="Manage the add-ons and services for bookings." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add {activeTab.replace('Extra ', '').replace('Choose ', '').replace(/s$/, '')}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="border-b border-slate-200 mt-4 mb-4">
        <nav className="-mb-px flex space-x-8">
          {['Extra Decoration', 'Choose Gifts', 'Special Services'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
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
            title: `No ${activeTab.toLowerCase()} found`,
            description: debouncedSearch ? 'Try adjusting your search query.' : `Get started by adding a new ${activeTab.toLowerCase()}.`,
            actionLabel: debouncedSearch ? null : `Add ${activeTab.replace('Extra ', '').replace('Choose ', '').replace(/s$/, '')}`,
            onAction: handleOpenAddModal
          }}
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAddOn ? `Edit ${activeTab.replace('Extra ', '').replace('Choose ', '').replace(/s$/, '')}` : `Add New ${activeTab.replace('Extra ', '').replace('Choose ', '').replace(/s$/, '')}`}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              {...register('name')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Rose Heart"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
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
              Visible on website
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
