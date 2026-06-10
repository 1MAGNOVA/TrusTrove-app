'use client';

import React, { useState } from 'react';
import { PageLayout } from '@/components/shared/PageLayout';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { InvoiceCard } from '@/components/invoice/InvoiceCard';
import { useInvoices } from '@/hooks/useInvoices';
import { useWalletStore } from '@/store/wallet';
import { WalletConnect } from '@/components/shared/WalletConnect';
import { ShoppingBag, Filter } from 'lucide-react';
import { Invoice } from '@/types';

export default function Marketplace() {
  const { address, connected, role } = useWalletStore();
  const [statusFilter, setStatusFilter] = useState<string>('Listed');
  const { invoices, isLoading } = useInvoices({ 
    status: statusFilter === 'ALL' ? undefined : statusFilter 
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  if (!connected) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center text-center py-20 max-w-md mx-auto">
          <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-3xl mb-6">
            <ShoppingBag className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Connect Your Wallet</h1>
          <p className="text-slate-400 text-sm mb-8">
            Connect your Freighter wallet to browse, purchase, and manage trade invoices in the Marketplace.
          </p>
          <WalletConnect />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Invoice Marketplace</h1>
            <p className="text-slate-400 text-sm mt-1">
              Purchase listed invoices at a discount or manage invoice repayment and fulfillment lifecycles.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold mr-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedInvoice(null);
              }}
              className="bg-transparent text-xs text-white border-none focus:ring-0 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL" className="bg-slate-950 text-white">All Invoices</option>
              <option value="Created" className="bg-slate-950 text-white">Created</option>
              <option value="Listed" className="bg-slate-950 text-white">Listed (For Financing)</option>
              <option value="Funded" className="bg-slate-950 text-white">Funded</option>
              <option value="Active" className="bg-slate-950 text-white">Active (Shipped)</option>
              <option value="Confirmed" className="bg-slate-950 text-white">Confirmed (Delivered)</option>
              <option value="Repaid" className="bg-slate-950 text-white">Repaid (Settled)</option>
              <option value="Defaulted" className="bg-slate-950 text-white">Defaulted</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Available Invoices ({invoices.length})</h2>
              {isLoading && <span className="text-xs text-slate-500 animate-pulse">Refreshing...</span>}
            </div>

            <InvoiceTable 
              invoices={invoices} 
              onSelectInvoice={(invoice) => setSelectedInvoice(invoice)} 
            />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-white">Management Center</h2>
            {selectedInvoice ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Acting Role: <strong className="text-blue-400 capitalize">{role}</strong></span>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-blue-400 hover:underline"
                  >
                    Clear Selection
                  </button>
                </div>
                <InvoiceCard invoice={selectedInvoice} role={role} />
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs py-16">
                <p className="mb-2 font-semibold text-slate-400">No Invoice Selected</p>
                <p>Select any invoice from the marketplace to view details and execute smart contract actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
