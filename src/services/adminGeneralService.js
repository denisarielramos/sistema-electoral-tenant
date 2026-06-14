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

export async function listarModulos() {
  const { data, error } = await supabase
    .from("modulos")
    .select("*")
    .order("key", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarCampaniaModulos() {
  const { data, error } = await supabase
    .from("campania_modulos")
    .select("*")
    .order("campania_id", { ascending: true })
    .order("modulo", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function setModuloCampania(campaniaId, modulo, habilitado) {
  const { data, error } = await supabase
    .from("campania_modulos")
    .upsert(
      {
        campania_id: campaniaId,
        modulo,
        habilitado,
      },
      { onConflict: "campania_id,modulo" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
