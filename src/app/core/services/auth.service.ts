import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    if (profileError || data?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('El usuario no tiene permisos de administrador.');
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async isAdmin(): Promise<boolean> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) return false;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();

    return !error && data?.role === 'admin';
  }

  async currentEmail(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user?.email ?? '';
  }
}
