// src/pages/NewUserCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function NewUserCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/complete-profile");
      }
    });

    return () => { sub?.subscription.unsubscribe(); };
  }, [navigate]);

  return <p>Link has expired</p>;
}
