import { supabase } from "../supabaseClient";

export async function obtenerCampaniaActiva() {
  const { data, error } = await supabase
    .from("campanias")
    .select("*")
    .eq("activa", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Error obteniendo campaña activa");
  }

  return data || null;
}

export async function obtenerCampaniaPorId(campaniaId) {
  if (!campaniaId) return null;

  const { data, error } = await supabase
    .from("campanias")
    .select("*")
    .eq("id", campaniaId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Error obteniendo campaña");
  }

  return data || null;
}

export async function obtenerModulosCampania(campaniaId) {
  if (!campaniaId) return [];

  const { data, error } = await supabase
    .from("campania_modulos")
    .select("modulo")
    .eq("campania_id", campaniaId)
    .eq("habilitado", true);

  if (error) {
    throw new Error(error.message || "Error obteniendo módulos de campaña");
  }

  return (data || []).map((item) => item.modulo).filter(Boolean);
}
