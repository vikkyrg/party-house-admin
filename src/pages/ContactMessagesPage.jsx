import { useState, useMemo, useEffect, useRef } from 'react';
import { Mail, Eye, Trash2, CheckCircle2, Clock, Search, RefreshCw, Calendar, Phone, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/common/DataTable';
import DataTableToolbar from '../components/common/DataTableToolbar';
import Button from '../components/common/Button';
import Drawer from '../components/common/Drawer';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { contactMessageService } from '../services/contactMessageService';
import { useDebounce } from '../hooks/useDebounce';
import { queryKeys } from '../lib/queryKeys';

export default function ContactMessagesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Detail Drawer state
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const hasMarkedAllReadOnMount = useRef(false);

  // Fetch messages
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.contactMessages.all({ page, limit: 10, search: debouncedSearch, status: statusFilter }),
    queryFn: () =>
      contactMessageService.getAll({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    keepPreviousData: true,
  });

  // Automatically mark all unread as read when admin opens the Contact Messages page
  useEffect(() => {
    if (!isLoading && data?.success && (data?.unreadCount > 0) && !hasMarkedAllReadOnMount.current) {
      hasMarkedAllReadOnMount.current = true;
      contactMessageService.markAllAsRead().then(() => {
        queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.contactMessages.unreadCount });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      }).catch(() => {
        // Silently handle if mark all as read fails
      });
    }
  }, [isLoading, data, queryClient]);

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => contactMessageService.updateStatus(id, status),
    onSuccess: (res, variables) => {
      toast.success(variables.status === 'read' ? 'Marked as read' : 'Marked as new');
      queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.contactMessages.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });

      // Update current drawer item if open
      if (selectedMessage && selectedMessage._id === variables.id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: variables.status } : null));
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => contactMessageService.delete(id),
    onSuccess: () => {
      toast.success('Contact message deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.contactMessages.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      setDeleteConfirmOpen(false);
      if (selectedMessage && selectedMessage._id === messageToDelete?._id) {
        setIsDrawerOpen(false);
        setSelectedMessage(null);
      }
      setMessageToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete message');
    },
  });


  const handleOpenDetail = (message) => {
    setSelectedMessage(message);
    setIsDrawerOpen(true);
    // If it's new, automatically mark as read for convenience
    if (message.status === 'new') {
      statusMutation.mutate({ id: message._id, status: 'read' });
    }
  };

  const handleToggleStatus = (message, e) => {
    e?.stopPropagation();
    const nextStatus = message.status === 'read' ? 'new' : 'read';
    statusMutation.mutate({ id: message._id, status: nextStatus });
  };

  const confirmDelete = (message, e) => {
    e?.stopPropagation();
    setMessageToDelete(message);
    setDeleteConfirmOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        key: 'status',
        header: 'Status',
        render: (row) => {
          const isNew = row.status === 'new';
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                isNew
                  ? 'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/80'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isNew ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]' : 'bg-slate-400'
                }`}
              />
              {isNew ? 'New' : 'Read'}
            </span>
          );
        },
      },

      {
        key: 'name',
        header: 'Name',
        render: (row) => (
          <div className="font-semibold text-slate-900 flex flex-col">
            <span>{row.name}</span>
            <a
              href={`mailto:${row.email}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-normal text-primary-600 hover:text-primary-800 hover:underline transition-colors inline-block w-fit"
              title={`Send email to ${row.email}`}
            >
              {row.email}
            </a>
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (row) => (
          <a
            href={`tel:${row.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-slate-600 hover:text-primary-600 hover:underline font-mono transition-colors"
            title={`Call ${row.phone}`}
          >
            {row.phone}
          </a>
        ),
      },

      {
        key: 'subject',
        header: 'Subject',
        render: (row) => (
          <div className="max-w-[200px] truncate font-medium text-slate-800" title={row.subject}>
            {row.subject}
          </div>
        ),
      },
      {
        key: 'message',
        header: 'Message Preview',
        render: (row) => (
          <div className="max-w-[260px] truncate text-sm text-slate-500" title={row.message}>
            {row.message}
          </div>
        ),
      },
      {
        key: 'createdAt',
        header: 'Received Date',
        render: (row) => {
          const date = new Date(row.createdAt);
          return (
            <div className="text-xs text-slate-600 flex flex-col">
              <span className="font-medium">{date.toLocaleDateString()}</span>
              <span className="text-slate-400">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        cellClassName: 'text-right',
        render: (row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDetail(row)}
              title="View Complete Message"
            >
              <Eye className="h-4 w-4 text-slate-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleToggleStatus(row, e)}
              title={row.status === 'read' ? 'Mark as New' : 'Mark as Read'}
              className="hover:text-primary-600"
            >
              {row.status === 'read' ? (
                <Clock className="h-4 w-4 text-slate-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => confirmDelete(row, e)}
              title="Delete Message"
              className="hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const messagesList = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="flex flex-col h-full space-y-6">
      <PageHeader
        title="Contact Messages"
        description="View and manage customer inquiries submitted via the website contact form."
        actions={
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                {unreadCount} Unread {unreadCount === 1 ? 'Message' : 'Messages'}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={RefreshCw}
              className={isFetching ? 'animate-spin' : ''}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or subject..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status:</span>
          <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200">
            {['all', 'new', 'read'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={messagesList}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
          }}
          onPageChange={setPage}
          emptyStateProps={{
            title: 'No contact messages found',
            description: debouncedSearch
              ? `No messages matched "${debouncedSearch}". Try another search term.`
              : statusFilter !== 'all'
              ? `No messages with status "${statusFilter}".`
              : 'When visitors submit the Contact Us form on your website, their messages will appear here.',
          }}
        />
      </div>

      {/* Message Details Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Message Details"
        description={selectedMessage ? `Received on ${new Date(selectedMessage.createdAt).toLocaleString()}` : ''}
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Status & Quick Action Header */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedMessage.status === 'new'
                      ? 'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selectedMessage.status === 'new' ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]' : 'bg-emerald-500'
                    }`}
                  />
                  {selectedMessage.status === 'new' ? 'New Message' : 'Read'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    statusMutation.mutate({
                      id: selectedMessage._id,
                      status: selectedMessage.status === 'read' ? 'new' : 'read',
                    })
                  }
                  isLoading={statusMutation.isPending}
                >
                  {selectedMessage.status === 'read' ? 'Mark as New' : 'Mark as Read'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => confirmDelete(selectedMessage)}
                  className="text-red-600 hover:bg-red-50"
                  leftIcon={Trash2}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Sender Information Card */}
            <div className="rounded-xl border border-slate-200 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sender Details</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 text-primary-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Full Name</span>
                    <p className="text-sm font-semibold text-slate-900">{selectedMessage.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 text-primary-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Email Address</span>
                    <p className="text-sm font-semibold text-slate-900">
                      <a href={`mailto:${selectedMessage.email}`} className="text-primary-600 hover:underline">
                        {selectedMessage.email}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 text-primary-700">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Phone Number</span>
                    <p className="text-sm font-semibold text-slate-900">
                      <a href={`tel:${selectedMessage.phone}`} className="hover:underline">
                        {selectedMessage.phone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 text-primary-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Submitted At</span>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject and Full Message */}
            <div className="rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Subject</span>
                <p className="text-base font-bold text-slate-900">{selectedMessage.subject}</p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Message</span>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Mail className="h-4 w-4" /> Reply via Email
              </a>
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={() => deleteMutation.mutate(messageToDelete?._id)}
        title="Delete Contact Message"
        description={`Are you sure you want to delete the message from "${messageToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
