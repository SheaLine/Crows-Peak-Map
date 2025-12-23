import "leaflet/dist/leaflet.css";
import Auth from "./components/Auth/Login";
import { useSession } from "@supabase/auth-helpers-react";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Map from "./components/Map/Map";
import EquipmentLayer from "./components/Map/EquipmentLayer";
import LineLayer from "./components/Map/LineLayer";
import PropertyBoundary from "./components/Map/PropertyBoundery";
import BuildingsLayer from "./components/Map/Buildings";
import FilterPanel from "./components/Menu/FilterPanel";
import { supabase } from "./supabaseClient";
import type { Database } from "./types/supabase";
import { useNavigate } from "react-router-dom";

export type TypeRow = Database["public"]["Tables"]["types"]["Row"];

function App() {
  const session = useSession();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<number[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate("/", { replace: true });
      if (event === "SIGNED_OUT") navigate("/login", { replace: true });
    });
    return () => sub?.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase.from("types").select("*");
      if (error) console.error("Error fetching types:", error.message);
      else setTypes(data || []);
    };
    fetchTypes();
  }, []);

  const typeMap = Object.fromEntries(
    types.map((t) => [
      t.id,
      {
        displayName: t.display_name,
        icon: t.icon || "📍",
        color: t.color || "gray",
      },
    ])
  );

  if (!session) {
    return <Auth />;
  } else {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            types={types}
            search={search}
            setSearch={setSearch}
            showBuildings={showBuildings}
            setShowBuildings={setShowBuildings}
            showBoundary={showBoundary}
            setShowBoundary={setShowBoundary}
          />
          <Map>
            <EquipmentLayer
              filters={filters}
              typeMap={typeMap}
              search={search}
            />
            <LineLayer filters={filters} typeMap={typeMap} search={search} />
            {showBoundary && <PropertyBoundary />}
            {showBuildings && <BuildingsLayer />}
          </Map>
        </div>
      </div>
    );
  }
}

export default App;
