export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Testimonial {
  id: number;
  user_name: string;
  role: string;
  comment: string;
  rating: number;
  approved: boolean;
  created_at: string;
}

export interface NotesSample {
  id: string;
  title: string;
  preview: string;
  blur_section: string;
}

export interface ConfigData {
  amount: number;
  original_amount: number;
  timer_duration_hours: number;
  start_time: string;
  is_expired: boolean;
  remaining_seconds: number;
  server_time: string;
  razorpay_key_configured: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  payment_id: string;
  razorpay_order_id: string;
  amount: number;
  status: string;
  purchase_date: string;
}

export type PageRoute =
  | 'home'
  | 'login'
  | 'register'
  | 'forgot'
  | 'dashboard'
  | 'samples'
  | 'pricing'
  | 'testimonials'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'refund'
  | 'admin';

export interface Booking {
  id: number;
  user_id: number;
  session_type: string; // 'coding', 'design', or 'resume'
  date_time: string; // ISO date string or formatted date
  status: 'scheduled' | 'cancelled' | 'completed';
  created_at: string;
}

export interface PaymentClaim {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  amount: number;
  utr?: string | null;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
}

export interface UpiConfig {
  upi_id: string;
  qr_image: string;
  amount: number;
  configured: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PersonaCard {
  title: string;
  level: string;
  pain_point: string;
  gain: string;
}

export interface ToolkitItemContent {
  id: string;
  title: string;
  category: 'Manual' | 'Automation' | 'Templates' | 'Career';
  description: string;
}

export interface HomeContent {
  hero_tag: string;
  hero_title: string;
  hero_subtitle: string;
  faqs: FaqItem[];
  personas: PersonaCard[];
}

export interface ContactInfo {
  support_email: string;
  phone: string;
  address: string;
  website: string;
}

export interface SiteContent {
  home: HomeContent;
  toolkitItems: ToolkitItemContent[];
  contact: ContactInfo;
}
