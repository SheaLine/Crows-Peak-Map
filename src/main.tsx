import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "./supabaseClient";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes.tsx";
import { RoleProvider } from "./RoleContext.tsx";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <RoleProvider>
        <RouterProvider router={router} />
      </RoleProvider>
    </SessionContextProvider>
  </StrictMode>
);
