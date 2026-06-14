import { supabase } from "../supabaseClient";

export async function listarTenants() {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function crearTenant(payload) {
  const { data, error } = await supabase
    .from("tenants")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listarCampanias() {
  const { data, error } = await supabase
    .from("campanias")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function crearCampania(payload) {
  const { data, error } = await supabase
    .from("campanias")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}
