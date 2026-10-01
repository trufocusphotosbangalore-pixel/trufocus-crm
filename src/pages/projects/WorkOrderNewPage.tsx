import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkOrderWizard } from '@/components/workOrders/WorkOrderWizard'
import { useWorkOrders } from '@/hooks/useWorkOrders'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { WorkOrderWizardData } from '@/types/workOrders'

export default function WorkOrderNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const { createWorkOrder } = useWorkOrders()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    navigate('/projects')
  }

  const handleSubmit = async (data: WorkOrderWizardData) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const userId = user?.id || 'usr-admin'
      const { data: createdWO, error } = await createWorkOrder(data, userId, false)

      if (error || !createdWO) {
        console.error('Supabase Work Order Creation Error:', error)
        toast.error(error || 'Unable to create Work Order. Please check required fields and try again.')
        setIsSubmitting(false)
        return
      }

      toast.success(`Work Order ${createdWO.work_order_number} created successfully! 🎉`)
      navigate(`/work-orders/${createdWO.id}`, { replace: true })
    } catch (err: any) {
      console.error('Unhandled Work Order Creation Exception:', err)
      toast.error('Unable to create Work Order. Please check the required fields and try again.')
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async (data: WorkOrderWizardData) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const userId = user?.id || 'usr-admin'
      const { data: createdWO, error } = await createWorkOrder(data, userId, true)

      if (error || !createdWO) {
        toast.error(error || 'Unable to save draft.')
        setIsSubmitting(false)
        return
      }

      toast.success(`Work Order draft ${createdWO.work_order_number} saved successfully! 💾`)
      navigate('/projects')
    } catch (err: any) {
      console.error('Unhandled Draft Save Exception:', err)
      toast.error('Unable to save draft.')
      setIsSubmitting(false)
    }
  }

  return (
    <WorkOrderWizard
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      isSubmitting={isSubmitting}
    />
  )
}
