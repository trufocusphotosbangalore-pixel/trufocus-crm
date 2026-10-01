import { Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function AuthLayout() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return <Outlet />
  }

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center',
        'bg-[#F8FAFC] px-4 py-12 font-sans'
      )}
    >
      <div
        className={cn(
          'w-full max-w-[440px]',
          'bg-white rounded-[24px]',
          'border border-[#E2E8F0]',
          'shadow-xl',
          'p-8'
        )}
      >
        <Outlet />
      </div>

      <p className="mt-6 text-xs text-[#64748B]">
        © {new Date().getFullYear()} Trufocus Photography. All rights reserved.
      </p>
    </div>
  )
}
