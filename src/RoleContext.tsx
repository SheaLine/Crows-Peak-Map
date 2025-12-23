import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "./supabaseClient";
import type { UserAppMetadata } from "@supabase/supabase-js";

type RoleState = { isAdmin: boolean; loading: boolean };
const RoleContext = createContext<RoleState>({ isAdmin: false, loading: true });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const [state, setState] = useState<RoleState>({ isAdmin: false, loading: true });

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.id) { setState({ isAdmin: false, loading: false }); return; }
      const metaIsAdmin = (session.user.app_metadata as UserAppMetadata)?.is_admin === true;
      if (metaIsAdmin) { setState({ isAdmin: true, loading: false }); return; }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      setState({ isAdmin: data?.role === "admin", loading: false });
    };
    run();
  }, [session]);

  return <RoleContext.Provider value={state}>{children}</RoleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole() {
  return useContext(RoleContext);
}
