import { Film } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'

export default function PostProduction() {
  return (
    <ComingSoon
      icon={Film}
      title="Post Production"
      description="Manage the editing and post-production workflow for photos and videos, track revision cycles and approvals."
      module="Post Production"
    />
  )
}
