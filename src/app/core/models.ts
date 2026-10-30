export type IconName = | 'hand' | 'leaf' | 'bolt' | 'drop'
  | 'wave' | 'moon' | 'cycle' | 'shield'
  | 'book' | 'user' | 'home' | 'chat' | 'cam' | 'pin' | 'whatsapp' | 'instagram';

export interface Shape {
  tag: 'path' | 'circle' | 'rect';
  attrs: Record<string, string>;
}

export interface Service {
  name: string;
  description: string;
  duration: string;
  minutes: number;
  price: number | null;
  icon: IconName;
  image: string;
}

export interface Treatment {
  name: string;
  description: string;
  image: string;
}

export interface Contact {
  name: string;
  value: string;
  icon: IconName;
  href?: string;
}

export interface ScheduleConfig {
  days: number[];
  open: string;
  close: string;
  stepMinutes: number;
  horizonDays: number;
  leadMinutes: number;
}

export interface DayOption {
  key: string;
  weekday: string;
  day: number;
  month: string;
  selected: boolean;
}

export type MissingField = 'date' | 'time' | 'name';


// export interface Training {
//   name: string;
//   description: string;
//   icon: IconName;
// }