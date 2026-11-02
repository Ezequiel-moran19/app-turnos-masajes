import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

export interface PrivateBooking {
  customer_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export interface BookingAccessToken {
  token: string;
  hash: string;
}

@Injectable({ providedIn: 'root' })
export class BookingAccessService {

  async createToken(): Promise<BookingAccessToken> {
    if (!globalThis.crypto?.subtle) {
      throw new Error(
        'El navegador no permite generar un enlace seguro. Usá HTTPS o localhost.',
      );
    }

    const tokenBytes = globalThis.crypto.getRandomValues(
      new Uint8Array(32),
    );

    const token = this.toHex(tokenBytes);

    const hashBuffer = await globalThis.crypto.subtle.digest(
      'SHA-256',
      tokenBytes,
    );

    const hash = this.toHex(new Uint8Array(hashBuffer));

    return { token, hash };
  }

  /**
   * Genera un enlace privado para un turno existente.
   * Esta operación requiere permisos de administrador.
   */
  async createAccessLink(bookingId: string): Promise<string> {
    const { token, hash } = await this.createToken();

    const { error } = await supabase.rpc('admin_set_booking_access', {
      p_booking_id: bookingId,
      p_token_hash: hash,
    });

    if (error) {
      throw new Error(`No se pudo generar el enlace: ${error.message}`);
    }

    return this.getAccessUrl(token);
  }

  /**
   * Construye el enlace privado de consulta del turno.
   */
  getAccessUrl(token: string): string {
    return `${window.location.origin}/mi-turno/${token}`;
  }

  async getByToken(token: string): Promise<PrivateBooking | null> {
    const { data, error } = await supabase.rpc(
      'get_booking_by_token',
      {
        p_token: token,
      },
    );

    if (error) throw new Error(error.message);

    return (data as PrivateBooking | null) ?? null;
  }

  async cancelByToken(token: string): Promise<boolean> {
    const { data, error } = await supabase.rpc(
      'cancel_booking_by_token',
      {
        p_token: token,
      },
    );

    if (error) throw new Error(error.message);

    return data === true;
  }

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}