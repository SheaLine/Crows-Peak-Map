import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "./supabaseClient";
import { RouterProvider } from 'react-router-dom';
import { router } from './routes.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <RouterProvider router={router} />
    </SessionContextProvider>
  </StrictMode>,
)
