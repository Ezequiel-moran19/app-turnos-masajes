import { Injectable } from '@angular/core';
import { ServiceRecord } from '../models';
import { supabase } from '../supabase.client';

const GENERAL_SERVICE_NAME = 'Turno de masajes';

@Injectable({
  providedIn: 'root',
})
export class PricingService {

  // Consulta el servicio general activo y su precio vigente.
  async getGeneral(): Promise<ServiceRecord> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('name', GENERAL_SERVICE_NAME)
      .eq('active', true)
      .single();

    if (error) throw error;

    if (!data || data.price === null || Number(data.price) <= 0) {
      throw new Error('El servicio general no tiene un precio válido.');
    }

    return {
      ...data,
      price: Number(data.price),
    } as ServiceRecord;
  }

  // Actualiza el precio del servicio general.
  async updateGeneralPrice(price: number): Promise<ServiceRecord> {
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error('El precio debe ser un número mayor a cero.');
    }

    const current = await this.getGeneral();

    const { data, error } = await supabase
      .from('services')
      .update({
        price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select('*')
      .single();

    if (error) throw error;

    return {
      ...data,
      price: Number(data.price),
    } as ServiceRecord;
  }
}
