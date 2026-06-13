import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { CampaignProvider } from "./context/CampaignContext.jsx";
import "./tailwind.css";   // ← IMPORTANTE

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CampaignProvider>
      <App />
    </CampaignProvider>
  </React.StrictMode>
);
