import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
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
import MultiImageUploader from '../components/common/MultiImageUploader';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

import { useAddOns } from '../hooks/useAddOns';
import { addonService } from '../services/addonService';
import { addonSchema } from '../validations/addonSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function AddOnsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Special Services');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState(null);
  
  const [imageFiles, setImageFiles] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [orderedItems, setOrderedItems] = useState([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(addonSchema),
    defaultValues: { isActive: true, price1Hour: 0, price2Hours: 0, price3Hours: 0, category: activeTab },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useAddOns({
    page,
    limit: 50,
    search: debouncedSearch,
    category: activeTab
  });

  const rawList = useMemo(() => {
    return data?.data?.addons || data?.data || [];
  }, [data]);

  useEffect(() => {
    setOrderedItems(rawList);
  }, [rawList]);

  const saveOrder = async (newList) => {
    setOrderedItems(newList);
    setIsReordering(true);
    try {
      const addOnIds = newList.map(item => item._id || item.id);
      await addonService.reorder(addOnIds);
      toast.success('Add-on order updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.addOns.all() });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
      setOrderedItems(rawList);
    } finally {
      setIsReordering(false);
    }
  };

  const moveUp = (index) => {
    if (index <= 0 || isReordering) return;
    const nextList = [...orderedItems];
    const temp = nextList[index];
    nextList[index] = nextList[index - 1];
    nextList[index - 1] = temp;
    saveOrder(nextList);
  };

  const moveDown = (index) => {
    if (index >= orderedItems.length - 1 || isReordering) return;
    const nextList = [...orderedItems];
    const temp = nextList[index];
    nextList[index] = nextList[index + 1];
    nextList[index + 1] = temp;
    saveOrder(nextList);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (index) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const nextList = [...orderedItems];
    const [draggedItem] = nextList.splice(draggedIndex, 1);
    nextList.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(null);
    saveOrder(nextList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
    setImageFiles([]);
    reset({ name: '', price1Hour: 0, price2Hours: 0, price3Hours: 0, category: activeTab, isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addon) => {
    setEditingAddOn(addon);
    const existing = [];
    if (Array.isArray(addon.images) && addon.images.length > 0) {
      addon.images.forEach((img, idx) => {
        existing.push({
          id: 'existing_' + (img.publicId || idx),
          url: img.url,
          publicId: img.publicId,
          alt: img.alt,
        });
      });
    } else if (addon.image?.url || (typeof addon.image === 'string' && addon.image)) {
      const url = addon.image?.url || addon.image;
      existing.push({
        id: 'existing_single',
        url,
        publicId: addon.image?.publicId,
        alt: addon.image?.alt,
      });
    }
    setImageFiles(existing);
    setValue('name', addon.name);
    const p1 = addon.price1Hour ?? addon.pricing?.oneHour ?? addon.price ?? 0;
    const p2 = addon.price2Hours ?? addon.pricing?.twoHours ?? addon.price ?? 0;
    const p3 = addon.price3Hours ?? addon.pricing?.threeHours ?? addon.price ?? 0;
    setValue('price1Hour', p1);
    setValue('price2Hours', p2);
    setValue('price3Hours', p3);
    setValue('category', addon.category);
    setValue('isActive', addon.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setImageFiles([]);
  };

  const confirmDelete = (addon) => {
    setAddOnToDelete(addon);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (formData) => {
    if (!imageFiles || imageFiles.length === 0) {
      toast.error('Please upload at least 1 image for the special service.');
      return;
    }

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

    const retainedExisting = [];
    imageFiles.forEach((item) => {
      if (item.file instanceof File) {
        data.append('images', item.file);
      } else if (item.url) {
        retainedExisting.push({
          url: item.url,
          publicId: item.publicId,
          alt: item.alt,
        });
      }
    });

    data.append('existingImages', JSON.stringify(retainedExisting));

    if (editingAddOn) {
      updateMutation.mutate({ id: editingAddOn._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isFiltering = Boolean(debouncedSearch);

  const columns = useMemo(() => [
    {
      key: 'order',
      header: 'Order',
      width: 'w-[80px]',
      render: (row, rowIndex) => {
        const foundIndex = orderedItems.findIndex(i => {
          const rowId = String(row?._id || row?.id || '');
          const itemId = String(i?._id || i?.id || '');
          return rowId && itemId && rowId === itemId;
        });
        const actualIndex = foundIndex !== -1 ? foundIndex : (typeof rowIndex === 'number' && !isNaN(rowIndex) ? rowIndex : 0);
        return (
          <div className="flex items-center gap-1.5 text-slate-400">
            <div
              className={`p-1 -ml-1 rounded transition-colors ${
                isFiltering ? 'cursor-not-allowed opacity-30' : 'cursor-grab active:cursor-grabbing hover:bg-slate-100 hover:text-slate-700'
              }`}
              title={isFiltering ? 'Clear search to reorder' : 'Drag to reorder add-on'}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            {!isFiltering && (
              <div className="flex flex-col -my-1">
                <button
                  type="button"
                  disabled={actualIndex <= 0 || isReordering}
                  onClick={() => moveUp(actualIndex)}
                  className="p-0.5 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  title="Move Up"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={actualIndex >= orderedItems.length - 1 || isReordering}
                  onClick={() => moveDown(actualIndex)}
                  className="p-0.5 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  title="Move Down"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            )}
            <span className="w-4 text-center font-bold text-xs text-slate-500">
              {actualIndex + 1}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'image', 
      header: 'Image', 
      render: (row) => {
        const rowImages = Array.isArray(row.images) && row.images.length > 0 ? row.images : (row.image ? [row.image] : []);
        return (
          <div className="flex items-center gap-1">
            {rowImages.length > 0 ? (
              rowImages.map((img, i) => (
                <div key={i} className="h-10 w-10 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                  <img src={getImageUrl(img.url || img)} alt={row.name} onError={handleImageError} className="h-full w-full object-cover" />
                </div>
              ))
            ) : (
              <div className="h-10 w-10 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                <span className="text-[10px] text-slate-400">No Img</span>
              </div>
            )}
          </div>
        );
      }
    },
    { key: 'name', header: 'Add-on Name', sortable: true },
    {
      key: 'pricing',
      header: 'Prices (1H / 2H / 3H)',
      render: (row) => {
        const p1 = row.price1Hour ?? row.pricing?.oneHour ?? row.price ?? 0;
        const p2 = row.price2Hours ?? row.pricing?.twoHours ?? row.price ?? 0;
        const p3 = row.price3Hours ?? row.pricing?.threeHours ?? row.price ?? 0;
        return (
          <span className="text-xs font-semibold text-slate-700">
            ₹{p1} / ₹{p2} / ₹{p3}
          </span>
        );
      }
    },
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
            Add Special Service
          </Button>
        }
      />



      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
      />

      <div className="flex-1">
        <DataTable
          columns={columns}
          data={orderedItems}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          isRowDraggable={!isFiltering}
          onRowDragStart={handleDragStart}
          onRowDragOver={handleDragOver}
          onRowDragLeave={handleDragLeave}
          onRowDrop={handleDrop}
          onRowDragEnd={handleDragEnd}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          pagination={{
            currentPage: data?.pagination?.page || 1,
            totalPages: data?.pagination?.pages || 1
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: `No ${activeTab.toLowerCase()} found`,
            description: debouncedSearch ? 'Try adjusting your search query.' : `Get started by adding a new ${activeTab.toLowerCase()}.`,
            actionLabel: debouncedSearch ? null : `Add Special Service`,
            onAction: handleOpenAddModal
          }}
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAddOn ? `Edit Special Service` : `Add New Special Service`}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <MultiImageUploader 
              images={imageFiles} 
              onChange={setImageFiles} 
              maxImages={3}
              maxSizeMB={5}
              label="Images"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">1 Hour Price (₹)</label>
              <input
                type="number"
                min="0"
                {...register('price1Hour', { valueAsNumber: true })}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.price1Hour ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                placeholder="0"
              />
              {errors.price1Hour && <p className="mt-1 text-xs text-red-600">{errors.price1Hour.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">2 Hours Price (₹)</label>
              <input
                type="number"
                min="0"
                {...register('price2Hours', { valueAsNumber: true })}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.price2Hours ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                placeholder="0"
              />
              {errors.price2Hours && <p className="mt-1 text-xs text-red-600">{errors.price2Hours.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">3 Hours Price (₹)</label>
              <input
                type="number"
                min="0"
                {...register('price3Hours', { valueAsNumber: true })}
                className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.price3Hours ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
                placeholder="0"
              />
              {errors.price3Hours && <p className="mt-1 text-xs text-red-600">{errors.price3Hours.message}</p>}
            </div>
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
