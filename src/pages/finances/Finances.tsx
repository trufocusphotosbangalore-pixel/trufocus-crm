import { useState, useMemo } from 'react'
import {
  IndianRupee, Plus, RotateCcw, Search,
} from 'lucide-react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import {
  getWorkOrderFinanceGroups,
  getCompanyExpenses,
} from '@/services/financeStore'
import { WorkOrderFinanceCard } from '@/components/finances/WorkOrderFinanceCard'
import { AddExpenseModal } from '@/components/finances/AddExpenseModal'
import { FinancialReportsModal } from '@/components/finances/FinancialReportsModal'
import type { ReportType } from '@/services/financialReportsService'
import { formatDate } from '@/lib/utils'
import type { WorkOrderFinanceGroup, CompanyExpense } from '@/types/finances'

import { DocumentManagerWidget } from '@/components/documents/DocumentManagerWidget'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'

export default function Finances() {
  const { hasPermission } = useTeamPermissions()
  const [financeGroups, setFinanceGroups] = useState<WorkOrderFinanceGroup[]>(() => getWorkOrderFinanceGroups())
  const [companyExpenses, setCompanyExpenses] = useState<CompanyExpense[]>(() => getCompanyExpenses())
  const [activeTab, setActiveTab] = useState<'project' | 'company' | 'documents'>('project')

  const [search, setSearch] = useState('')
  const [isCompanyExpenseModalOpen, setIsCompanyExpenseModalOpen] = useState(false)
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('customer_receipts')

  // Real-time synchronization
  useRealtimeSync(() => {
    setFinanceGroups(getWorkOrderFinanceGroups())
    setCompanyExpenses(getCompanyExpenses())
  })

  const refreshData = () => {
    setFinanceGroups(getWorkOrderFinanceGroups())
    setCompanyExpenses(getCompanyExpenses())
  }

  const handleOpenReport = (type: ReportType) => {
    setSelectedReportType(type)
    setIsReportsModalOpen(true)
  }

  // 8 Dynamic KPI Summaries
  const totalReceived = useMemo(() => financeGroups.reduce((sum, g) => sum + g.amount_received, 0), [financeGroups])
  const totalBalanceDue = useMemo(() => financeGroups.reduce((sum, g) => sum + g.balance_amount, 0), [financeGroups])
  const totalTeamPayouts = useMemo(() => financeGroups.reduce((sum, g) => sum + g.total_payouts, 0), [financeGroups])
  const totalProjectExpenses = useMemo(() => financeGroups.reduce((sum, g) => sum + g.total_expenses, 0), [financeGroups])
  const totalCompanyExpenses = useMemo(() => companyExpenses.reduce((sum, e) => sum + e.amount, 0), [companyExpenses])

  const totalNetProfit = useMemo(() => {
    if (financeGroups.length === 0) return 0
    return financeGroups.reduce((sum, g) => sum + g.net_profit, 0) - totalCompanyExpenses
  }, [financeGroups, totalCompanyExpenses])

  const totalGstCollected = useMemo(() => financeGroups.reduce((sum, g) => sum + g.gst_amount, 0), [financeGroups])
  const totalPendingInvoices = useMemo(() => financeGroups.filter((g) => g.balance_amount > 0).length, [financeGroups])
  const totalPendingReceipts = useMemo(
    () => financeGroups.reduce((sum, g) => sum + g.payments.filter((p) => p.status === 'completed').length, 0),
    [financeGroups]
  )

  // Filtered Work Order Finance Groups
  const filteredGroups = useMemo(() => {
    return financeGroups.filter((g) => {
      const query = search.toLowerCase()
      return (
        !search ||
        g.work_order_number.toLowerCase().includes(query) ||
        g.customer_name.toLowerCase().includes(query) ||
        g.mobile.toLowerCase().includes(query) ||
        g.event_type.toLowerCase().includes(query) ||
        g.payments.some((p) => p.receipt_number.toLowerCase().includes(query))
      )
    })
  }, [financeGroups, search])

  // Filtered Company Expenses
  const filteredCompanyExpenses = useMemo(() => {
    return companyExpenses.filter((e) => {
      const query = search.toLowerCase()
      return (
        !search ||
        e.category.toLowerCase().includes(query) ||
        e.vendor.toLowerCase().includes(query)
      )
    })
  }, [companyExpenses, search])

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <IndianRupee size={20} />
            </span>
            <h1 className="text-xl font-extrabold text-[#111827]">Finance Management</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Central single source of truth for Customer Receipts (Money IN), Project Payments (Money OUT), and Studio Profitability
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Report Exporter Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleOpenReport(e.target.value as ReportType)
                e.target.value = ''
              }
            }}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="">📊 Generate Financial Reports & Statements...</option>
            <option value="customer_receipts">🟢 Customer Receipt Report</option>
            <option value="project_expenses">🔴 Project Expense Report</option>
            <option value="freelancer_payments">👤 Freelancer & Crew Payout Report</option>
            <option value="travel_expenses">🚗 Travel & Logistics Expense Report</option>
            <option value="profit_and_loss">📈 Profit & Loss (P&L) Statement</option>
            <option value="outstanding_receipts">⚠️ Outstanding Receipts Report</option>
            <option value="customer_statement">📋 Customer Financial Statement</option>
          </select>

          <button
            onClick={refreshData}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* 8 Dynamic Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-sans">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Received</span>
          <span className="text-base font-extrabold text-emerald-600 font-mono mt-1 block">
            ₹{totalReceived.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Balance Due</span>
          <span className="text-base font-extrabold text-amber-600 font-mono mt-1 block">
            ₹{totalBalanceDue.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Team Payouts</span>
          <span className="text-base font-extrabold text-blue-600 font-mono mt-1 block">
            ₹{totalTeamPayouts.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project Expenses</span>
          <span className="text-base font-extrabold text-red-600 font-mono mt-1 block">
            ₹{totalProjectExpenses.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 bg-purple-50/30 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Net Studio Profit</span>
          <span className="text-base font-extrabold text-[#5B3FD9] font-mono mt-1 block">
            ₹{totalNetProfit.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">GST Collected</span>
          <span className="text-base font-extrabold text-gray-900 font-mono mt-1 block">
            ₹{totalGstCollected.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending Balances</span>
          <span className="text-base font-extrabold text-amber-600 font-mono mt-1 block">
            {totalPendingInvoices} Projects
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Receipts Issued</span>
          <span className="text-base font-extrabold text-emerald-600 font-mono mt-1 block">
            {totalPendingReceipts} Receipts
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#E5E7EB] shadow-xs w-fit">
        <button
          onClick={() => setActiveTab('project')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'project'
              ? 'bg-[#5B3FD9] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Project Finance
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'company'
              ? 'bg-[#5B3FD9] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Company Expenses
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'documents'
              ? 'bg-[#5B3FD9] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Receipts & Financial Documents
        </button>
      </div>

      {activeTab === 'documents' ? (
        <DocumentManagerWidget
          module="finances"
          title="Financial Receipts & Document Attachments"
          subtitle="Manage uploaded vendor invoices, payment receipts, GST challans, and expense vouchers across all projects."
        />
      ) : (
        <>

      {/* Sticky Search & Action Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Work Order, customer, receipt RCT-2026-XXXX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>

        {activeTab === 'company' && hasPermission('finances', 'create') && (
          <button
            onClick={() => setIsCompanyExpenseModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-colors cursor-pointer"
          >
            <Plus size={15} /> Add Studio Company Expense
          </button>
        )}
      </div>

      {/* TAB 1: Project Finance */}
      {activeTab === 'project' && (
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-xs text-gray-500 font-sans">
              No Work Orders found matching your search.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <WorkOrderFinanceCard key={group.work_order_id} group={group} onSaved={refreshData} />
            ))
          )}
        </div>
      )}

      {/* TAB 2: Company Expenses */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#111827]">Studio Company Standing Expenses</h3>
            <span className="font-mono font-extrabold text-red-600 text-sm">
              Total Expenses: ₹{totalCompanyExpenses.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAFC] border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="px-3.5 py-3">Expense Category</th>
                  <th className="px-3.5 py-3">Vendor / Payee</th>
                  <th className="px-3.5 py-3">Amount</th>
                  <th className="px-3.5 py-3">Expense Date</th>
                  <th className="px-3.5 py-3">GST Amount</th>
                  <th className="px-3.5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredCompanyExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3.5 py-6 text-center text-gray-400 italic">
                      No company expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredCompanyExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-3.5 py-3 font-bold text-gray-900">{exp.category}</td>
                      <td className="px-3.5 py-3 font-semibold text-gray-700">{exp.vendor}</td>
                      <td className="px-3.5 py-3 font-mono font-extrabold text-red-600">₹{exp.amount.toLocaleString()}</td>
                      <td className="px-3.5 py-3 text-gray-600">{formatDate(exp.expense_date)}</td>
                      <td className="px-3.5 py-3 font-mono text-gray-500">{exp.gst_amount ? `₹${exp.gst_amount.toLocaleString()}` : '—'}</td>
                      <td className="px-3.5 py-3 text-gray-500 italic">{exp.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>)}

      {/* Add Company Expense Popup */}
      {isCompanyExpenseModalOpen && (
        <AddExpenseModal
          isOpen={isCompanyExpenseModalOpen}
          onClose={() => setIsCompanyExpenseModalOpen(false)}
          type="company"
          onSaved={refreshData}
        />
      )}

      {/* Financial Reports Modal */}
      {isReportsModalOpen && (
        <FinancialReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
          initialReportType={selectedReportType}
        />
      )}
    </div>
  )
}
