import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { IconMap } from "../../data/icons";
import clsx from "clsx";

type TabId = "logs" | "gallery" | "summary" | "files";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: "logs", label: "Logs", icon: IconMap.list },
  { id: "gallery", label: "Gallery", icon: IconMap.image },
  { id: "summary", label: "Summary", icon: IconMap.document },
  { id: "files", label: "Files", icon: IconMap.attachment },
];

interface EquipmentTabsProps {
  children?: (activeTab: TabId) => React.ReactNode;
}

export default function EquipmentTabs({
  children,
}: EquipmentTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam || "logs");

  // Sync active tab with URL query params
  useEffect(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav
          className="-mb-px flex space-x-2 overflow-x-auto"
          aria-label="Equipment details tabs"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                onClick={() => handleTabChange(tab.id)}
                className={clsx(
                  "group inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[#2f6ea8] text-[#2f6ea8]"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5",
                    isActive
                      ? "text-[#2f6ea8]"
                      : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                  )}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {children?.(activeTab)}
      </div>
    </div>
  );
}
