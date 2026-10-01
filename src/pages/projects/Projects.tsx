import { FolderKanban } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'

export default function Projects() {
  return (
    <ComingSoon
      icon={FolderKanban}
      title="Projects"
      description="Track all active and past projects, assign team members, manage timelines and deliverables."
      module="Projects"
    />
  )
}
