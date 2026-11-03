import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { ScheduleExceptionRecord, WeeklyScheduleRecord } from '../models';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  async getWeekly(): Promise<WeeklyScheduleRecord[]> {
    const { data, error } = await supabase.from('weekly_schedule').select('*').order('weekday');
    if (error) throw error;
    return (data ?? []) as WeeklyScheduleRecord[];
  }

  async saveWeekly(row: WeeklyScheduleRecord): Promise<void> {
    const { error } = await supabase.from('weekly_schedule').upsert(row, { onConflict: 'weekday' });
    if (error) throw new Error(error.message);
  }

  async saveWeeklyMany(rows: WeeklyScheduleRecord[]): Promise<void> {
    const { error } = await supabase.from('weekly_schedule').upsert(rows, { onConflict: 'weekday' });
    if (error) throw new Error(error.message);
  }

  async getExceptions(): Promise<ScheduleExceptionRecord[]> {
    const { data, error } = await supabase.from('schedule_exceptions').select('*').order('exception_date');
    if (error) throw error;
    return (data ?? []) as ScheduleExceptionRecord[];
  }

  async saveException(value: { exception_date: string; closed: boolean; slots: string[]; note: string; }): Promise<void> {
    const { error } = await supabase.from('schedule_exceptions').upsert(value, { onConflict: 'exception_date' });
    if (error) throw new Error(error.message);
  }

  async deleteException(id: string): Promise<void> {
    const { error } = await supabase.from('schedule_exceptions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}