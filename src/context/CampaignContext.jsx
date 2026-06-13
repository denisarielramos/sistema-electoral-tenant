import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  obtenerCampaniaActiva,
  obtenerModulosCampania,
} from "../services/campaniaService";

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [campaignError, setCampaignError] = useState(null);

  const reloadCampaign = useCallback(async () => {
    setLoadingCampaign(true);
    setCampaignError(null);

    try {
      const campaign = await obtenerCampaniaActiva();
      setCurrentCampaign(campaign);

      if (!campaign?.id) {
        setEnabledModules([]);
        return;
      }

      const modules = await obtenerModulosCampania(campaign.id);
      setEnabledModules(modules);
    } catch (error) {
      console.error("Error cargando campaña:", error);
      setCurrentCampaign(null);
      setEnabledModules([]);
      setCampaignError(error?.message || "No se pudo cargar la campaña activa.");
    } finally {
      setLoadingCampaign(false);
    }
  }, []);

  useEffect(() => {
    reloadCampaign();
  }, [reloadCampaign]);

  const moduleSet = useMemo(() => new Set(enabledModules), [enabledModules]);

  const hasModule = useCallback(
    (modulo) => moduleSet.has(modulo),
    [moduleSet]
  );

  const value = useMemo(
    () => ({
      currentCampaign,
      enabledModules,
      loadingCampaign,
      campaignError,
      hasModule,
      reloadCampaign,
    }),
    [
      currentCampaign,
      enabledModules,
      loadingCampaign,
      campaignError,
      hasModule,
      reloadCampaign,
    ]
  );

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign debe usarse dentro de CampaignProvider");
  }
  return context;
}
