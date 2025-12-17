import { IconMap } from "../../data/icons";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type Props = {
  isMobile: boolean;
  title: string; // e.g. "Equipment Details"
  subtitle?: string; // e.g. "Main Water Pump System"
  onBack?: () => void;
  onEdit?: () => void;
  onCancel?: () => void; // NEW: called when cancel button clicked
  showEdit?: boolean;
  editMode?: boolean; // NEW: whether edit mode is active
  /** Tailor the inner container width to match your page content */
  maxWidthClass?: string; // e.g. "max-w-6xl" | "max-w-7xl"
  /** Optional styling hook for the gray bar */
  barClassName?: string; // extra classes for the outer header
};

export const EquipmentNavbar: React.FC<Props> = ({
  title,
  subtitle,
  onEdit,
  onCancel,
  showEdit = true,
  editMode = false,
  maxWidthClass = "max-w-6xl",
  barClassName = "",
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // check if device is a mobile device
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // Desktop threshold: 1024px (Tailwind lg)
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const update = () => setIsMobile(mq.matches);

    update(); // set initial value
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
  }, []);
  const navigate = useNavigate();
  const handleBack = () => {
    try {
      // Use replace: true to force React Router to unmount current component and mount new one
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to window.location if navigate fails
      window.location.href = "/";
    }
  };
  return (
    <header
      className={[
        // gray strip behind the header (light/dark aware)
        "w-full border-b border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700/40",
        barClassName,
      ].join(" ")}
      role="banner"
    >
      <div
        className={[
          "mx-auto grid grid-cols-3 items-center gap-3 px-4 py-2 sm:px-6",
          maxWidthClass,
        ].join(" ")}
      >
        {/* Left: Back */}
        <div className="justify-self-start">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-600"
          >
            <IconMap.back className="text-[#2f6ea8] h-10 w-10" />
          </button>
        </div>

        {/* Center: Title/Sub */}
        <div className="min-w-0 text-center justify-self-center">
          <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-gray-500 dark:text-white">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Right: Edit / Save+Cancel Buttons */}
        <div className="justify-self-end flex gap-2">
          {showEdit && !editMode && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 transition-colors bg-[#2f6ea8] text-white focus:ring-[#2f6ea8]"
            >
              <IconMap.edit className="h-5 w-5" />
              {!isMobile && <span>Edit</span>}
            </button>
          )}
          {showEdit && editMode && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 transition-colors bg-gray-600 text-white focus:ring-gray-600"
              >
                <IconMap.X className="h-5 w-5" />
                {!isMobile && <span>Cancel</span>}
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 transition-colors bg-green-600 text-white focus:ring-green-600"
              >
                <IconMap.save className="h-5 w-5" />
                {!isMobile && <span>Save</span>}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
