// ======================= APP SISTEMA ELECTORAL =======================
// App maneja SOLO sesión/login.
// Dashboard maneja TODO lo demás.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import AdminGeneralDashboard from "./components/AdminGeneralDashboard";
import Dashboard from "./components/Dashboard";
import { useCampaign } from "./context/CampaignContext";
import { normalizeCI } from "./utils/estructuraHelpers";

// ======================= SUPERADMINS LOCALES =======================
const SUPERADMINS = [
  {
    ci: "dramos",
    pass: "16052018",
    nombre: "Denis",
    apellido: "Ramos",
  },
  {
    ci: "3641845",
    pass: "j.gomez",
    nombre: "José",
    apellido: "Gomez",
  },
];

const buildAdminUser = (adminUser, authProvider = null) => {
  const isAdminGeneral = adminUser.rol === "admin_general";
  const isSuperadminCliente = adminUser.rol === "superadmin_cliente";

  return {
    ci: adminUser.username,
    id: adminUser.id,
    auth_user_id: adminUser.auth_user_id || null,
    username: adminUser.username,
    nombre: adminUser.nombre || "",
    apellido: adminUser.apellido || "",
    email: adminUser.email || "",
    role: isSuperadminCliente ? "superadmin" : adminUser.rol,
    rol: adminUser.rol,
    campania_id: adminUser.campania_id,
    esAdminGeneral: isAdminGeneral,
    esSuperadminCliente: isSuperadminCliente,
    authProvider: authProvider || (adminUser.auth_user_id ? "supabase" : "legacy"),
  };
};

