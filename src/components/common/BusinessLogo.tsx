import { useState, useEffect } from 'react'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import type { BusinessProfileData } from '@/types/businessProfile'
import { cn } from '@/utils/cn'

interface BusinessLogoProps {
  className?: string
  imageClassName?: string
  textClassName?: string
  taglineClassName?: string
  showTagline?: boolean
  profile?: BusinessProfileData
}

export function BusinessLogo({
  className = '',
  imageClassName = '',
  textClassName = '',
  taglineClassName = '',
  showTagline = true,
  profile: propProfile,
}: BusinessLogoProps) {
  const [profile, setProfile] = useState<BusinessProfileData>(() => propProfile || loadBusinessProfile())

  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile)
      return
    }
    const handleSync = () => {
      setProfile(loadBusinessProfile())
    }
    window.addEventListener('trufocus_business_profile_updated', handleSync)
    return () => window.removeEventListener('trufocus_business_profile_updated', handleSync)
  }, [propProfile])

  const logoUrl = profile.logo_url?.trim()

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={profile.business_name || 'Business Logo'}
        className={cn('max-h-12 object-contain', imageClassName)}
        onError={(e) => {
          // If image fails, hide it gracefully
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  return (
    <div className={cn('flex flex-col justify-center', className)}>
      <span className={cn('font-extrabold text-sm tracking-tight text-[#111827]', textClassName)}>
        {profile.business_name || 'TRUFOCUS PHOTOGRAPHY'}
      </span>
      {showTagline && profile.tagline && (
        <span className={cn('text-[10px] font-medium text-gray-500 tracking-normal mt-0.5', taglineClassName)}>
          {profile.tagline}
        </span>
      )}
    </div>
  )
}
