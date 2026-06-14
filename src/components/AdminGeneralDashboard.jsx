import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Plus, RefreshCw, Shield, Users, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  crearCampania,
  crearSuperadminCliente,
  crearTenant,
  importarPadronCampania,
  listarCampaniaModulos,
  listarCampanias,
  listarModulos,
  listarPadronCisCampania,
  listarTenants,
  setModuloCampania,
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

const EMPTY_SUPERADMIN = {
  campania_id: "",
  nombre: "",
  apellido: "",
  email: "",
  username: "",
  password: "",
};

const PADRON_CSV_COLUMNS = [
  "ci",
  "nombre",
  "apellido",
  "localidad",
  "local_votacion",
  "seccional",
  "mesa",
  "orden",
  "direccion",
];

const EMPTY_IMPORT = {
  campania_id: "",
  file: null,
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parsePadronCsv = (text) => {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("El CSV debe tener encabezado y al menos una fila.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const missing = PADRON_CSV_COLUMNS.filter((column) => !headers.includes(column));

  if (missing.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missing.join(", ")}`);
  }

  const rows = [];
  const errors = [];
  const seen = new Set();

  lines.slice(1).forEach((line, index) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex]?.trim() || "";
    });

    const lineNumber = index + 2;
    const ci = Number(row.ci);
    if (!row.ci || !Number.isFinite(ci) || ci <= 0) {
      errors.push(`Fila ${lineNumber}: CI inválida.`);
      return;
    }

    if (seen.has(String(ci))) {
      errors.push(`Fila ${lineNumber}: CI duplicada dentro del CSV (${row.ci}).`);
      return;
    }

    seen.add(String(ci));
    rows.push({
      ...row,
      ci,
    });
  });

  return { rows, errors };
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
  const [savingModule, setSavingModule] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [superadminModalOpen, setSuperadminModalOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState({ nombre: "", estado: "activo" });
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);
  const [superadminForm, setSuperadminForm] = useState(EMPTY_SUPERADMIN);
  const [padronImport, setPadronImport] = useState(EMPTY_IMPORT);
  const [padronPreviewRows, setPadronPreviewRows] = useState([]);
  const [padronImportErrors, setPadronImportErrors] = useState([]);
  const [padronImportSummary, setPadronImportSummary] = useState(null);
  const [importingPadron, setImportingPadron] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        tenantsData,
        campaniasData,
        campaniaModulosData,
        modulosData,
        usuariosRes,
      ] = await Promise.all([
        listarTenants(),
        listarCampanias(),
        listarCampaniaModulos(),
        listarModulos(),
        supabase
          .from("usuarios_admin")
          .select("id,auth_user_id,campania_id,rol,nombre,apellido,email,username,activo,created_at")
          .order("rol", { ascending: true }),
      ]);

      const firstError = usuariosRes.error;

      if (firstError) throw firstError;

      setTenants(tenantsData);
      setCampanias(campaniasData);
      setCampaniaModulos(campaniaModulosData);
      setModulos(modulosData);
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

  const enabledModulesByCampaign = useMemo(() => {
    const map = new Map();
    campaniaModulos
      .filter((item) => item.habilitado)
      .forEach((item) => {
        const set = map.get(item.campania_id) || new Set();
        set.add(item.modulo);
        map.set(item.campania_id, set);
      });
    return map;
  }, [campaniaModulos]);

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

  const closeSuperadminModal = () => {
    setSuperadminModalOpen(false);
    setSuperadminForm(EMPTY_SUPERADMIN);
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
      setFormError("No se puede crear una campaña sin cliente / responsable y nombre.");
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

  const updateSuperadminForm = (field, value) => {
    setSuperadminForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCrearSuperadmin = async (event) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const nombre = superadminForm.nombre.trim();
    const username = superadminForm.username.trim();
    const password = superadminForm.password.trim();

    if (!superadminForm.campania_id || !nombre || !username || !password) {
      setFormError("Campaña, nombre, usuario y contraseña son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      await crearSuperadminCliente({
        campania_id: superadminForm.campania_id,
        nombre,
        apellido: superadminForm.apellido.trim(),
        email: superadminForm.email.trim(),
        username,
        password_hash: password,
      });
      closeSuperadminModal();
      setSuccessMessage("Superadmin de cliente creado correctamente. La contraseña se guardó como demo en password_hash.");
      await cargarDatos();
    } catch (err) {
      console.error("Error creando superadmin de cliente:", err);
      setFormError(err?.message || "No se pudo crear el superadmin de cliente.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModulo = async (campaniaId, modulo, habilitado) => {
    const savingKey = `${campaniaId}:${modulo}`;
    setSavingModule(savingKey);
    setError(null);

    try {
      const updated = await setModuloCampania(campaniaId, modulo, habilitado);
      setCampaniaModulos((prev) => {
        const withoutCurrent = prev.filter(
          (item) => !(item.campania_id === campaniaId && item.modulo === modulo)
        );
        return [...withoutCurrent, updated];
      });
    } catch (err) {
      console.error("Error actualizando módulo de campaña:", err);
      setError(err?.message || "No se pudo actualizar el módulo de la campaña.");
    } finally {
      setSavingModule(null);
    }
  };

  const updatePadronImport = (field, value) => {
    setPadronImport((prev) => ({ ...prev, [field]: value }));
    setPadronPreviewRows([]);
    setPadronImportErrors([]);
    setPadronImportSummary(null);
  };

  const handlePreviewPadron = async () => {
    setPadronImportErrors([]);
    setPadronImportSummary(null);
    setSuccessMessage(null);

    if (!padronImport.campania_id) {
      setPadronImportErrors(["Debe seleccionar una campaña."]);
      return;
    }

    if (!padronImport.file) {
      setPadronImportErrors(["Debe seleccionar un archivo CSV."]);
      return;
    }

    try {
      const text = await padronImport.file.text();
      const { rows, errors } = parsePadronCsv(text);
      setPadronPreviewRows(rows);
      setPadronImportErrors(errors);
      setPadronImportSummary({
        total: rows.length,
        inserted: 0,
        updated: 0,
        imported: false,
      });
    } catch (err) {
      setPadronPreviewRows([]);
      setPadronImportErrors([err?.message || "No se pudo leer el CSV."]);
    }
  };

  const handleImportPadron = async () => {
    setPadronImportErrors([]);
    setSuccessMessage(null);

    if (!padronImport.campania_id) {
      setPadronImportErrors(["Debe seleccionar una campaña."]);
      return;
    }

    if (!padronPreviewRows.length) {
      setPadronImportErrors(["Debe previsualizar un CSV válido antes de importar."]);
      return;
    }

    if (padronImportErrors.length > 0) {
      setPadronImportErrors((prev) => [
        ...prev,
        "Corrija los errores del CSV antes de importar.",
      ]);
      return;
    }

    setImportingPadron(true);
    try {
      const existingCis = await listarPadronCisCampania(
        padronImport.campania_id,
        padronPreviewRows.map((row) => row.ci)
      );
      const existingSet = new Set(existingCis.map(String));
      const updated = padronPreviewRows.filter((row) => existingSet.has(String(row.ci))).length;
      const inserted = padronPreviewRows.length - updated;

      const imported = await importarPadronCampania(
        padronImport.campania_id,
        padronPreviewRows
      );

      setPadronImportSummary({
        total: imported.length,
        inserted,
        updated,
        imported: true,
      });
      setSuccessMessage(`Padrón importado: ${inserted} nuevos y ${updated} actualizados.`);
    } catch (err) {
      console.error("Error importando padrón:", err);
      setPadronImportErrors([err?.message || "No se pudo importar el padrón."]);
    } finally {
      setImportingPadron(false);
    }
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

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
            {successMessage}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm font-semibold text-brand-700 shadow-card">
            Cargando datos de administración...
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <ActionButton
            onClick={() => setCampaignModalOpen(true)}
            disabled={tenants.length === 0}
          >
            <Plus className="w-4 h-4" />
            Crear campaña
          </ActionButton>
          <ActionButton onClick={() => setTenantModalOpen(true)} variant="subtle">
            <Plus className="w-4 h-4" />
            Crear cliente / responsable
          </ActionButton>
          <ActionButton
            onClick={() => setSuperadminModalOpen(true)}
            disabled={campanias.length === 0}
            variant="subtle"
          >
            <Plus className="w-4 h-4" />
            Crear superadmin
          </ActionButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-500">Campañas</p>
            <p className="text-3xl font-bold text-slate-800">{campanias.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-slate-500">Clientes</p>
            <p className="text-3xl font-bold text-slate-800">{tenants.length}</p>
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
                        Cliente / responsable: {tenantById.get(campania.tenant_id)?.nombre || campania.tenant_id || "sin cliente"}
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

        <Section
          title="Clientes / Responsables"
          actions={
            <ActionButton onClick={() => setTenantModalOpen(true)} variant="subtle">
              <Plus className="w-4 h-4" />
              Crear cliente / responsable
            </ActionButton>
          }
        >
          {tenants.length === 0 ? (
            <EmptyState text="No hay clientes/responsables cargados." />
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

        <Section title="Importar padrón por campaña">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Campaña">
                <select
                  className={inputClass}
                  value={padronImport.campania_id}
                  onChange={(event) => updatePadronImport("campania_id", event.target.value)}
                >
                  <option value="">Seleccione campaña</option>
                  {campanias.map((campania) => (
                    <option key={campania.id} value={campania.id}>
                      {campania.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Archivo CSV">
                <input
                  className={inputClass}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => updatePadronImport("file", event.target.files?.[0] || null)}
                />
              </Field>
              <div className="flex items-end gap-2">
                <ActionButton
                  onClick={handlePreviewPadron}
                  disabled={importingPadron || campanias.length === 0}
                  variant="subtle"
                >
                  Previsualizar
                </ActionButton>
                <ActionButton
                  onClick={handleImportPadron}
                  disabled={importingPadron || padronPreviewRows.length === 0 || padronImportErrors.length > 0}
                >
                  {importingPadron ? "Importando..." : "Importar"}
                </ActionButton>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              Formato esperado: ci,nombre,apellido,localidad,local_votacion,seccional,mesa,orden,direccion.
              Archivo demo: <a className="text-brand-700 font-semibold" href="/demo-padron.csv" target="_blank" rel="noreferrer">demo-padron.csv</a>
            </div>

            {padronImportErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm space-y-1">
                {padronImportErrors.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}

            {padronImportSummary && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-sm">
                {padronImportSummary.imported ? (
                  <span>
                    Procesados: {padronImportSummary.total}. Nuevos: {padronImportSummary.inserted}. Actualizados: {padronImportSummary.updated}.
                  </span>
                ) : (
                  <span>Total válido para previsualizar: {padronImportSummary.total} registros.</span>
                )}
              </div>
            )}

            {padronPreviewRows.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {PADRON_CSV_COLUMNS.map((column) => (
                        <th key={column} className="px-3 py-2 text-left font-semibold">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {padronPreviewRows.slice(0, 10).map((row) => (
                      <tr key={row.ci} className="bg-white">
                        {PADRON_CSV_COLUMNS.map((column) => (
                          <td key={column} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                            {row[column] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Section>

        <Section title="Módulos por campaña">
          {campanias.length === 0 ? (
            <EmptyState text="No hay campañas para configurar módulos." />
          ) : modulos.length === 0 ? (
            <EmptyState text="No hay módulos disponibles." />
          ) : (
            <div className="space-y-3">
              {campanias.map((campania) => {
                const enabledModules = enabledModulesByCampaign.get(campania.id) || new Set();
                return (
                  <div key={campania.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="text-sm font-semibold text-slate-800">{campania.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {enabledModules.size} de {modulos.length} módulos activos
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mt-3">
                      {modulos.map((modulo) => {
                        const checked = enabledModules.has(modulo.key);
                        const savingKey = `${campania.id}:${modulo.key}`;
                        const isSaving = savingModule === savingKey;

                        return (
                          <label
                            key={modulo.key}
                            className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                              checked
                                ? "border-brand-200 bg-brand-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            } ${isSaving ? "opacity-60" : ""}`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              checked={checked}
                              disabled={Boolean(savingModule)}
                              onChange={(event) =>
                                handleToggleModulo(campania.id, modulo.key, event.target.checked)
                              }
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-800">
                                {modulo.nombre || modulo.key}
                              </span>
                              <span className="block text-xs text-slate-500 break-words">
                                {modulo.descripcion || modulo.key}
                              </span>
                              <span className={`inline-flex mt-2 text-xs font-semibold px-2 py-0.5 rounded-md ${
                                checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                              }`}>
                                {checked ? "Activo" : "Inactivo"}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section
          title="Usuarios admin"
          actions={
            <ActionButton
              onClick={() => setSuperadminModalOpen(true)}
              disabled={campanias.length === 0}
              variant="subtle"
            >
              <Plus className="w-4 h-4" />
              Crear superadmin
            </ActionButton>
          }
        >
          {usuariosAdmin.length === 0 ? (
            <EmptyState text="No hay usuarios admin cargados." />
          ) : (
            <div className="space-y-2">
              {usuariosAdmin.map((usuario) => (
                <div key={usuario.id} className="border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                    <Users className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {[usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || "Sin nombre"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {usuario.username || "sin username"} · {usuario.rol}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Campaña: {usuario.campania_id ? (campanias.find((c) => c.id === usuario.campania_id)?.nombre || usuario.campania_id) : "Todas"}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md self-start sm:self-center ${usuario.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </main>

      {tenantModalOpen && (
        <Modal title="Crear cliente / responsable" onClose={closeTenantModal}>
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
                placeholder="Nombre del cliente o responsable"
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
                Crear cliente / responsable
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}

      {superadminModalOpen && (
        <Modal title="Crear superadmin de cliente" onClose={closeSuperadminModal}>
          <form onSubmit={handleCrearSuperadmin} className="p-5 space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm">
                {formError}
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-xs">
              Demo: la contraseña se guarda en password_hash sin hashing real. Antes de producción debe migrarse a Supabase Auth o hashing seguro.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Campaña">
                <select
                  className={inputClass}
                  value={superadminForm.campania_id}
                  onChange={(e) => updateSuperadminForm("campania_id", e.target.value)}
                  autoFocus
                >
                  <option value="">Seleccione campaña</option>
                  {campanias.map((campania) => (
                    <option key={campania.id} value={campania.id}>
                      {campania.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nombre">
                <input
                  className={inputClass}
                  value={superadminForm.nombre}
                  onChange={(e) => updateSuperadminForm("nombre", e.target.value)}
                  placeholder="Nombre"
                />
              </Field>
              <Field label="Apellido">
                <input
                  className={inputClass}
                  value={superadminForm.apellido}
                  onChange={(e) => updateSuperadminForm("apellido", e.target.value)}
                  placeholder="Apellido"
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputClass}
                  type="email"
                  value={superadminForm.email}
                  onChange={(e) => updateSuperadminForm("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </Field>
              <Field label="Usuario">
                <input
                  className={inputClass}
                  value={superadminForm.username}
                  onChange={(e) => updateSuperadminForm("username", e.target.value)}
                  placeholder="usuario"
                />
              </Field>
              <Field label="Contraseña">
                <input
                  className={inputClass}
                  type="password"
                  value={superadminForm.password}
                  onChange={(e) => updateSuperadminForm("password", e.target.value)}
                  placeholder="Contraseña demo"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <ActionButton onClick={closeSuperadminModal} variant="subtle">
                Cancelar
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                Crear superadmin
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
              <Field label="Cliente / responsable">
                <select
                  className={inputClass}
                  value={campaignForm.tenant_id}
                  onChange={(e) => updateCampaignForm("tenant_id", e.target.value)}
                  autoFocus
                >
                  <option value="">Seleccione cliente / responsable</option>
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
