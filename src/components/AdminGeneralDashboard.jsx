import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, RefreshCw, Shield, Users } from "lucide-react";
import { supabase } from "../supabaseClient";

const Section = ({ title, children }) => (
  <section className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const EmptyState = ({ text }) => (
  <p className="text-sm text-slate-400 text-center py-6">{text}</p>
);

export default function AdminGeneralDashboard({ currentUser, onLogout }) {
  const [tenants, setTenants] = useState([]);
  const [campanias, setCampanias] = useState([]);
  const [campaniaModulos, setCampaniaModulos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [usuariosAdmin, setUsuariosAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        tenantsRes,
        campaniasRes,
        campaniaModulosRes,
        modulosRes,
        usuariosRes,
      ] = await Promise.all([
        supabase.from("tenants").select("*").order("created_at", { ascending: true }),
        supabase.from("campanias").select("*").order("created_at", { ascending: true }),
        supabase.from("campania_modulos").select("*").order("campania_id", { ascending: true }),
        supabase.from("modulos").select("*").order("key", { ascending: true }),
        supabase
          .from("usuarios_admin")
          .select("id,auth_user_id,campania_id,rol,nombre,apellido,email,username,activo,created_at")
          .order("rol", { ascending: true }),
      ]);

      const firstError = [
        tenantsRes.error,
        campaniasRes.error,
        campaniaModulosRes.error,
        modulosRes.error,
        usuariosRes.error,
      ].find(Boolean);

      if (firstError) throw firstError;

      setTenants(tenantsRes.data || []);
      setCampanias(campaniasRes.data || []);
      setCampaniaModulos(campaniaModulosRes.data || []);
      setModulos(modulosRes.data || []);
      setUsuariosAdmin(usuariosRes.data || []);
    } catch (err) {
      console.error("Error cargando panel admin general:", err);
      setError(err?.message || "No se pudieron cargar los datos del panel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const tenantById = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant])),
    [tenants]
  );

  const moduloByKey = useMemo(
    () => new Map(modulos.map((modulo) => [modulo.key, modulo])),
    [modulos]
  );

  const modulesByCampaign = useMemo(() => {
    const map = new Map();
    campaniaModulos
      .filter((item) => item.habilitado)
      .forEach((item) => {
        const list = map.get(item.campania_id) || [];
        const modulo = moduloByKey.get(item.modulo);
        list.push(modulo?.nombre || item.modulo);
        map.set(item.campania_id, list);
      });
    return map;
  }, [campaniaModulos, moduloByKey]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-brand-700 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                Admin General
              </h1>
              <p className="text-brand-100 text-xs truncate">
                {currentUser?.nombre} {currentUser?.apellido}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white px-3 h-9 rounded-lg text-sm font-medium transition-colors shrink-0 border-0 shadow-none"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 h-9 rounded-lg text-sm font-medium transition-colors shrink-0 border-0 shadow-none"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm font-semibold text-brand-700 shadow-card">
            Cargando datos de administración...
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-500">Tenants</p>
            <p className="text-3xl font-bold text-slate-800">{tenants.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-500">Campañas</p>
            <p className="text-3xl font-bold text-slate-800">{campanias.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-500">Módulos</p>
            <p className="text-3xl font-bold text-slate-800">{modulos.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-500">Admins</p>
            <p className="text-3xl font-bold text-slate-800">{usuariosAdmin.length}</p>
          </div>
        </div>

        <Section title="Tenants">
          {tenants.length === 0 ? (
            <EmptyState text="No hay tenants cargados." />
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="border border-slate-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-slate-800">{tenant.nombre}</p>
                  <p className="text-xs text-slate-500">Estado: {tenant.estado || "sin estado"}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Campañas">
          {campanias.length === 0 ? (
            <EmptyState text="No hay campañas cargadas." />
          ) : (
            <div className="space-y-2">
              {campanias.map((campania) => (
                <div key={campania.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{campania.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {campania.candidato_nombre || "Sin candidato"} · {campania.cargo || "Sin cargo"} {campania.anio || ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tenant: {tenantById.get(campania.tenant_id)?.nombre || campania.tenant_id || "sin tenant"}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${campania.activa ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {campania.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Módulos habilitados por campaña">
          {campanias.length === 0 ? (
            <EmptyState text="No hay campañas para mostrar módulos." />
          ) : (
            <div className="space-y-2">
              {campanias.map((campania) => {
                const modules = modulesByCampaign.get(campania.id) || [];
                return (
                  <div key={campania.id} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-800">{campania.nombre}</p>
                    {modules.length === 0 ? (
                      <p className="text-xs text-slate-400 mt-1">Sin módulos habilitados.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {modules.map((moduleName) => (
                          <span key={moduleName} className="text-xs px-2 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-100">
                            {moduleName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Usuarios admin">
          {usuariosAdmin.length === 0 ? (
            <EmptyState text="No hay usuarios admin cargados." />
          ) : (
            <div className="space-y-2">
              {usuariosAdmin.map((usuario) => (
                <div key={usuario.id} className="border border-slate-200 rounded-lg p-3 flex items-start gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                    <Users className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {usuario.nombre} {usuario.apellido}
                    </p>
                    <p className="text-xs text-slate-500">
                      {usuario.username || "sin username"} · {usuario.rol}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      Campaña: {usuario.campania_id ? (campanias.find((c) => c.id === usuario.campania_id)?.nombre || usuario.campania_id) : "Todas"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}
