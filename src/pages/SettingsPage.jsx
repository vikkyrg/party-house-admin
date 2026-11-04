import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CreditCard, Save, RotateCcw, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { settingService } from '../services/settingService';
import { queryKeys } from '../lib/queryKeys';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');
  const [inputError, setInputError] = useState('');

  const {
    data: settingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: settingService.getSettings,
  });

  const configuredAmount = settingsData?.data?.advancePaymentAmount ?? 750;

  useEffect(() => {
    if (settingsData?.data?.advancePaymentAmount !== undefined) {
      setAdvanceAmountInput(String(settingsData.data.advancePaymentAmount));
    } else {
      setAdvanceAmountInput('750');
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: (amount) => settingService.updateAdvancePayment(amount),
    onSuccess: (res) => {
      toast.success(res?.message || 'Advance payment amount updated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update advance payment amount');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    const val = Number(advanceAmountInput);
    if (isNaN(val) || val < 0) {
      setInputError('Please enter a valid non-negative number for the advance amount.');
      return;
    }
    setInputError('');
    updateMutation.mutate(val);
  };

  const handleResetToDefault = () => {
    setAdvanceAmountInput('750');
    setInputError('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage platform configurations and payment parameters." />
        <LoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage platform configurations and payment parameters." />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const isDirty = String(configuredAmount) !== String(advanceAmountInput).trim();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage platform configurations, advance booking amounts, and payment parameters."
      />

      {/* Advance Payment Configuration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">Advance Payment Settings</h2>
            <p className="text-xs text-slate-500">
              Configure the mandatory advance token amount customers pay at checkout to confirm reservations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="advanceAmount" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Booking Advance Amount (₹) *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-slate-500 font-bold text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="advanceAmount"
                  min="0"
                  step="1"
                  value={advanceAmountInput}
                  onChange={(e) => {
                    setAdvanceAmountInput(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  className={`block w-full rounded-xl border pl-8 pr-4 py-2.5 text-sm font-semibold transition outline-none ${
                    inputError
                      ? 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600'
                  }`}
                  placeholder="e.g. 750"
                  required
                />
              </div>
              {inputError && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {inputError}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Default value is <strong>₹750</strong>. This amount is requested at checkout via UPI QR code.
              </p>
            </div>

            {/* Current Active Setting Preview Box */}
            <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-orange-50/40 p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Current Live Advance
                </span>
                <p className="mt-2 text-3xl font-black text-amber-950">₹{configuredAmount}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Every booking checkout displays & charges this amount dynamically.
                </p>
              </div>
              {settingsData?.data?.updatedAt && (
                <div className="pt-3 border-t border-amber-200/60 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Last updated:</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(settingsData.data.updatedAt).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rule note */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Dynamic Checkout Guarantee
            </p>
            <p>
              • If the booking subtotal is less than the configured advance, the system automatically caps the advance to the subtotal.
            </p>
            <p>
              • The remaining balance is automatically calculated as <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">Subtotal - Advance Payment</code> and presented at checkout and on invoices.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              leftIcon={RotateCcw}
              onClick={handleResetToDefault}
              disabled={updateMutation.isPending}
            >
              Reset to ₹750
            </Button>

            <Button
              type="submit"
              leftIcon={Save}
              isLoading={updateMutation.isPending}
              disabled={!isDirty || updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
