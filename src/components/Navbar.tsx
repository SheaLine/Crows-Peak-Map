import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconMap } from "../data/icons";
import { useRole } from "../RoleContext";

export default function Navbar() {
  const session = useSession();
  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      alert("Logout failed: " + error.message);
    }
  };

  const { isAdmin, loading } = useRole();
  if (loading) return null;

//   const handleImportEQ = async () => {
//   try {
//     // 1) Get GeoJSON from the admin (paste JSON)
//     const text = window.prompt(
//       "Paste a GeoJSON Feature or FeatureCollection for equipment points:"
//     );
//     if (!text) return;

//     // 2) Parse & basic validation
//     let payload: any;
//     try {
//       payload = JSON.parse(text);
//     } catch (e) {
//       alert("Not valid JSON.");
//       return;
//     }
//     const t = payload?.type;
//     if (t !== "Feature" && t !== "FeatureCollection") {
//       alert("Input must be a GeoJSON Feature or FeatureCollection.");
//       return;
//     }

//     // 3) Call your RPC — expects argument name `g` in the SQL function
//     const { data, error } = await supabase.rpc("import_equipment_geojson", {
//       g: payload,
//     });

//     if (error) {
//       console.error(error);
//       alert("Import failed: " + error.message);
//       return;
//     }

//     // `data` is an array of { inserted_id } rows (per the SQL function)
//     const count = Array.isArray(data) ? data.length : 0;
//     alert(`Imported ${count} equipment point(s).`);
//   } catch (err: any) {
//     console.error(err);
//     alert("Unexpected error: " + (err?.message ?? String(err)));
//   }
// };

  return (
    <nav className="w-full bg-white dark:border-gray-700 dark:bg-gray-700/40 border-b shadow-sm px-4 py-3 flex items-center justify-between">
      {/* Left: Logo + App Name */}
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="h-32 w-32" />
        <span className="text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
          Crow's Peak Equipment Map
        </span>
      </div>
      {/* {isAdmin && (
        <div className="flex items-center gap-2">
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-md text-md font-medium cursor-pointer"
            onClick={handleImportEQ}
          >
            Import Equipment
          </button>
        </div>
      )} */}

      {/* Right: User info + Logout */}
      <div className="flex items-center gap-4">
        {session && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xl text-gray-900 dark:text-white font-medium truncate max-w-[500px]">
              {(session.user?.email ? session.user.email : "") + (isAdmin ? " (Admin)" : "")}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="bg-[#2f6ea8] text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] px-6 py-3 rounded-md text-md font-medium cursor-pointer"
        >
          <span className="flex place-items-center">
            Logout <IconMap.LogOut className="ml-2 h-5 w-5" />
          </span>
        </button>
      </div>
    </nav>
  );
}
