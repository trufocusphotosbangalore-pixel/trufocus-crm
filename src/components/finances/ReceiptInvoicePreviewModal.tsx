import {
  X, Printer, Download, MessageSquare, Camera,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { PaymentRecord, InvoiceRecord } from '@/types/finances'
import { PAYMENT_MODE_LABELS } from '@/types/finances'
import { downloadDocumentPDF } from '@/services/pdfGeneratorService'

import { loadBusinessProfile } from '@/services/businessProfileStore'

interface ReceiptInvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'receipt' | 'invoice'
  receipt?: PaymentRecord | null
  invoice?: InvoiceRecord | null
  customerMobile?: string
}

export function ReceiptInvoicePreviewModal({
  isOpen,
  onClose,
  type,
  receipt,
  invoice,
  customerMobile = '+91 98765 12345',
}: ReceiptInvoicePreviewModalProps) {
  const profile = loadBusinessProfile()
  const brandName = profile.brand_name || profile.business_name || 'Trufocus Photos'
  const parentLine = profile.parent_company_line || 'A Brand of Chaaya AI Technologies Private Limited'
  const legalName = profile.legal_company_name || 'Chaaya AI Technologies Private Limited'

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const mockWO: any = {
      id: invoice?.work_order_id || receipt?.id || 'wo_001',
      work_order_number: invoice?.work_order_number || 'WO-2025-614',
      project_name: 'Photography Shoot',
      customer_name: invoice?.customer_name || 'Client',
      mobile: customerMobile,
      event_type: 'Wedding Shoot',
      payment: {
        package_amount: invoice?.subtotal_amount || receipt?.amount || 150000,
        discount_amount: invoice?.discount_amount || 0,
        ledger: [],
      },
    }

    downloadDocumentPDF(type, mockWO, {
      receiptNumber: receipt?.receipt_number,
      receiptAmount: receipt?.amount,
      paymentMode: receipt?.payment_mode,
      transactionId: receipt?.transaction_ref,
    })
  }

  const handleWhatsApp = () => {
    const cleanNum = customerMobile.replace(/[^\d]/g, '')
    const docNo = type === 'receipt' ? receipt?.receipt_number : invoice?.invoice_number
    const amt = type === 'receipt' ? receipt?.amount : invoice?.total_amount
    const msg = `Hello! Please find your official ${brandName} ${type.toUpperCase()} (${docNo}) for amount ₹${amt?.toLocaleString()}. Issued by ${legalName}. Thank you!`
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Header Actions (hidden on print) */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/60 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Camera size={18} />
            </span>
            <h2 className="text-base font-extrabold text-[#111827]">
              {type === 'receipt' ? `Payment Receipt (${receipt?.receipt_number})` : `Tax Invoice (${invoice?.invoice_number})`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare size={13} /> WhatsApp
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} /> PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 transition-colors"
            >
              <Printer size={13} /> Print
            </button>
            <button
              onClick={onClose}
              className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 text-xs text-gray-800 font-sans print:p-6">
          {/* Studio Branding */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={brandName}
                  className="size-12 rounded-xl object-cover border border-gray-200 shadow-2xs"
                />
              ) : (
                <div className="size-12 rounded-xl bg-[#5B3FD9] text-white flex items-center justify-center font-black text-lg">
                  {brandName[0] || 'T'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-[#5B3FD9] tracking-tight">{brandName}</h1>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{parentLine}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  <strong>{legalName}</strong> • GSTIN: {profile.gst_number || '29AAAAA0000A1Z5'}
                  {profile.pan_number ? ` • PAN: ${profile.pan_number}` : ''}
                </p>
                <p className="text-[11px] text-gray-400">
                  Address: {profile.address_line_1 || 'Studio Premises'}, {profile.city || 'Bangalore'} • Phone: {profile.primary_mobile || '+91 98765 43210'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono font-extrabold text-[#5B3FD9] bg-[#5B3FD9]/10 px-3 py-1 rounded-lg text-sm block">
                {type === 'receipt' ? receipt?.receipt_number : invoice?.invoice_number}
              </span>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Date: <strong>{formatDate(type === 'receipt' ? receipt?.payment_date || '' : invoice?.invoice_date || '')}</strong>
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block">Billed To / Customer</span>
              <h3 className="text-sm font-extrabold text-[#111827] mt-0.5">
                {type === 'receipt' ? receipt?.customer_name : invoice?.customer_name}
              </h3>
              <p className="text-xs text-gray-600 font-medium">{customerMobile}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block">Work Order Reference</span>
              <h3 className="text-sm font-mono font-bold text-[#5B3FD9] mt-0.5">
                {type === 'receipt' ? receipt?.work_order_number : invoice?.work_order_number}
              </h3>
              <p className="text-xs text-gray-600 font-medium">Status: <span className="font-bold text-emerald-700">COMPLETED & VERIFIED</span></p>
            </div>
          </div>

          {/* Table Details */}
          {type === 'receipt' ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="p-3">Payment Particulars</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Transaction Reference</th>
                    <th className="p-3 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3 font-bold text-gray-900">
                      {receipt?.remarks || 'Customer Payment Receipt'}
                    </td>
                    <td className="p-3 font-semibold uppercase">{PAYMENT_MODE_LABELS[receipt?.payment_mode || 'upi']}</td>
                    <td className="p-3 font-mono">{receipt?.transaction_ref || 'N/A'}</td>
                    <td className="p-3 font-mono font-extrabold text-base text-right text-emerald-600">
                      ₹{(receipt?.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="p-3">Particulars / Service Description</th>
                    <th className="p-3 text-right">Subtotal</th>
                    {(invoice?.gst_amount || 0) > 0 && <th className="p-3 text-right">GST</th>}
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  <tr>
                    <td className="p-3 font-bold text-gray-900 font-sans">
                      Complete Photography & Videography Coverage ({invoice?.work_order_number})
                    </td>
                    <td className="p-3 text-right">₹{(invoice?.subtotal_amount || 0).toLocaleString()}</td>
                    {(invoice?.gst_amount || 0) > 0 && (
                      <td className="p-3 text-right">₹{(invoice?.gst_amount || 0).toLocaleString()}</td>
                    )}
                    <td className="p-3 text-right font-extrabold text-base text-[#5B3FD9]">
                      ₹{(invoice?.total_amount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Authorization Footer */}
          <div className="pt-8 border-t border-gray-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-600">Terms & Conditions:</p>
              <p className="text-[10px] text-gray-400">
                1. Computer generated document issued by <strong>{legalName}</strong>.<br />
                2. Payments once received are non-refundable as per studio agreement terms.
              </p>
            </div>

            <div className="text-right">
              {profile.digital_signature_url ? (
                <img src={profile.digital_signature_url} alt="Signature" className="h-10 object-contain ml-auto mb-1" />
              ) : (
                <div className="size-14 rounded-xl border border-dashed border-[#5B3FD9]/40 bg-[#5B3FD9]/5 flex items-center justify-center font-bold text-[9px] text-[#5B3FD9] ml-auto mb-1 text-center leading-tight p-1">
                  AUTHORIZED STAMP
                </div>
              )}
              <p className="text-xs font-extrabold text-[#111827]">{brandName}</p>
              <p className="text-[10px] text-gray-500">{legalName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
