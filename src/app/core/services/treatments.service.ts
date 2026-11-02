import { Injectable } from '@angular/core';
import { TreatmentRecord } from '../models';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root',
})
export class TreatmentsService {

  // Lista todos los tratamientos para el administrador.
  async list(): Promise<TreatmentRecord[]> {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    return (data ?? []) as TreatmentRecord[];
  }

  // Lista únicamente los tratamientos activos para la página pública.
  async listPublic(): Promise<TreatmentRecord[]> {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('active', true)
      .order('sort_order');

    if (error) throw error;

    return (data ?? []) as TreatmentRecord[];
  }

  // Crea o actualiza un tratamiento.
  async save(value: Partial<TreatmentRecord> & Pick<TreatmentRecord, 'name' | 'description'>): Promise<void> {
    const { id, ...payload } = value;

    const result = id
      ? await supabase
          .from('treatments')
          .update(payload)
          .eq('id', id)
      : await supabase
          .from('treatments')
          .insert(payload);

    if (result.error) throw result.error;
  }

  // Realiza una baja o reactivación lógica.
  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('treatments')
      .update({ active })
      .eq('id', id);

    if (error) throw error;
  }
}