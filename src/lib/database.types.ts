export type BadgeKey = 'new' | 'signature' | 'hot' | 'strong' | 'na'

export interface Category {
  id: string
  slug: string
  code: string | null
  name_uk: string
  name_en: string | null
  description_uk: string | null
  description_en: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  category_id: string
  slug: string
  name_uk: string
  name_en: string | null
  note_uk: string | null
  note_en: string | null
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  category_id: string
  subcategory_id: string | null
  slug: string
  name_uk: string
  name_en: string | null
  description_uk: string | null
  description_en: string | null
  price: number | null
  price_display: string | null
  image_url: string | null
  badges: BadgeKey[]
  tags: string[]
  is_available: boolean
  is_active: boolean
  sort_order: number
  likes_count?: number
}

export interface CategoryBanner {
  id: string
  category_id: string
  title_uk: string
  title_en: string | null
  description_uk: string | null
  description_en: string | null
  image_url: string | null
  cta_label_uk: string | null
  cta_label_en: string | null
  cta_url: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  sort_order: number
}

export interface CallRequest {
  id: string
  table_number: string
  items: CallRequestItem[]
  comment: string | null
  status: 'new' | 'accepted' | 'done' | 'cancelled'
  kind: 'call' | 'order'
  telegram_message_id: number | null
  source: string
  created_at: string
  updated_at: string
}

export interface CallRequestItem {
  product_id: string | null
  name: string
  qty: number
  price: number | null
}

export interface Setting {
  key: string
  value: unknown
  is_public: boolean
}

export interface Profile {
  id: string
  role: 'admin' | 'manager'
  email: string | null
  display_name: string | null
}

export interface Database {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      subcategories: { Row: Subcategory; Insert: Partial<Subcategory>; Update: Partial<Subcategory> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      category_banners: { Row: CategoryBanner; Insert: Partial<CategoryBanner>; Update: Partial<CategoryBanner> }
      call_requests: { Row: CallRequest; Insert: Partial<CallRequest>; Update: Partial<CallRequest> }
      settings: { Row: Setting; Insert: Partial<Setting>; Update: Partial<Setting> }
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
    }
  }
}
