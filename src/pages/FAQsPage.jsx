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

import { useFAQs } from '../hooks/useFAQs';
import { faqSchema } from '../validations/faqSchema';
import { useDebounce } from '../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export default function FAQsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: { isActive: true, category: 'General', sortOrder: 0 },
  });

  // Data fetching
  const { data, isLoading, error, refetch } = useFAQs({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/faqs', data),
    onSuccess: () => {
      toast.success('FAQ created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to create FAQ'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/faqs/${id}`, data),
    onSuccess: () => {
      toast.success('FAQ updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.all() });
      handleCloseModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update FAQ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/faqs/${id}`),
    onSuccess: () => {
      toast.success('FAQ deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.all() });
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to delete FAQ'),
  });

  // Handlers
  const handleOpenAddModal = () => {
    setEditingFAQ(null);
    reset({ question: '', answer: '', category: 'General', isActive: true, sortOrder: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq) => {
    setEditingFAQ(faq);
    setValue('question', faq.question);
    setValue('answer', faq.answer);
    setValue('category', faq.category);
    setValue('isActive', faq.isActive);
    setValue('sortOrder', faq.sortOrder);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const confirmDelete = (faq) => {
    setFaqToDelete(faq);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (formData) => {
    if (editingFAQ) {
      updateMutation.mutate({ id: editingFAQ._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = useMemo(() => [
    { key: 'question', header: 'Question', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'sortOrder', header: 'Order' },
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
        title="FAQs" 
        description="Manage the Frequently Asked Questions displayed on the website." 
        actions={
          <Button leftIcon={Plus} onClick={handleOpenAddModal}>
            Add FAQ
          </Button>
        }
      />

      <DataTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search questions..."
      />

      <div className="flex-1">
        <DataTable
          columns={columns}
          data={data?.data?.faqs || data?.data || []}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          pagination={{
            currentPage: data?.pagination?.page || 1,
            totalPages: data?.pagination?.pages || 1
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'No FAQs found',
            description: debouncedSearch ? 'Try adjusting your search query.' : 'Get started by adding a new FAQ.',
            actionLabel: debouncedSearch ? null : 'Add FAQ',
            onAction: handleOpenAddModal
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
            <input
              type="text"
              {...register('question')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.question ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
              placeholder="e.g. What is the cancellation policy?"
            />
            {errors.question && <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              {...register('category')}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.category ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            >
              <option value="General">General</option>
              <option value="Booking">Booking</option>
              <option value="Payment">Payment</option>
              <option value="Cancellation">Cancellation</option>
              <option value="Services">Services</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
            <textarea
              {...register('answer')}
              rows={5}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.answer ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            />
            {errors.answer && <p className="mt-1 text-sm text-red-600">{errors.answer.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order (Lower appears first)</label>
            <input
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              className={`block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.sortOrder ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-primary-600'} sm:text-sm sm:leading-6 px-3`}
            />
            {errors.sortOrder && <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>}
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
        onConfirm={() => deleteMutation.mutate(faqToDelete?._id)}
        title="Delete FAQ"
        description={`Are you sure you want to delete this question? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
