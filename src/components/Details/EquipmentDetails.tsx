import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import type { Database } from "../../types/supabase";
import { supabase } from "../../supabaseClient";

type EquipmentDetails = Database["public"]["Views"]["equipment_details"]["Row"];

export default function EquipmentDetails() {
  const { id } = useParams<{ id: string }>();
  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchEquipmentDetails = async () => {
      const { data, error } = await supabase
        .from("equipment_details")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching equipment: ", error.message);
      } else {
        setEquipment(data as EquipmentDetails);
      }
    };
    fetchEquipmentDetails();
  }, [id]);
  if (!equipment) return <p>No equipment found</p>;
  return (
    <div className="p-6 space-y-3">
    <h1 className="text-xl font-bold">{equipment.name ?? "—"}</h1>

    {/* Raw JSON of the entire record */}
    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-md overflow-auto max-h-[60vh] whitespace-pre">
      {JSON.stringify(equipment, null, 2)}
    </pre>
  </div>
  );
}
