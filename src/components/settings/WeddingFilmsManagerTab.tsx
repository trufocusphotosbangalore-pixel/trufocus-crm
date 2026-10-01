import React, { useState, useEffect } from 'react'
import {
  Film as FilmIcon, Plus, Edit3, Trash2, Image as ImageIcon,
  CheckCircle2, RefreshCw, Star, Eye, ExternalLink,
  Upload, X, Play, MapPin, Sparkles, Filter,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'
import type { WeddingFilm, WeddingFilmFormData } from '@/types/weddingFilm'
import {
  fetchWeddingFilmsFromCloud,
  createWeddingFilmInCloud,
  updateWeddingFilmInCloud,
  deleteWeddingFilmFromCloud,
  broadcastWeddingFilmsUpdate,
} from '@/services/supabase/weddingFilms'
import { supabase } from '@/services/supabase/client'

const CATEGORY_OPTIONS = [
  'Cinematic Film',
  'Teaser & Highlight',
  'Feature Film',
  'Pre-Wedding Film',
  'Reels & Teasers',
  'Traditional Video',
]

const DEFAULT_FORM: WeddingFilmFormData = {
  title: '',
  location: '',
  category: 'Cinematic Film',
  video_url: '',
  cover_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  published: true,
  featured: false,
}

export function WeddingFilmsManagerTab() {
  const [films, setFilms] = useState<WeddingFilm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFilm, setEditingFilm] = useState<WeddingFilm | null>(null)
  const [changingCoverFilm, setChangingCoverFilm] = useState<WeddingFilm | null>(null)
  const [deletingFilm, setDeletingFilm] = useState<WeddingFilm | null>(null)
  const [previewingVideoUrl, setPreviewingVideoUrl] = useState<string | null>(null)

  // Form States
  const [addForm, setAddForm] = useState<WeddingFilmFormData>(DEFAULT_FORM)
  const [editForm, setEditForm] = useState<WeddingFilmFormData>(DEFAULT_FORM)
  const [newCoverUrl, setNewCoverUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ─── 1. READ-ONLY LOAD FROM SUPABASE ───────────────────────────────────────
  const loadFilmsFromSupabase = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true)
      else setIsLoading(true)

      const records = await fetchWeddingFilmsFromCloud()
      setFilms(records)

      if (showToast) {
        toast.success('🎉 Wedding Films synced live from Supabase DB!')
      }
    } catch (err) {
      console.error('Error loading wedding films:', err)
      toast.error('Failed to load wedding films from Supabase.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadFilmsFromSupabase(false)

    // Listen to local & cross-tab sync events
    const handleLocalSync = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (Array.isArray(detail)) {
        setFilms(detail)
      } else {
        loadFilmsFromSupabase(false)
      }
    }

    window.addEventListener('trufocus_wedding_films_updated', handleLocalSync)

    // Realtime channel for multi-browser sync
    const channel = supabase
      .channel('wedding_films_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wedding_films' }, () => {
        loadFilmsFromSupabase(false)
      })
      .subscribe()

    return () => {
      window.removeEventListener('trufocus_wedding_films_updated', handleLocalSync)
      supabase.removeChannel(channel)
    }
  }, [])

  // ─── 2. HANDLERS ────────────────────────────────────────────────────────────

  // Add Film
  const handleCreateFilm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.title.trim()) {
      toast.error('Couple Name / Title is required.')
      return
    }
    if (!addForm.location.trim()) {
      toast.error('Location is required.')
      return
    }
    if (!addForm.video_url.trim()) {
      toast.error('Video URL is required.')
      return
    }

    setIsSubmitting(true)
    const res = await createWeddingFilmInCloud(addForm)
    setIsSubmitting(false)

    if (res.success && res.film) {
      toast.success(`🎉 Wedding Film "${res.film.title}" created & saved to Supabase!`)
      setShowAddModal(false)
      setAddForm(DEFAULT_FORM)
      loadFilmsFromSupabase(false)
    } else {
      toast.error(res.error || 'Failed to create film entry.')
    }
  }

  // Open Edit Modal
  const openEditModal = (film: WeddingFilm) => {
    setEditingFilm(film)
    setEditForm({
      title: film.title,
      location: film.location,
      category: film.category,
      video_url: film.video_url,
      cover_image_url: film.cover_image_url,
      published: film.published,
      featured: film.featured,
    })
  }

  // Save Edit
  const handleUpdateFilm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFilm) return

    if (!editForm.title.trim()) {
      toast.error('Couple Name / Title is required.')
      return
    }

    setIsSubmitting(true)
    const res = await updateWeddingFilmInCloud(editingFilm.id, editForm)
    setIsSubmitting(false)

    if (res.success && res.film) {
      toast.success(`🎉 Wedding Film "${res.film.title}" updated in Supabase!`)
      setEditingFilm(null)
      loadFilmsFromSupabase(false)
    } else {
      toast.error(res.error || 'Failed to update film entry.')
    }
  }

  // Toggle Published Status
  const handleTogglePublished = async (film: WeddingFilm) => {
    const newStatus = !film.published
    // Optimistic UI update
    setFilms((prev) => prev.map((f) => (f.id === film.id ? { ...f, published: newStatus } : f)))

    const res = await updateWeddingFilmInCloud(film.id, { published: newStatus })
    if (res.success) {
      toast.success(`Film is now ${newStatus ? 'Published (Public)' : 'Unpublished (Draft)'}`)
    } else {
      toast.error(res.error || 'Failed to update published status.')
      loadFilmsFromSupabase(false)
    }
  }

  // Toggle Featured Status
  const handleToggleFeatured = async (film: WeddingFilm) => {
    const newStatus = !film.featured
    // Optimistic UI update
    setFilms((prev) => prev.map((f) => (f.id === film.id ? { ...f, featured: newStatus } : f)))

    const res = await updateWeddingFilmInCloud(film.id, { featured: newStatus })
    if (res.success) {
      toast.success(`Film ${newStatus ? 'marked as Featured ⭐' : 'removed from Featured'}`)
    } else {
      toast.error(res.error || 'Failed to update featured status.')
      loadFilmsFromSupabase(false)
    }
  }

  // Update Cover Image
  const handleSaveCoverImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changingCoverFilm) return
    if (!newCoverUrl.trim()) {
      toast.error('Cover image URL is required.')
      return
    }

    setIsSubmitting(true)
    const res = await updateWeddingFilmInCloud(changingCoverFilm.id, { cover_image_url: newCoverUrl.trim() })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('🎉 Cover Image updated & persisted to Supabase!')
      setChangingCoverFilm(null)
      setNewCoverUrl('')
      loadFilmsFromSupabase(false)
    } else {
      toast.error(res.error || 'Failed to update cover image.')
    }
  }

  // Delete Film
  const handleDeleteFilm = async () => {
    if (!deletingFilm) return

    setIsSubmitting(true)
    const res = await deleteWeddingFilmFromCloud(deletingFilm.id)
    setIsSubmitting(false)

    if (res.success) {
      toast.success(`Film "${deletingFilm.title}" deleted from Supabase.`)
      setDeletingFilm(null)
      loadFilmsFromSupabase(false)
    } else {
      toast.error(res.error || 'Failed to delete film.')
    }
  }

  // Image Upload Converter to DataURL for immediate preview
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (isEdit) {
            setEditForm((prev) => ({ ...prev, cover_image_url: reader.result as string }))
          } else {
            setAddForm((prev) => ({ ...prev, cover_image_url: reader.result as string }))
          }
          toast.success('Cover image preview updated!')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Filtered list
  const filteredFilms = films.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter
    return matchesSearch && matchesCat
  })

  const publishedCount = films.filter((f) => f.published).length
  const featuredCount = films.filter((f) => f.featured).length

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* ─── HEADER BAR ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center">
            <FilmIcon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
              Wedding Films Manager
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Single Source of Truth (Supabase DB)
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              Manage luxury wedding film entries, video URLs, cover posters, and website publication status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadFilmsFromSupabase(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Syncing...' : 'Sync from DB'}
          </button>

          <button
            onClick={() => {
              setAddForm(DEFAULT_FORM)
              setShowAddModal(true)
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-all cursor-pointer"
          >
            <Plus size={16} /> ADD FILM ENTRY
          </button>
        </div>
      </div>

      {/* ─── STATS CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Configured Films</span>
            <p className="text-2xl font-extrabold text-[#111827] mt-0.5">{films.length}</p>
          </div>
          <div className="size-10 rounded-xl bg-purple-50 text-[#5B3FD9] flex items-center justify-center font-bold">
            🎬
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Published on Website</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{publishedCount}</p>
          </div>
          <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            🌐
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Featured Showcase</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{featuredCount}</p>
          </div>
          <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ⭐
          </div>
        </div>
      </div>

      {/* ─── SEARCH & CATEGORY FILTER ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by couple name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 h-9 px-3 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#5B3FD9]"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#5B3FD9] bg-white font-medium"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-500 font-medium">
          Showing <strong className="text-gray-900">{filteredFilms.length}</strong> of {films.length} film entries
        </span>
      </div>

      {/* ─── CONFIGURED FILM ENTRIES GRID ─── */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 space-y-2">
          <RefreshCw size={24} className="animate-spin mx-auto text-[#5B3FD9]" />
          <p className="text-xs font-semibold">Loading authoritative Wedding Films from Supabase...</p>
        </div>
      ) : filteredFilms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-4">
          <div className="size-14 rounded-full bg-purple-50 text-[#5B3FD9] flex items-center justify-center mx-auto text-2xl font-bold">
            🎥
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#111827]">No Configured Film Entries Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || categoryFilter !== 'all'
                ? 'No film entries match your search/filter criteria.'
                : 'No film entries have been added to Supabase yet. Click "ADD FILM ENTRY" to create your first production record.'}
            </p>
          </div>
          <button
            onClick={() => {
              setAddForm(DEFAULT_FORM)
              setShowAddModal(true)
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] inline-flex items-center gap-1.5 shadow-md"
          >
            <Plus size={14} /> Add First Film Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFilms.map((film) => (
            <div
              key={film.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Card Top: Poster Cover Image */}
              <div className="h-48 bg-gray-900 relative overflow-hidden">
                <img
                  src={film.cover_image_url}
                  alt={film.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback poster image
                    ;(e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'
                  }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-between">
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                      {film.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {film.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                          <Star size={11} className="fill-white" /> Featured
                        </span>
                      )}

                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                          film.published
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-xs'
                            : 'bg-gray-500/30 text-gray-300 border-gray-500/40 backdrop-blur-xs'
                        )}
                      >
                        {film.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Play Button Overlay */}
                  {film.video_url && (
                    <button
                      onClick={() => setPreviewingVideoUrl(film.video_url)}
                      className="size-12 rounded-full bg-white/20 hover:bg-[#5B3FD9] backdrop-blur-xs text-white flex items-center justify-center mx-auto transition-transform hover:scale-110 cursor-pointer shadow-lg border border-white/30"
                      title="Preview Video"
                    >
                      <Play size={20} className="fill-white ml-0.5" />
                    </button>
                  )}

                  {/* Title & Location */}
                  <div>
                    <h3 className="text-base font-black text-white leading-tight drop-shadow-sm">{film.title}</h3>
                    <p className="text-xs text-gray-300 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-amber-400 shrink-0" /> {film.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Middle: Controls & Status Toggles */}
              <div className="p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between pt-1 border-b border-gray-100 pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={film.published}
                      onChange={() => handleTogglePublished(film)}
                      className="size-4 text-[#5B3FD9] rounded border-gray-300 focus:ring-[#5B3FD9] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-700">Published to Website</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={film.featured}
                      onChange={() => handleToggleFeatured(film)}
                      className="size-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-700">Featured</span>
                  </label>
                </div>

                <div className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span className="truncate max-w-[180px]">ID: {film.id}</span>
                  <span>{new Date(film.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Card Bottom: Action Buttons as requested: [ EDIT ] [ CHANGE COVER IMAGE ] [ DELETE ] */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(film)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer flex-1 justify-center"
                >
                  <Edit3 size={13} /> EDIT
                </button>

                <button
                  onClick={() => {
                    setChangingCoverFilm(film)
                    setNewCoverUrl(film.cover_image_url)
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Change Cover Image"
                >
                  <ImageIcon size={13} className="text-[#5B3FD9]" /> COVER
                </button>

                <button
                  onClick={() => setDeletingFilm(film)}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Delete Film"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ADD FILM ENTRY MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <Plus size={18} className="text-[#5B3FD9]" /> Add New Wedding Film Entry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFilm} className="space-y-4">
              <div>
                <label className="block font-extrabold text-gray-700 mb-1">Couple Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anush & Sagar Destination Wedding"
                  value={addForm.title}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Location / Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Udaipur / Raj Palace"
                    value={addForm.location}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9] bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">Supabase Video URL / Youtube Link *</label>
                <input
                  type="text"
                  required
                  placeholder="https://youtube.com/watch?v=... or https://supabase.co/storage/..."
                  value={addForm.video_url}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, video_url: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-extrabold text-gray-700">Cover Poster Image URL *</label>
                <div className="flex items-center gap-3">
                  {addForm.cover_image_url && (
                    <img
                      src={addForm.cover_image_url}
                      alt="Cover Preview"
                      className="size-14 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={addForm.cover_image_url}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-300 font-mono text-xs focus:outline-none focus:border-[#5B3FD9]"
                  />
                  <label className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload size={14} /> Upload
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageFileSelect(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.published}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, published: e.target.checked }))}
                    className="size-4 text-[#5B3FD9] rounded border-gray-300 focus:ring-[#5B3FD9]"
                  />
                  <span className="text-xs font-bold text-gray-800">Publish Immediately</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.featured}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="size-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-gray-800">Mark as Featured ⭐</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-[#5B3FD9] hover:bg-[#4C34C3] text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Record...' : 'Save Film Entry to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT WEDDING FILM MODAL ─── */}
      {editingFilm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                  <Edit3 size={18} className="text-[#5B3FD9]" /> Edit Wedding Film Entry
                </h3>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">Target Row ID: {editingFilm.id}</p>
              </div>
              <button onClick={() => setEditingFilm(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateFilm} className="space-y-4">
              <div>
                <label className="block font-extrabold text-gray-700 mb-1">Couple Name / Title *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Location / Venue *</label>
                  <input
                    type="text"
                    required
                    value={editForm.location}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9] bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">Supabase Video URL / Youtube Link *</label>
                <input
                  type="text"
                  required
                  value={editForm.video_url}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, video_url: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-extrabold text-gray-700">Cover Poster Image URL *</label>
                <div className="flex items-center gap-3">
                  {editForm.cover_image_url && (
                    <img
                      src={editForm.cover_image_url}
                      alt="Cover Preview"
                      className="size-14 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    required
                    value={editForm.cover_image_url}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-300 font-mono text-xs focus:outline-none focus:border-[#5B3FD9]"
                  />
                  <label className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload size={14} /> Change Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageFileSelect(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.published}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, published: e.target.checked }))}
                    className="size-4 text-[#5B3FD9] rounded border-gray-300 focus:ring-[#5B3FD9]"
                  />
                  <span className="text-xs font-bold text-gray-800">Published to Website</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.featured}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="size-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-gray-800">Mark as Featured ⭐</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingFilm(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-[#5B3FD9] hover:bg-[#4C34C3] text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CHANGE COVER IMAGE MODAL ─── */}
      {changingCoverFilm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <ImageIcon size={18} className="text-[#5B3FD9]" /> Change Cover Image
              </h3>
              <button onClick={() => setChangingCoverFilm(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Updating poster image for <strong className="text-gray-900">{changingCoverFilm.title}</strong>
            </p>

            <form onSubmit={handleSaveCoverImage} className="space-y-4">
              <div className="space-y-2">
                {newCoverUrl && (
                  <img
                    src={newCoverUrl}
                    alt="Preview"
                    className="w-full h-36 object-cover rounded-xl border border-gray-200"
                  />
                )}
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 font-mono text-xs focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChangingCoverFilm(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-[#5B3FD9] hover:bg-[#4C34C3] text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Cover Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ─── */}
      {deletingFilm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-[#111827]">Delete Wedding Film?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to delete this wedding film?
              </p>
              <p className="text-xs font-bold text-gray-900 pt-1 font-mono">
                "{deletingFilm.title}" (ID: {deletingFilm.id})
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFilm(null)}
                className="px-5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFilm}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIDEO PREVIEW MODAL ─── */}
      {previewingVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-black rounded-2xl border border-gray-800 shadow-2xl max-w-3xl w-full p-4 space-y-3 relative">
            <div className="flex items-center justify-between text-white pb-2 border-b border-gray-800">
              <span className="text-xs font-bold font-mono">Preview Video URL</span>
              <button onClick={() => setPreviewingVideoUrl(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="aspect-video bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center">
              {previewingVideoUrl.includes('youtube.com') || previewingVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={previewingVideoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={previewingVideoUrl} controls autoPlay className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
