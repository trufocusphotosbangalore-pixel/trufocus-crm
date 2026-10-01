import { useRef } from 'react'
import {
  X, Printer, Download, Mail, MessageSquare,
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import { formatDate } from '@/lib/utils'
import type { DirectSalesInvoice } from '@/types/directSales'
import { toast } from 'react-hot-toast'

interface DirectSalesInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: DirectSalesInvoice | null
}

export function DirectSalesInvoiceModal({
  isOpen,
  onClose,
  invoice,
}: DirectSalesInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !invoice) return null

  const profile = loadBusinessProfile()
  const brandName = profile.brand_name || profile.business_name || 'Trufocus Photos'
  const parentLine = profile.parent_company_line || 'A Brand of Chaaya AI Technologies Private Limited'
  const legalName = profile.legal_company_name || 'Chaaya AI Technologies Private Limited'

  const handlePrint = () => {
    const printWin = window.open('', '_blank')
    if (!printWin) return

    const content = printRef.current?.innerHTML || ''
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #111827; }
            .header { border-bottom: 2px solid #5B3FD9; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #5B3FD9; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #5B3FD9; color: white; }
            .text-right { text-align: right; }
            .totals { font-weight: bold; font-size: 13px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    const toastId = toast.loading('Generating PDF Invoice...')

    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`GST_Invoice_${invoice.invoice_number}.pdf`)
      toast.dismiss(toastId)
      toast.success(`Downloaded ${invoice.invoice_number}.pdf!`)
    } catch (e) {
      console.error(e)
      toast.dismiss(toastId)
      toast.error('Failed to generate PDF invoice.')
    }
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${invoice.customer_name},\n\nThank you for choosing ${brandName}!\nHere is your GST Invoice details:\nInvoice #: ${invoice.invoice_number}\nOrder Type: ${invoice.order_type === 'podcast' ? 'Podcast Studio' : 'Studio Expose'}\nTotal Amount: ₹${invoice.total_amount.toLocaleString()}\nAmount Paid: ₹${invoice.amount_paid.toLocaleString()}\nBalance Due: ₹${invoice.balance_due.toLocaleString()}\n\nOfficial Invoice by ${legalName}\nHave a great day!`
    )
    const phone = (invoice.mobile || '').replace(/\D/g, '')
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`GST Invoice ${invoice.invoice_number} from ${brandName}`)
    const body = encodeURIComponent(
      `Dear ${invoice.customer_name},\n\nPlease find your GST invoice details below:\n\nInvoice #: ${invoice.invoice_number}\nBrand: ${brandName}\nLegal Company: ${legalName}\nGSTIN: ${profile.gst_number || 'N/A'}\nTotal Amount: ₹${invoice.total_amount.toLocaleString()}\nAmount Paid: ₹${invoice.amount_paid.toLocaleString()}\nBalance Due: ₹${invoice.balance_due.toLocaleString()}\n\nThank you!\n${brandName} Team`
    )
    window.open(`mailto:${invoice.email || ''}?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Actions */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-[#111827]">Direct Sales Tax Invoice</h2>
            <p className="text-xs text-gray-500">Official GST Invoice for {invoice.customer_name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <MessageSquare size={14} /> WhatsApp
            </button>
            <button
              onClick={handleShareEmail}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Mail size={14} /> Email
            </button>
            <button
              onClick={onClose}
              className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Invoice Printable View */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-gray-900" ref={printRef}>
          {/* Studio & Invoice Header */}
          <div className="flex flex-wrap justify-between items-start border-b-2 border-[#5B3FD9] pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black text-[#5B3FD9] tracking-tight">{brandName}</h1>
              <p className="text-xs font-bold text-purple-900 mt-0.5">{parentLine}</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                <strong>{legalName}</strong> • {profile.address_line_1 || 'Studio Premises'}, {profile.city || 'Bangalore'}
                {profile.primary_mobile ? ` • Phone: ${profile.primary_mobile}` : ''}
              </p>
              {profile.gst_number && (
                <p className="text-xs font-mono font-bold text-gray-700 mt-0.5">
                  GSTIN: {profile.gst_number} {profile.pan_number ? `• PAN: ${profile.pan_number}` : ''}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#5B3FD9] bg-[#5B3FD9]/10 px-3 py-1 rounded-full">
                TAX INVOICE
              </span>
              <h2 className="text-lg font-mono font-extrabold text-[#111827] mt-2">{invoice.invoice_number}</h2>
              <p className="text-xs text-gray-500">Date: <strong>{formatDate(invoice.created_at)}</strong></p>
              <p className="text-xs text-gray-500">Order Type: <strong className="capitalize">{invoice.order_type.replace('_', ' ')}</strong></p>
            </div>
          </div>

          {/* Billed To Customer */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200 flex flex-wrap justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider mb-1">BILLED TO</span>
              <p className="text-sm font-bold text-[#111827]">{invoice.customer_name}</p>
              {invoice.mobile && <p className="text-gray-600 mt-0.5">Mobile: {invoice.mobile}</p>}
              {invoice.email && <p className="text-gray-600">Email: {invoice.email}</p>}
              {invoice.address && <p className="text-gray-600 mt-0.5">{invoice.address}</p>}
            </div>

            <div className="text-right">
              {invoice.gst_number && (
                <p className="font-mono font-bold text-gray-800">Customer GSTIN: {invoice.gst_number}</p>
              )}
              <p className="text-gray-600 mt-1">Payment Mode: <strong className="uppercase">{invoice.payment_mode}</strong></p>
              <p className="text-gray-600">Billed By: {invoice.created_by}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse text-xs mb-6">
            <thead>
              <tr className="bg-[#5B3FD9] text-white font-bold uppercase text-[10px]">
                <th className="p-3 rounded-l-xl">#</th>
                <th className="p-3">Item / Service Description</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3 text-center">GST %</th>
                <th className="p-3 text-right rounded-r-xl">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="p-3 font-mono text-gray-400">{idx + 1}</td>
                  <td className="p-3">
                    <p className="font-bold text-[#111827]">{item.item_name}</p>
                    <p className="text-[11px] text-gray-400">{item.category_name}</p>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                  <td className="p-3 text-right font-mono">₹{item.unit_price.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-red-600">
                    {item.discount_amount > 0 ? `-₹${item.discount_amount.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3 text-center font-mono">{item.gst_percent}%</td>
                  <td className="p-3 text-right font-mono font-bold text-[#111827]">
                    ₹{item.total_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Invoice Summary Calculation Box */}
          <div className="flex justify-end mb-6">
            <div className="w-full sm:w-80 bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2 text-xs font-sans">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Net):</span>
                <span className="font-mono font-bold">₹{invoice.subtotal_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Item Discounts:</span>
                <span className="font-mono font-bold text-red-600">-₹{invoice.discount_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST Tax ({invoice.is_gst_included ? 'Inclusive' : 'Exclusive'}):</span>
                <span className="font-mono font-bold text-purple-700">₹{invoice.gst_amount.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between text-base font-extrabold text-[#111827]">
                <span>Grand Total:</span>
                <span className="font-mono text-[#5B3FD9]">₹{invoice.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-700 border-t border-gray-200 pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">₹{invoice.amount_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-red-600">
                <span>Balance Due:</span>
                <span className="font-mono">₹{invoice.balance_due.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500 space-y-1">
            <p className="font-bold text-[#5B3FD9]">Thank you for your business!</p>
            <p>This is a computer-generated GST tax invoice. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
