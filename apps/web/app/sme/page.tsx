'use client';

import React, { useState } from 'react';
import { PageLayout } from '@/components/shared/PageLayout';
import { InvoiceForm } from '@/components/invoice/InvoiceForm';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { InvoiceCard } from '@/components/invoice/InvoiceCard';
import { TxHistory } from '@/components/shared/TxHistory';
import { useInvoices } from '@/hooks/useInvoices';
import { useWalletStore } from '@/store/wallet';
import { WalletConnect } from '@/components/shared/WalletConnect';
import { FileText, Coins, CheckSquare, Layers } from 'lucide-react';
import { Invoice } from '@/types';

export default function SMEDashboard() {
  const { address, connected, role } = useWalletStore();
  const { invoices, isLoading } = useInvoices({ issuer: address || undefined });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.status !== 'Repaid' ? inv.faceValue : 0n), 0n);
  const totalFunded = invoices.reduce((sum, inv) => sum + inv.fundedAmount, 0n);
  const totalRepaid = invoices.reduce((sum, inv) => sum + (inv.status === 'Repaid' ? inv.faceValue : 0n), 0n);

  const formatUSDC = (amount: bigint) => {
    return (Number(amount) / 10_000_000).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  if (!connected) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center text-center py-20 max-w-md mx-auto">
          <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-3xl mb-6">
            <Layers className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Connect Your Wallet</h1>
          <p className="text-slate-400 text-sm mb-8">
            Connect your Freighter wallet to access the SME Financing Dashboard, issue invoices, and manage financing.
          </p>
          <WalletConnect />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">SME Financing Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Issue unpaid trade invoices as tokenized Stellar assets and request immediate funding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2 text-blue-400">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-semibold">Outstanding Invoices</span>
            </div>
            <span className="text-2xl font-extrabold text-white">{formatUSDC(totalOutstanding)}</span>
            <span className="text-xs text-slate-500 block mt-1">{invoices.filter(i => i.status !== 'Repaid').length} total invoices</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2 text-indigo-400">
              <Coins className="w-5 h-5" />
              <span className="text-sm font-semibold">Total Funded Amount</span>
            </div>
            <span className="text-2xl font-extrabold text-white">{formatUSDC(totalFunded)}</span>
            <span className="text-xs text-slate-500 block mt-1">{invoices.filter(i => i.fundedAmount > 0n).length} funded invoices</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2 text-emerald-400">
              <CheckSquare className="w-5 h-5" />
              <span className="text-sm font-semibold">Repaid Invoices</span>
            </div>
            <span className="text-2xl font-extrabold text-white">{formatUSDC(totalRepaid)}</span>
            <span className="text-xs text-slate-500 block mt-1">{invoices.filter(i => i.status === 'Repaid').length} settled invoices</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <InvoiceForm onSuccess={() => setSelectedInvoice(null)} />
            
            {selectedInvoice ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Active Invoice Management</h3>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Clear Selection
                  </button>
                </div>
                <InvoiceCard invoice={selectedInvoice} role={role} />
              </div>
            ) : (
              <div className="bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs py-12">
                Select an invoice from the table to manage its financing lifecycle.
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Issued Invoices</h2>
              {isLoading && <span className="text-xs text-slate-500 animate-pulse">Refreshing...</span>}
            </div>
            
            <InvoiceTable 
              invoices={invoices} 
              onSelectInvoice={(invoice) => setSelectedInvoice(invoice)} 
            />

            <TxHistory history={[]} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
