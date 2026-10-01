import { supabase } from '@/services/supabase/client'
import type { WeddingFilm, WeddingFilmFormData } from '@/types/weddingFilm'

const FALLBACK_COLLECTION_ID = 'wedding_films_collection'

/**
 * Broadcast local custom event for cross-tab and cross-component sync
 */
export function broadcastWeddingFilmsUpdate(films?: WeddingFilm[]) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('trufocus_wedding_films_updated', { detail: films }))
  } catch (e) {
    console.error('Error broadcasting wedding films update event:', e)
  }
}

/**
 * READ-ONLY load function.
 * Opens or refreshes Wedding Films without modifying Supabase.
 */
export async function fetchWeddingFilmsFromCloud(): Promise<WeddingFilm[]> {
  try {
    // 1. Try querying public.wedding_films table directly
    const { data: tableData, error: tableError } = await supabase
      .from('wedding_films')
      .select('*')
      .order('display_order', { ascending: true })

    if (!tableError && Array.isArray(tableData)) {
      return tableData.map(mapRowToWeddingFilm)
    }

    // 2. Fallback to settings table (id = 'wedding_films_collection') if standard table doesn't exist
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', FALLBACK_COLLECTION_ID)
      .single()

    if (!settingsError && settingsData && settingsData.data && Array.isArray(settingsData.data.films)) {
      const list = settingsData.data.films as WeddingFilm[]
      return list.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    }

    return []
  } catch (e) {
    console.error('Exception fetching wedding films from Supabase:', e)
    return []
  }
}

/**
 * ADD NEW FILM: Creates ONE record in Supabase and returns the saved record.
 */
export async function createWeddingFilmInCloud(formData: WeddingFilmFormData): Promise<{ success: boolean; film?: WeddingFilm; error?: string }> {
  try {
    const newId = `film-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const now = new Date().toISOString()

    const newFilm: WeddingFilm = {
      id: newId,
      title: formData.title.trim(),
      location: formData.location.trim(),
      category: formData.category.trim(),
      video_url: formData.video_url.trim(),
      cover_image_url: formData.cover_image_url.trim(),
      published: formData.published,
      featured: formData.featured,
      display_order: Date.now(),
      created_at: now,
      updated_at: now,
    }

    // Attempt direct table insert
    const { data: inserted, error: insertError } = await supabase
      .from('wedding_films')
      .insert([newFilm])
      .select()

    if (!insertError && inserted && inserted.length > 0) {
      const created = mapRowToWeddingFilm(inserted[0])
      broadcastWeddingFilmsUpdate()
      return { success: true, film: created }
    }

    // Fallback store insert
    const existing = await fetchWeddingFilmsFromCloud()
    const updatedList = [...existing, newFilm]

    const { error: fallbackError } = await supabase
      .from('settings')
      .upsert({
        id: FALLBACK_COLLECTION_ID,
        data: { films: updatedList },
        updated_at: now,
      })

    if (fallbackError) {
      return { success: false, error: fallbackError.message }
    }

    broadcastWeddingFilmsUpdate(updatedList)
    return { success: true, film: newFilm }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to add wedding film'
    return { success: false, error: msg }
  }
}

/**
 * EDIT / UPDATE FILM BY IMMUTABLE ID: Updates ONLY the target row in Supabase.
 */
export async function updateWeddingFilmInCloud(id: string, updates: Partial<WeddingFilm>): Promise<{ success: boolean; film?: WeddingFilm; error?: string }> {
  try {
    const now = new Date().toISOString()
    const payload = { ...updates, updated_at: now }

    // Attempt direct table update
    const { data: updatedRows, error: updateError } = await supabase
      .from('wedding_films')
      .update(payload)
      .eq('id', id)
      .select()

    if (!updateError && updatedRows && updatedRows.length > 0) {
      const updated = mapRowToWeddingFilm(updatedRows[0])
      broadcastWeddingFilmsUpdate()
      return { success: true, film: updated }
    }

    // Fallback store update
    const existing = await fetchWeddingFilmsFromCloud()
    let updatedFilm: WeddingFilm | undefined

    const updatedList = existing.map((item) => {
      if (item.id === id) {
        updatedFilm = { ...item, ...payload }
        return updatedFilm
      }
      return item
    })

    if (!updatedFilm) {
      return { success: false, error: `Wedding film with ID '${id}' not found.` }
    }

    const { error: fallbackError } = await supabase
      .from('settings')
      .upsert({
        id: FALLBACK_COLLECTION_ID,
        data: { films: updatedList },
        updated_at: now,
      })

    if (fallbackError) {
      return { success: false, error: fallbackError.message }
    }

    broadcastWeddingFilmsUpdate(updatedList)
    return { success: true, film: updatedFilm }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update wedding film'
    return { success: false, error: msg }
  }
}

/**
 * DELETE FILM BY IMMUTABLE ID: Deletes ONLY the specific record.
 */
export async function deleteWeddingFilmFromCloud(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Attempt direct table delete
    const { error: deleteError } = await supabase
      .from('wedding_films')
      .delete()
      .eq('id', id)

    if (!deleteError) {
      broadcastWeddingFilmsUpdate()
      return { success: true }
    }

    // Fallback store delete
    const existing = await fetchWeddingFilmsFromCloud()
    const updatedList = existing.filter((item) => item.id !== id)

    const { error: fallbackError } = await supabase
      .from('settings')
      .upsert({
        id: FALLBACK_COLLECTION_ID,
        data: { films: updatedList },
        updated_at: new Date().toISOString(),
      })

    if (fallbackError) {
      return { success: false, error: fallbackError.message }
    }

    broadcastWeddingFilmsUpdate(updatedList)
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete wedding film'
    return { success: false, error: msg }
  }
}

/**
 * STABLE REORDER: Non-destructive update of display_order field.
 */
export async function reorderWeddingFilmsInCloud(films: WeddingFilm[]): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    const reordered = films.map((f, idx) => ({ ...f, display_order: idx + 1, updated_at: now }))

    // Update in fallback store
    const { error } = await supabase
      .from('settings')
      .upsert({
        id: FALLBACK_COLLECTION_ID,
        data: { films: reordered },
        updated_at: now,
      })

    if (!error) {
      broadcastWeddingFilmsUpdate(reordered)
      return { success: true }
    }

    return { success: false, error: error.message }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Reorder failed' }
  }
}

/**
 * Helper to normalize row objects
 */
function mapRowToWeddingFilm(row: any): WeddingFilm {
  return {
    id: String(row.id),
    title: String(row.title || 'Untitled Film'),
    location: String(row.location || ''),
    category: String(row.category || 'Cinematic Film'),
    video_url: String(row.video_url || ''),
    cover_image_url: String(row.cover_image_url || ''),
    published: Boolean(row.published ?? true),
    featured: Boolean(row.featured ?? false),
    display_order: Number(row.display_order || 0),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  }
}
