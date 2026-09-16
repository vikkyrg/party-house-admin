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

import { useCities } from '../hooks/useCities';
import { citySchema } from '../validations/citySchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function CitiesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(citySchema),
    defaultValues: { isActive: true },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useCities({
    page,
    limit: 10,
    search: debouncedSearch,
    includeInactive: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => apiClient.post('/cities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('City created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create city'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/cities/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      toast.success('City updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update city'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/cities/${id}`),
    onSuccess: () => {
      toast.success('City deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete city'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingCity(null);
    setImageFile(null);
    reset({ name: '', code: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (city) => {
    setEditingCity(city);
    setImageFile(city.image?.url || null);
    setValue('name', city.name);
    setValue('code', city.code);
    setValue('isActive', city.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFile(null);
  };

  const confirmDelete = (city) => {
    setCityToDelete(city);
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

    if (editingCity) {
      updateMutation.mutate({ id: editingCity._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'image', 
      header: 'Image', 
      render: (row) => (
        <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {(row.image?.url || typeof row.image === 'string') ? (
            <img src={row.image?.url || row.image} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">No Img</span>
          )}
        </div>
      )
    },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="uppercase font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">{row.code}</span> },
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
        title="Cities" 
        description="Manage the cities where theaters are located." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add City
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search cities..."
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
            title: 'No cities found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new city.',
            actionLabel: debouncedSearch ? null : 'Add City',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCity ? 'Edit City' : 'Add New City'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City Image</label>
            <ImageUploader 
              value={imageFile} 
              onChange={setImageFile} 
              aspectRatio="square"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City Name</label>
            <input
              type="text"
              {...register('name')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. Mumbai"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City Code</label>
            <input
              type="text"
              {...register('code')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.code ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3 uppercase`}
              placeholder="e.g. MUM"
            />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
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
        onConfirm={() => deleteMutation.mutate(cityToDelete?._id)}
        title="Delete City"
        description={`Are you sure you want to delete "${cityToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
