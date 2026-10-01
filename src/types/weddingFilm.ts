export interface WeddingFilm {
  id: string
  title: string
  location: string
  category: string
  video_url: string
  cover_image_url: string
  published: boolean
  featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface WeddingFilmFormData {
  title: string
  location: string
  category: string
  video_url: string
  cover_image_url: string
  published: boolean
  featured: boolean
}
