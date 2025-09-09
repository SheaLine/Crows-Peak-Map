import "leaflet/dist/leaflet.css";
import Auth from "./components/Auth/Login";
import { useSession } from "@supabase/auth-helpers-react";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Map from "./components/Map/Map";
import EquipmentLayer from "./components/Map/EquipmentLayer";
import LineLayer from "./components/Map/LineLayer";
import PropertyBoundary from "./components/Map/PropertyBoundery";
import FilterPanel from "./components/Menu/FilterPanel";
import { supabase } from "./supabaseClient";
import type { Database } from "./types/supabase";

export type TypeRow = Database["public"]["Tables"]["types"]["Row"];

function App() {
  const session = useSession();
  const [filters, setFilters] = useState<number[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [showBoundary, setShowBoundary] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase.from("types").select("*");
      if (error) console.error("Error fetching types:", error.message);
      else setTypes(data || []);
    };
    fetchTypes();
  }, []);

  const typeMap = Object.fromEntries(
    types.map((t) => [t.id, { displayName: t.display_name, icon: t.icon || "📍", color: t.color || "gray" }])
  );

  if (!session) {
    return <Auth />;
  } else {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <FilterPanel filters={filters} setFilters={setFilters} types={types} search={search} setSearch={setSearch} showBoundary={showBoundary} setShowBoundary={setShowBoundary} />
          <Map>
            <EquipmentLayer filters={filters} typeMap={typeMap} search={search}/>
            <LineLayer  filters={filters} typeMap={typeMap} search={search}/>
            {showBoundary && <PropertyBoundary />}
          </Map>
        </div>
      </div>
    );
  }
}

export default App;
