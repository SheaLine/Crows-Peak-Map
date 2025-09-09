import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconMap } from "../data/icons";

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

  return (
    <nav className="w-full bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      {/* Left: Logo + App Name */}
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="h-32 w-32" />
        <span className="text-xl font-semibold text-gray-800 hidden sm:block">
          Crow's Peak Equipment Map
        </span>
      </div>

      {/* Right: User info + Logout */}
      <div className="flex items-center gap-4">
        {session && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xl text-gray-700 font-medium truncate max-w-[250px]">
              {session.user.email}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-md text-md font-medium cursor-pointer"
        >
          <span className="flex place-items-center">
            Logout <IconMap.LogOut className="ml-2 h-5 w-5" />
          </span>
        </button>
      </div>
    </nav>
  );
}
