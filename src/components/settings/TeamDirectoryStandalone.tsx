import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  Filter,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { cn } from '@/utils/cn'

export type TeamDirectoryAvailability = 'available' | 'busy' | 'inactive'
export type TeamDirectoryEmploymentType = 'in_house' | 'freelancer'

export interface TeamDirectoryMember {
  id: string
  fullName: string
  email: string
  phone: string
  department: string
  roleTitle: string
  employmentType: TeamDirectoryEmploymentType
  availability: TeamDirectoryAvailability
  location: string
  avatarUrl?: string
  tags: string[]
}

interface TeamDirectoryStandaloneProps {
  members: TeamDirectoryMember[]
  onRequestCreate?: () => void
  onRequestExportCsv?: () => void
  onRequestInviteUser?: () => void
  onRequestOpenProfile?: (member: TeamDirectoryMember) => void
}

const AVAILABILITY_STYLE: Record<TeamDirectoryAvailability, string> = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  busy: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
}

const AVAILABILITY_LABEL: Record<TeamDirectoryAvailability, string> = {
  available: 'Available',
  busy: 'Busy',
  inactive: 'Inactive',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TeamDirectoryStandalone({
  members,
  onRequestCreate,
  onRequestExportCsv,
  onRequestInviteUser,
  onRequestOpenProfile,
}: TeamDirectoryStandaloneProps) {
  const [activeType, setActiveType] = useState<TeamDirectoryEmploymentType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<TeamDirectoryAvailability | 'all'>('all')

  const departments = useMemo(() => {
    const unique = new Set(members.map((m) => m.department))
    return ['all', ...Array.from(unique)]
  }, [members])

  const roles = useMemo(() => {
    const unique = new Set(members.map((m) => m.roleTitle))
    return ['all', ...Array.from(unique)]
  }, [members])

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return members.filter((m) => {
      const matchesType = activeType === 'all' || m.employmentType === activeType
      const matchesDept = department === 'all' || m.department === department
      const matchesRole = roleFilter === 'all' || m.roleTitle === roleFilter
      const matchesStatus = statusFilter === 'all' || m.availability === statusFilter
      const matchesSearch =
        query.length === 0 ||
        m.fullName.toLowerCase().includes(query) ||
        m.roleTitle.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.tags.some((t) => t.toLowerCase().includes(query))

      return matchesType && matchesDept && matchesRole && matchesStatus && matchesSearch
    })
  }, [activeType, department, members, roleFilter, search, statusFilter])

  const inHouseCount = members.filter((m) => m.employmentType === 'in_house').length
  const freelancerCount = members.filter((m) => m.employmentType === 'freelancer').length
  const availableCount = members.filter((m) => m.availability === 'available').length

  return (
    <section className="space-y-5 font-sans">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
              <Sparkles size={12} /> Prototype Module (Standalone)
            </div>
            <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
              <Users size={16} className="text-[#5B3FD9]" /> Team Directory (Preview)
            </h3>
            <p className="text-xs text-gray-500 max-w-2xl">
              Standalone UI shell for Team Directory preview. Data source and actions are provided by the host page.
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestInviteUser}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
          >
            Invite User
          </button>

          <button
            type="button"
            onClick={onRequestExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={onRequestCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B3FD9] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#4C34C3]"
          >
            <UserPlus size={14} /> Add Member
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveType('all')}
            className={cn(
              'rounded-xl border px-3 py-1.5 font-bold transition-colors',
              activeType === 'all'
                ? 'border-[#5B3FD9] bg-[#5B3FD9] text-white'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            )}
          >
            All ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveType('in_house')}
            className={cn(
              'rounded-xl border px-3 py-1.5 font-bold transition-colors',
              activeType === 'in_house'
                ? 'border-[#5B3FD9] bg-[#5B3FD9] text-white'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            )}
          >
            In-House ({inHouseCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveType('freelancer')}
            className={cn(
              'rounded-xl border px-3 py-1.5 font-bold transition-colors',
              activeType === 'freelancer'
                ? 'border-[#5B3FD9] bg-[#5B3FD9] text-white'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            )}
          >
            Freelancers ({freelancerCount})
          </button>

          <div className="ml-auto inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            <BadgeCheck size={13} /> {availableCount} available today
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 xl:grid-cols-[1fr_auto_auto_auto_auto]">
          <label className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, email, or skill tag"
              className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-900 focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
            />
          </label>

          <label className="inline-flex items-center gap-1.5">
            <Filter size={13} className="text-gray-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-9 min-w-[180px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 focus:border-[#5B3FD9] focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'all' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-1.5">
            <Filter size={13} className="text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 min-w-[180px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 focus:border-[#5B3FD9] focus:outline-none"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-1.5">
            <Filter size={13} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TeamDirectoryAvailability | 'all')}
              className="h-9 min-w-[170px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 focus:border-[#5B3FD9] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-600">
            <Briefcase size={13} /> {filteredMembers.length} results
          </div>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs text-gray-500">
          No team members match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.fullName}
                      className="size-11 rounded-xl border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="size-11 rounded-xl border border-purple-200 bg-purple-50 text-xs font-extrabold text-[#5B3FD9] flex items-center justify-center">
                      {getInitials(member.fullName)}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-extrabold text-[#111827]">{member.fullName}</h4>
                    <p className="text-[11px] font-bold text-[#5B3FD9]">{member.roleTitle}</p>
                  </div>
                </div>

                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    AVAILABILITY_STYLE[member.availability]
                  )}
                >
                  {AVAILABILITY_LABEL[member.availability]}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={12} /> {member.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} /> {member.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} /> {member.location}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                  {member.department}
                </span>
                <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {member.employmentType === 'in_house' ? 'In-House' : 'Freelancer'}
                </span>
                {member.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-[#5B3FD9]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onRequestOpenProfile?.(member)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Open Profile
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