const App = () => {
  const {
    currentCampaign,
    loadingCampaign,
    campaignError,
    reloadCampaign,
  } = useCampaign();

  const isAdminRoute = window.location.pathname.startsWith("/admin");

  // ======================= SESIÓN =======================
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ======================= SESIÓN PERSISTENTE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (!saved) return;
    try {
      const u = JSON.parse(saved);
      if (u && (u.ci || u.username) && u.role) setCurrentUser(u);
    } catch (e) {
      console.error("Error leyendo sesión local:", e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreAuthSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error obteniendo sesion Auth:", error);

        const authUserId = data?.session?.user?.id;
        if (authUserId) {
          const adminUser = await getAdminProfileByAuthUserId(authUserId);
          if (adminUser && isMounted) {
            const u = buildAdminUser(adminUser, "supabase");
            setCurrentUser(u);
            localStorage.setItem("currentUser", JSON.stringify(u));
            return;
          }
          await supabase.auth.signOut();
        }

        const saved = localStorage.getItem("currentUser");
        if (!saved) return;

        const u = JSON.parse(saved);
        const isOperativeUser =
          u?.role === "coordinador" || u?.role === "subcoordinador";
        if (!isOperativeUser) {
          localStorage.removeItem("currentUser");
          if (isMounted) setCurrentUser(null);
        }
      } catch (e) {
        console.error("Error restaurando sesion Auth:", e);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    };

    restoreAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAdminRoute || !currentUser?.campania_id) return;
    reloadCampaign(currentUser.campania_id);
  }, [currentUser?.campania_id, isAdminRoute, reloadCampaign]);

  const getAdminProfileByAuthUserId = async (authUserId) => {
    if (!authUserId) return null;

    const { data, error } = await supabase
      .from("usuarios_admin")
      .select("*")
      .eq("auth_user_id", authUserId)
      .eq("activo", true)
      .maybeSingle();

    if (error) console.error("Error obteniendo perfil admin Auth:", error);
    return data || null;
  };

  const getAdminProfileByIdentifier = async (identifier) => {
    const value = identifier.trim();
    if (!value) return null;

    const field = value.includes("@") ? "email" : "username";
    const { data, error } = await supabase
      .from("usuarios_admin")
      .select("*")
      .eq(field, value)
      .eq("activo", true)
      .maybeSingle();

    if (error) console.error("Error obteniendo usuario admin:", error);
    return data || null;
  };

  const loginAdminUserWithAuth = async (identifier) => {
    if (!loginPass) return null;

    const value = identifier.trim();
    let email = value.includes("@") ? value : "";

    if (!email) {
      const adminByUsername = await getAdminProfileByIdentifier(value);
      if (!adminByUsername?.email) return null;
      email = adminByUsername.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPass,
    });

    if (error) {
      console.warn("Supabase Auth no pudo iniciar sesion admin:", error.message);
      return null;
    }

    const adminUser = await getAdminProfileByAuthUserId(data?.user?.id);

    if (!adminUser) {
      await supabase.auth.signOut();
      console.warn("Usuario Auth sin perfil activo en usuarios_admin.");
      return null;
    }

    return buildAdminUser(adminUser, "supabase");
  };

  const loginAdminUser = async (code) => {
    const adminUser = await getAdminProfileByIdentifier(code);
    if (!adminUser) return null;

    if (loginPass !== adminUser.password_hash) {
      alert("Contraseña incorrecta.");
      return "handled";
    }

    return buildAdminUser(adminUser, "legacy");
  };

  const obtenerPersonaPadron = async (ci, campaniaId) => {
    if (!ci || !campaniaId) return null;

    const { data, error } = await supabase
      .from("padron")
      .select("*")
      .eq("ci", normalizeCI(ci))
      .eq("campania_id", campaniaId)
      .maybeSingle();

    if (error) console.error("Error obteniendo persona de padrón:", error);
    return data || null;
  };

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    const code = loginID.trim();
    if (!code) return alert(isAdminRoute ? "Ingrese usuario." : "Ingrese usuario o código.");

    setIsLogging(true);

    try {
      // ======================= RUTA ADMIN =======================
      if (isAdminRoute) {
        if (!loginPass) return alert("Ingrese contraseña.");

        const authLogin = await loginAdminUserWithAuth(code);
        const adminLogin = authLogin || await loginAdminUser(code);
        if (adminLogin === "handled") return;

        if (!adminLogin || adminLogin.rol !== "admin_general") {
          if (authLogin?.authProvider === "supabase") await supabase.auth.signOut();
          alert("Este acceso es solo para Admin General.");
          return;
        }

        setCurrentUser(adminLogin);
        localStorage.setItem("currentUser", JSON.stringify(adminLogin));
        return;
      }

      // ======================= USUARIOS ADMIN CLIENTE (DEMO) =======================
      if (loginPass) {
        const authLogin = await loginAdminUserWithAuth(code);
        const adminLogin = authLogin || await loginAdminUser(code);
        if (adminLogin === "handled") return;

        if (adminLogin) {
          if (adminLogin.esAdminGeneral) {
            if (authLogin?.authProvider === "supabase") await supabase.auth.signOut();
            alert("El Admin General debe ingresar desde /admin");
            return;
          }

          if (adminLogin.campania_id) {
            await reloadCampaign(adminLogin.campania_id);
          }
          setCurrentUser(adminLogin);
          localStorage.setItem("currentUser", JSON.stringify(adminLogin));
          return;
        }
      }

      // ======================= SUPERADMIN LOCAL =======================
      const superadmin = SUPERADMINS.find((s) => s.ci === code);

      if (superadmin) {
        if (loginPass !== superadmin.pass) {
          alert("Contraseña incorrecta.");
          return;
        }
        const u = {
          ci: superadmin.ci,
          username: superadmin.ci,
          nombre: superadmin.nombre,
          apellido: superadmin.apellido,
          role: "superadmin",
          rol: "superadmin_local",
          campania_id: currentCampaign?.id || null,
          esAdminGeneral: false,
          esSuperadminCliente: false,
        };
        if (u.campania_id) {
          await reloadCampaign(u.campania_id);
        }
        setCurrentUser(u);
        localStorage.setItem("currentUser", JSON.stringify(u));
        return;
      }

      // ======================= COORDINADOR =======================
      const { data: coord, error: coordErr } = await supabase
        .from("coordinadores")
        .select("ci,login_code,telefono,campania_id")
        .eq("login_code", code)
        .maybeSingle();

      if (coordErr) console.error("Error login coord:", coordErr);

      const coordPadron = await obtenerPersonaPadron(coord?.ci, coord?.campania_id);

      if (coord && coordPadron) {
        const u = {
          ci: normalizeCI(coord.ci),
          username: normalizeCI(coord.ci),
          nombre: coordPadron.nombre,
          apellido: coordPadron.apellido,
          telefono: coord.telefono || "",
          role: "coordinador",
          rol: "coordinador",
          campania_id: coord.campania_id || currentCampaign?.id || null,
          esAdminGeneral: false,
          esSuperadminCliente: false,
        };
        if (u.campania_id) {
          await reloadCampaign(u.campania_id);
        }
        setCurrentUser(u);
        localStorage.setItem("currentUser", JSON.stringify(u));
        return;
      }

      // ======================= SUBCOORDINADOR =======================
      const { data: sub, error: subErr } = await supabase
        .from("subcoordinadores")
        .select("ci,login_code,telefono,coordinador_ci,campania_id")
        .eq("login_code", code)
        .maybeSingle();

      if (subErr) console.error("Error login sub:", subErr);

      const subPadron = await obtenerPersonaPadron(sub?.ci, sub?.campania_id);

      if (sub && subPadron) {
        const u = {
          ci: normalizeCI(sub.ci),
          username: normalizeCI(sub.ci),
          nombre: subPadron.nombre,
          apellido: subPadron.apellido,
          telefono: sub.telefono || "",
          role: "subcoordinador",
          rol: "subcoordinador",
          campania_id: sub.campania_id || currentCampaign?.id || null,
          esAdminGeneral: false,
          esSuperadminCliente: false,
        };
        if (u.campania_id) {
          await reloadCampaign(u.campania_id);
        }
        setCurrentUser(u);
        localStorage.setItem("currentUser", JSON.stringify(u));
        return;
      }

      alert("Usuario no encontrado.");
    } finally {
      setIsLogging(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const handleLogout = async () => {
    if (currentUser?.authProvider === "supabase" || currentUser?.auth_user_id) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setLoginID("");
    setLoginPass("");
  };

  const campaignTitle = currentCampaign?.nombre || "Sistema Electoral";
  const campaignSubtitle = currentCampaign
    ? [
        currentCampaign.candidato_nombre,
        currentCampaign.cargo,
        currentCampaign.anio,
      ].filter(Boolean).join(" - ")
    : "Gestión de Votantes";
  const campaignOption = currentCampaign
    ? [currentCampaign.lista, currentCampaign.opcion].filter(Boolean).join(" - ")
    : "";

  if (checkingAuth || (!isAdminRoute && loadingCampaign)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-card text-sm font-semibold text-brand-700">
          {checkingAuth ? "Verificando sesion..." : "Cargando campaña..."}
        </div>
      </div>
    );
  }

  if (!isAdminRoute && (campaignError || !currentCampaign)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-card max-w-md text-center">
          <p className="text-sm font-semibold text-slate-800">
            No hay campaña activa configurada.
          </p>
          {campaignError && (
            <p className="text-xs text-slate-500 mt-1">{campaignError}</p>
          )}
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  if (currentUser) {
    if (isAdminRoute) {
      if (currentUser.esAdminGeneral) {
        return (
          <AdminGeneralDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      }

      return (
        <AccessMessage
          title="Este acceso es solo para Admin General."
          detail="Cerrá esta sesión o volvé al acceso de campaña."
          onLogout={handleLogout}
        />
      );
    }

    if (currentUser.esAdminGeneral) {
      return (
        <AccessMessage
          title="El Admin General debe ingresar desde /admin"
          detail="Cerrá esta sesión para ingresar con un usuario de campaña."
          onLogout={handleLogout}
        />
      );
    }

    return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  const loginTitle = isAdminRoute ? "Admin General" : "Sistema Electoral";
  const loginSubtitle = isAdminRoute
    ? "Acceso administrativo de plataforma"
    : "Acceso de campaña";
  const loginDetail = isAdminRoute
    ? ""
    : [campaignTitle, campaignSubtitle, campaignOption].filter(Boolean).join(" · ");

  // ======================= LOGIN VIEW =======================
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-100 opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-50 opacity-60" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
          <div className="bg-brand-700 px-8 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-full mb-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {loginTitle}
            </h1>
            <p className="text-brand-200 text-sm mt-1">
              {loginSubtitle}
            </p>
            {loginDetail && (
              <p className="text-brand-100 text-xs mt-1">
                {loginDetail}
              </p>
            )}
          </div>

          <div className="px-8 py-7 space-y-5">
            <div>
              <label
                htmlFor="loginID"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {isAdminRoute ? "Usuario" : "Código de acceso o usuario de cliente"}
              </label>
              <input
                id="loginID"
                type="text"
                value={loginID}
                onChange={(e) => setLoginID(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                placeholder={isAdminRoute ? "admin" : "Ej: COORD-DEMO"}
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="loginPass"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="loginPass"
                  type={showPass ? "text" : "password"}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2.5 pr-11 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                  placeholder={isAdminRoute ? "Contraseña admin" : "Solo para usuarios de cliente"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0 border-0 bg-transparent shadow-none"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLogging}
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isLogging ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>

          <div className="px-8 pb-7">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700 mb-2">Instrucciones</p>
              {isAdminRoute ? (
                <ol className="list-decimal ml-4 space-y-1 leading-relaxed">
                  <li>Use el usuario y contraseña de Admin General.</li>
                  <li>Los accesos de campaña no ingresan desde esta ruta.</li>
                </ol>
              ) : (
                <ol className="list-decimal ml-4 space-y-1 leading-relaxed">
                  <li>Ingrese código de coordinador/subcoordinador o usuario de cliente.</li>
                  <li>Coordinadores y subcoordinadores pueden dejar la contraseña vacía.</li>
                  <li>El Admin General debe ingresar desde /admin.</li>
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function AccessMessage({ title, detail, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-5 shadow-card max-w-md text-center">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {detail && <p className="text-xs text-slate-500 mt-1">{detail}</p>}
        <button
          onClick={onLogout}
          className="mt-4 h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold border-0"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default App;
