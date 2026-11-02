import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { BookingRecord } from '../models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  async list(): Promise<BookingRecord[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, services(name)')
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data ?? []) as BookingRecord[];
  }

  async updateStatus(id: string, status: BookingRecord['status']): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async counts(): Promise<{ total: number; pending: number; confirmed: number }> {
    const { data, error } = await supabase.from('bookings').select('status');
    if (error) throw error;
    const rows = data ?? [];
    return {
      total: rows.length,
      pending: rows.filter((x) => x.status === 'pending').length,
      confirmed: rows.filter((x) => x.status === 'confirmed').length,
    };
  }

  async create(value: {
    customer_name: string;
    customer_phone: string;
    service_id: string | null;
    booking_date: string;
    start_time: string;
    end_time: string;
    notes: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .insert({ ...value, status: 'pending' });

    if (error) {
      // 23505 = violación del índice único (horario ya tomado)
      if (error.code === '23505') {
        throw new Error('Ese horario acaba de ser reservado. Elegí otro.');
      }
      throw new Error(error.message);
    }
  }

  async takenSlots(date: string): Promise<string[]> {
    const { data, error } = await supabase.rpc('get_taken_slots', { p_date: date });
    if (error) throw error;
    return (data ?? []).map((r: { start_time: string }) => r.start_time);
  }
}
