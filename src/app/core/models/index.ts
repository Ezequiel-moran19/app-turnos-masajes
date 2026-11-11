export interface Contact {
  name: string;
  value: string;
  icon: string;
  href?: string;
}

export interface DayOption {
  key: string;
  weekday: string;
  day: number;
  month: string;
  selected: boolean;
}

export interface TreatmentRecord {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  image_url: string;
  active: boolean;
  sort_order: number;
}

export interface BookingRecord {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  service_id: string | null;
  price: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  created_at: string;
  services?: { name: string } | null;
}

export interface WeeklyScheduleRecord {
  weekday: number;
  slots: string[];
  enabled: boolean;
}

export interface ScheduleExceptionRecord {
  id: string;
  exception_date: string;
  closed: boolean;
  slots: string[];
  note: string;
}
export interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null;
  icon: string;
  image_url: string;
  active: boolean;
  sort_order: number;
}

export type MissingField = 'date' | 'time' | 'name' | 'phone';