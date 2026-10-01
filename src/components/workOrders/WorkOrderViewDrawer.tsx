import { useState } from 'react'
import { X, Calendar, Package, CreditCard, FileText, MapPin, Phone, Share2, ExternalLink, Copy, Check, AlertTriangle, Link2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { WOStatusBadge, PaymentStatusBadge, ContractStatusBadge, ProgressBar } from './WorkOrderBadges'
import type { WorkOrder } from '@/types/workOrders'
import { formatGoogleMapsUrl } from '@/utils/googleMapsValidator'
import { toast } from 'react-hot-toast'

interface WorkOrderViewDrawerProps {
  workOrder: WorkOrder
  onClose: () => void
  onEdit: (wo: WorkOrder) => void
  onSharePortal?: (wo: WorkOrder) => void
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-[var(--color-primary)]" />
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between gap-3 text-sm py-1 border-b border-[var(--color-border-subtle)] last:border-0">
      <span className="text-[var(--color-text-muted)] shrink-0">{label}</span>
      <span className={cn('text-[var(--color-text-primary)] text-right break-all', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}

export function WorkOrderViewDrawer({ workOrder: wo, onClose, onEdit, onSharePortal }: WorkOrderViewDrawerProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const events = wo.events || []
  const deliverables = wo.deliverables || []
  const payment = wo.payment
  const contract = wo.contract

  const handleCopyMapUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(id)
    toast.success('Copied Google Maps link to clipboard!')
    setTimeout(() => setCopiedLink(null), 2000)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] flex flex-col bg-[var(--color-bg-card)] border-l border-[var(--color-border-default)] shadow-[var(--shadow-modal)] animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded">
                {wo.work_order_number}
              </span>
              {wo.is_draft && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">Draft</span>
              )}
            </div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] truncate">{wo.project_name}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {wo.event_type}
              {wo.city ? ` · ${wo.city}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {onSharePortal && (
              <button
                onClick={() => onSharePortal(wo)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Share2 size={13} /> Share
              </button>
            )}
            <button
              onClick={() => onEdit(wo)}
              className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Edit
            </button>
            <button onClick={onClose} className="size-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border-subtle)] flex-wrap shrink-0">
          <WOStatusBadge status={wo.status} />
          <PaymentStatusBadge status={wo.payment_status} />
          <ContractStatusBadge status={wo.contract_status} />
          <div className="flex-1 min-w-[120px]">
            <ProgressBar value={wo.progress_percent} />
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">

            {/* Customer Info */}
            <Section title="Customer Details" icon={Phone}>
              <div className="space-y-0">
                <InfoRow label="Customer Name" value={wo.customer_name} />
                <InfoRow label="Mobile" value={wo.mobile} />
                {wo.whatsapp_number && <InfoRow label="WhatsApp" value={wo.whatsapp_number} />}
                {wo.alternate_mobile && <InfoRow label="Alt. Mobile" value={wo.alternate_mobile} />}
                {wo.email && <InfoRow label="Email" value={wo.email} />}
              </div>
            </Section>

            {/* Events & Services */}
            {events.length > 0 && (
              <Section title={`Events & Services (${events.length})`} icon={Calendar}>
                <div className="space-y-3">
                  {events.map((e, i) => {
                    const mapLink = e.google_map_link || wo.google_map_link
                    const venueName = e.venue || wo.venue
                    const eventKey = e.id || `evt_${i}`

                    return (
                      <div key={eventKey} className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] space-y-2.5 border border-[var(--color-border-subtle)]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{e.event_type_name}</span>
                          <span className="text-xs font-mono text-[var(--color-primary)]">{e.event_date || 'Date TBD'}</span>
                        </div>

                        {/* Venue Name */}
                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                          <MapPin size={13} className="text-[var(--color-primary)] shrink-0" />
                          <span>Venue: <strong className="text-[var(--color-text-primary)]">{venueName || 'Not Specified'}</strong></span>
                        </p>

                        {/* Google Maps Location Section */}
                        {mapLink ? (
                          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[var(--color-primary)] flex items-center gap-1 text-[11px]">
                                <Link2 size={12} /> Google Maps Location
                              </span>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={formatGoogleMapsUrl(mapLink)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#5B3FD9] text-white hover:bg-[#4C34C3] inline-flex items-center gap-1 transition-colors"
                                >
                                  📍 Open Map <ExternalLink size={9} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyMapUrl(mapLink, eventKey)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 inline-flex items-center gap-1 transition-colors"
                                >
                                  {copiedLink === eventKey ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                                  <span>{copiedLink === eventKey ? 'Copied' : 'Copy Link'}</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] font-mono text-[#5B3FD9] truncate">{mapLink}</p>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-700">
                            <span className="flex items-center gap-1 font-semibold text-[11px]">
                              <AlertTriangle size={12} className="text-amber-600" /> ⚠️ Venue location not added
                            </span>
                          </div>
                        )}

                        {e.services.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-subtle)]">
                            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Services:</p>
                            {e.services.map((srv, sIdx) => (
                              <div key={sIdx} className="p-2 rounded bg-[var(--color-bg-surface)] text-xs space-y-1">
                                <div className="flex justify-between font-medium">
                                  <span className="text-[var(--color-text-primary)]">{srv.service_name} (Qty: {srv.quantity})</span>
                                  <span className="text-[var(--color-text-muted)] text-[10px]">{srv.start_time} - {srv.end_time}</span>
                                </div>
                                {srv.assigned_team.length > 0 && (
                                  <div className="flex flex-wrap gap-1 text-[10px] text-[var(--color-primary)]">
                                    <span>Assigned:</span>
                                    {srv.assigned_team.map((t) => (
                                      <span key={t.employee_id} className="font-semibold">{t.employee_name}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {/* Deliverables */}
            {deliverables.length > 0 && (
              <Section title="Deliverables" icon={Package}>
                <div className="grid grid-cols-2 gap-1.5">
                  {deliverables.map((d) => (
                    <div key={d.deliverable_id} className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs',
                      d.is_delivered ? 'bg-green-500/10 text-green-400' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'
                    )}>
                      <div className={cn('size-1.5 rounded-full shrink-0', d.is_delivered ? 'bg-green-400' : 'bg-[var(--color-text-muted)]')} />
                      <span className="truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Payment Ledger */}
            {payment && (
              <Section title="Payment Ledger" icon={CreditCard}>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#5B3FD9]/10 border border-[#5B3FD9]/20 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#111827]">Razorpay Online Payment</p>
                      <p className="text-[11px] text-[#5B3FD9] font-mono font-semibold">https://razorpay.me/@Trufocusphotos</p>
                    </div>
                    <a
                      href="https://razorpay.me/@Trufocusphotos"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shrink-0"
                    >
                      Pay Online
                    </a>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs p-2.5 rounded-md bg-[var(--color-bg-elevated)] text-center">
                    <div><span className="text-[var(--color-text-muted)]">Net Amount</span> <p className="font-bold text-[var(--color-text-primary)]">₹{payment.net_amount.toLocaleString('en-IN')}</p></div>
                    <div><span className="text-green-400">Received</span> <p className="font-bold text-green-400">₹{payment.amount_received.toLocaleString('en-IN')}</p></div>
                    <div><span className="text-amber-400">Balance</span> <p className="font-bold text-amber-400">₹{payment.balance_amount.toLocaleString('en-IN')}</p></div>
                  </div>

                  {payment.ledger.length > 0 && (
                    <div className="overflow-x-auto border border-[var(--color-border-subtle)] rounded-md">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Mode</th>
                            <th className="p-2">Ref</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-subtle)]">
                          {payment.ledger.map((l) => (
                            <tr key={l.id}>
                              <td className="p-2">{l.payment_date}</td>
                              <td className="p-2 font-bold text-green-400">₹{l.amount.toLocaleString('en-IN')}</td>
                              <td className="p-2">{l.payment_mode}</td>
                              <td className="p-2 text-[var(--color-text-muted)] font-mono">{l.transaction_ref || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Contract */}
            {contract && (
              <Section title="Contract Terms" icon={FileText}>
                <div className="p-3 rounded-lg bg-[var(--color-bg-elevated)] space-y-2 border border-[var(--color-border-subtle)] text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>{contract.title}</span>
                    <span className="text-[var(--color-text-muted)]">{contract.agreement_number}</span>
                  </div>
                  <div className="prose prose-invert max-w-none text-[11px] max-h-40 overflow-y-auto p-2 bg-[var(--color-bg-surface)] rounded border" dangerouslySetInnerHTML={{ __html: contract.terms_content }} />
                </div>
              </Section>
            )}

            {/* Meta */}
            <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1 text-xs text-[var(--color-text-muted)]">
              <p>Created: {new Date(wo.created_at).toLocaleString('en-IN')}</p>
              <p>Updated: {new Date(wo.updated_at).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
