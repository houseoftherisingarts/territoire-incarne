import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SiteEditProvider } from "./lib/siteEdit";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root element not found");

createRoot(container).render(
  <React.StrictMode>
    <SiteEditProvider>
      <App />
    </SiteEditProvider>
  </React.StrictMode>
);
