import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Plus, RefreshCw, Shield, Users, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  crearCampania,
  crearTenant,
  listarCampanias,
  listarTenants,
} from "../services/adminGeneralService";

const EMPTY_CAMPAIGN = {
  tenant_id: "",
  nombre: "",
  candidato_nombre: "",
  cargo: "",
  anio: "",
  partido: "",
  lista: "",
  opcion: "",
  fecha_eleccion: "",
  logo_url: "",
  flyer_url: "",
  color_primario: "#dc2626",
  color_secundario: "#991b1b",
  activa: true,
};

const Section = ({ title, actions, children }) => (
  <section className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {actions}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const EmptyState = ({ text }) => (
  <p className="text-sm text-slate-400 text-center py-6">{text}</p>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent shadow-none"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
    {children}
  </label>
);

const inputClass =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50";

const ActionButton = ({ children, onClick, disabled, variant = "primary", type = "button" }) => {
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white border-0",
    subtle: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-3 h-9 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

export default function AdminGeneralDashboard({ currentUser, onLogout }) {
  const [tenants, setTenants] = useState([]);
  const [campanias, setCampanias] = useState([]);
  const [campaniaModulos, setCampaniaModulos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [usuariosAdmin, setUsuariosAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState({ nombre: "", estado: "activo" });
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        tenantsData,
        campaniasData,
        campaniaModulosRes,
        modulosRes,
        usuariosRes,
      ] = await Promise.all([
        listarTenants(),
        listarCampanias(),
        supabase.from("campania_modulos").select("*").order("campania_id", { ascending: true }),
        supabase.from("modulos").select("*").order("key", { ascending: true }),
        supabase
          .from("usuarios_admin")
          .select("id,auth_user_id,campania_id,rol,nombre,apellido,email,username,activo,created_at")
          .order("rol", { ascending: true }),
      ]);

      const firstError = [
        campaniaModulosRes.error,
        modulosRes.error,
        usuariosRes.error,
      ].find(Boolean);

      if (firstError) throw firstError;

      setTenants(tenantsData);
      setCampanias(campaniasData);
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

  const closeTenantModal = () => {
    setTenantModalOpen(false);
    setTenantForm({ nombre: "", estado: "activo" });
    setFormError(null);
  };

  const closeCampaignModal = () => {
    setCampaignModalOpen(false);
    setCampaignForm(EMPTY_CAMPAIGN);
    setFormError(null);
  };

  const handleCrearTenant = async (event) => {
    event.preventDefault();
    setFormError(null);
    const nombre = tenantForm.nombre.trim();

    if (!nombre) {
      setFormError("No se puede crear un cliente sin nombre.");
      return;
    }

    setSaving(true);
    try {
      await crearTenant({
        nombre,
        estado: tenantForm.estado || "activo",
      });
      closeTenantModal();
      await cargarDatos();
    } catch (err) {
      console.error("Error creando cliente:", err);
      setFormError(err?.message || "No se pudo crear el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const handleCrearCampania = async (event) => {
    event.preventDefault();
    setFormError(null);
    const nombre = campaignForm.nombre.trim();

    if (!campaignForm.tenant_id || !nombre) {
      setFormError("No se puede crear una campaña sin cliente y nombre.");
      return;
    }

    const payload = {
      ...campaignForm,
      nombre,
      candidato_nombre: campaignForm.candidato_nombre.trim() || null,
      cargo: campaignForm.cargo.trim() || null,
      anio: campaignForm.anio ? Number(campaignForm.anio) : null,
      partido: campaignForm.partido.trim() || null,
      lista: campaignForm.lista.trim() || null,
      opcion: campaignForm.opcion.trim() || null,
      fecha_eleccion: campaignForm.fecha_eleccion || null,
      logo_url: campaignForm.logo_url.trim() || null,
      flyer_url: campaignForm.flyer_url.trim() || null,
      color_primario: campaignForm.color_primario || "#dc2626",
      color_secundario: campaignForm.color_secundario || "#991b1b",
      activa: Boolean(campaignForm.activa),
    };

    setSaving(true);
    try {
      await crearCampania(payload);
      closeCampaignModal();
      await cargarDatos();
    } catch (err) {
      console.error("Error creando campaña:", err);
      setFormError(err?.message || "No se pudo crear la campaña.");
    } finally {
      setSaving(false);
    }
  };

  const updateCampaignForm = (field, value) => {
    setCampaignForm((prev) => ({ ...prev, [field]: value }));
  };

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
              type="button"
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

        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => setTenantModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Crear cliente
          </ActionButton>
          <ActionButton
            onClick={() => setCampaignModalOpen(true)}
            disabled={tenants.length === 0}
            variant="subtle"
          >
            <Plus className="w-4 h-4" />
            Crear campaña
          </ActionButton>
        </div>

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

        <Section
          title="Tenants"
          actions={
            <ActionButton onClick={() => setTenantModalOpen(true)} variant="subtle">
              <Plus className="w-4 h-4" />
              Crear cliente
            </ActionButton>
          }
        >
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

        <Section
          title="Campañas"
          actions={
            <ActionButton
              onClick={() => setCampaignModalOpen(true)}
              disabled={tenants.length === 0}
              variant="subtle"
            >
              <Plus className="w-4 h-4" />
              Crear campaña
            </ActionButton>
          }
        >
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

      {tenantModalOpen && (
        <Modal title="Crear cliente" onClose={closeTenantModal}>
          <form onSubmit={handleCrearTenant} className="p-5 space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm">
                {formError}
              </div>
            )}
            <Field label="Nombre">
              <input
                className={inputClass}
                value={tenantForm.nombre}
                onChange={(e) => setTenantForm((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre del cliente"
                autoFocus
              />
            </Field>
            <Field label="Estado">
              <select
                className={inputClass}
                value={tenantForm.estado}
                onChange={(e) => setTenantForm((prev) => ({ ...prev, estado: e.target.value }))}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <ActionButton onClick={closeTenantModal} variant="subtle">
                Cancelar
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                Crear cliente
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}

      {campaignModalOpen && (
        <Modal title="Crear campaña" onClose={closeCampaignModal}>
          <form onSubmit={handleCrearCampania} className="p-5 space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Cliente">
                <select
                  className={inputClass}
                  value={campaignForm.tenant_id}
                  onChange={(e) => updateCampaignForm("tenant_id", e.target.value)}
                  autoFocus
                >
                  <option value="">Seleccione cliente</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nombre">
                <input
                  className={inputClass}
                  value={campaignForm.nombre}
                  onChange={(e) => updateCampaignForm("nombre", e.target.value)}
                  placeholder="Nombre de campaña"
                />
              </Field>
              <Field label="Candidato">
                <input
                  className={inputClass}
                  value={campaignForm.candidato_nombre}
                  onChange={(e) => updateCampaignForm("candidato_nombre", e.target.value)}
                />
              </Field>
              <Field label="Cargo">
                <input
                  className={inputClass}
                  value={campaignForm.cargo}
                  onChange={(e) => updateCampaignForm("cargo", e.target.value)}
                />
              </Field>
              <Field label="Año">
                <input
                  className={inputClass}
                  type="number"
                  value={campaignForm.anio}
                  onChange={(e) => updateCampaignForm("anio", e.target.value)}
                />
              </Field>
              <Field label="Partido">
                <input
                  className={inputClass}
                  value={campaignForm.partido}
                  onChange={(e) => updateCampaignForm("partido", e.target.value)}
                />
              </Field>
              <Field label="Lista">
                <input
                  className={inputClass}
                  value={campaignForm.lista}
                  onChange={(e) => updateCampaignForm("lista", e.target.value)}
                />
              </Field>
              <Field label="Opción">
                <input
                  className={inputClass}
                  value={campaignForm.opcion}
                  onChange={(e) => updateCampaignForm("opcion", e.target.value)}
                />
              </Field>
              <Field label="Fecha elección">
                <input
                  className={inputClass}
                  type="date"
                  value={campaignForm.fecha_eleccion}
                  onChange={(e) => updateCampaignForm("fecha_eleccion", e.target.value)}
                />
              </Field>
              <Field label="Logo URL">
                <input
                  className={inputClass}
                  value={campaignForm.logo_url}
                  onChange={(e) => updateCampaignForm("logo_url", e.target.value)}
                />
              </Field>
              <Field label="Flyer URL">
                <input
                  className={inputClass}
                  value={campaignForm.flyer_url}
                  onChange={(e) => updateCampaignForm("flyer_url", e.target.value)}
                />
              </Field>
              <Field label="Color primario">
                <input
                  className={inputClass}
                  type="color"
                  value={campaignForm.color_primario}
                  onChange={(e) => updateCampaignForm("color_primario", e.target.value)}
                />
              </Field>
              <Field label="Color secundario">
                <input
                  className={inputClass}
                  type="color"
                  value={campaignForm.color_secundario}
                  onChange={(e) => updateCampaignForm("color_secundario", e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 pt-6">
                <input
                  type="checkbox"
                  checked={campaignForm.activa}
                  onChange={(e) => updateCampaignForm("activa", e.target.checked)}
                />
                Activa
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <ActionButton onClick={closeCampaignModal} variant="subtle">
                Cancelar
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                Crear campaña
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
