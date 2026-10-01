export interface SopArticle {
  id: string
  title: string
  category: 'Company SOP' | 'Camera Settings' | 'Editing Standards' | 'Client Handling' | 'Emergency Contacts' | 'Company Policies'
  description: string
  content: string
  video_url?: string
}

export const HELP_CENTER_ARTICLES: SopArticle[] = [
  {
    id: 'sop_1',
    title: 'Standard Shoot Day Operations SOP',
    category: 'Company SOP',
    description: 'Protocol for arrival, equipment check, client interaction, and card submission.',
    content: '1. Arrive at venue 30 minutes prior to scheduled start time.\n2. Complete check-in via Trufocus Crew app upon arrival.\n3. Verify all battery levels and dual-card recording settings.\n4. Introduce yourself to the event coordinator.\n5. Hand over memory cards to Data Manager immediately post-shoot.',
  },
  {
    id: 'sop_2',
    title: 'Camera & Dual Card Recording Setup',
    category: 'Camera Settings',
    description: 'Mandatory camera profiles, color space, and backup card configuration.',
    content: 'S-Log3 / C-Log3 profiles for video. RAW + JPEG Fine for photography. Dual Slot Slot 1 (RAW) + Slot 2 (RAW backup) mandatory on all primary bodies.',
  },
  {
    id: 'sop_3',
    title: 'Post-Production Editing & Delivery Standards',
    category: 'Editing Standards',
    description: 'Color grading guidelines, export resolution, and timeline deadlines.',
    content: 'Deliverables must adhere to Rec.709 color standards. 4K UHD 24fps export for cinematic teasers. Teaser cuts due within 72 hours of shoot completion.',
  },
  {
    id: 'sop_4',
    title: 'Client Handling & Etiquette Guide',
    category: 'Client Handling',
    description: 'Dress code, communication, and professional conduct during shoots.',
    content: 'Black attire mandatory for formal events. Maintain polite, reassuring tone with clients and guests at all times.',
  },
  {
    id: 'sop_5',
    title: 'Emergency Contacts Directory',
    category: 'Emergency Contacts',
    description: 'Studio hotline, technical support, and logistics leads.',
    content: 'Studio Ops Line: +91 98765 00000\nTechnical Support Lead: +91 98765 11111\nEquipment Manager: +91 98765 22222',
  },
]
