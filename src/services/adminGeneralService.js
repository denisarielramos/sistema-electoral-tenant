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
        habilitado: Boolean(habilitado),
      },
      { onConflict: "campania_id,modulo" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function crearSuperadminCliente(payload) {
  const { data, error } = await supabase
    .from("usuarios_admin")
    .insert([
      {
        campania_id: payload.campania_id,
        rol: "superadmin_cliente",
        nombre: payload.nombre,
        apellido: payload.apellido || null,
        email: payload.email || null,
        username: payload.username,
        password_hash: payload.password_hash,
        activo: true,
      },
    ])
    .select("id,auth_user_id,campania_id,rol,nombre,apellido,email,username,activo,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function listarPadronCisCampania(campaniaId, cis) {
  if (!campaniaId || !cis?.length) return [];

  const uniqueCis = [...new Set(cis)];
  const result = [];
  const chunkSize = 500;

  for (let i = 0; i < uniqueCis.length; i += chunkSize) {
    const chunk = uniqueCis.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("padron")
      .select("ci")
      .eq("campania_id", campaniaId)
      .in("ci", chunk);

    if (error) throw error;
    result.push(...(data || []));
  }

  return result.map((item) => Number(item.ci));
}

export async function importarPadronCampania(campaniaId, rows) {
  if (!campaniaId) throw new Error("Debe seleccionar una campaña.");
  if (!rows?.length) throw new Error("No hay filas para importar.");

  const toNullableNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  };

  const payload = rows.map((row) => ({
    campania_id: campaniaId,
    ci: Number(row.ci),
    nombre: row.nombre || null,
    apellido: row.apellido || null,
    localidad: row.localidad || null,
    local_votacion: row.local_votacion || null,
    seccional: toNullableNumber(row.seccional),
    mesa: toNullableNumber(row.mesa),
    orden: toNullableNumber(row.orden),
    direccion: row.direccion || null,
  }));

  const { data, error } = await supabase
    .from("padron")
    .upsert(payload, { onConflict: "campania_id,ci" })
    .select("ci");

  if (error) throw error;
  return data || [];
}
