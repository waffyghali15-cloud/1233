/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  Wrench, 
  Settings, 
  Wallet, 
  Menu, 
  X, 
  TrendingUp,
  Smartphone,
  ShieldCheck,
  RotateCcw
} from "lucide-react";

import { DatabaseState, AccountType, MaintenanceStatus } from "./types/accounting";
import { getDatabase } from "./utils/storage";

// Sub-components
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Invoices from "./components/Invoices";
import Accounts from "./components/Accounts";
import Maintenance from "./components/Maintenance";
import BackupSettings from "./components/BackupSettings";

export default function App() {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [navigationExtraData, setNavigationExtraData] = useState<any>(null);

  // Load database state
  const loadDb = () => {
    const data = getDatabase();
    setDb(data);
  };

  useEffect(() => {
    loadDb();
  }, []);

  // Handle cross-tab navigation and payload transmission
  const handleNavigate = (tab: string, extraData?: any) => {
    setActiveTab(tab);
    if (extraData) {
      setNavigationExtraData(extraData);
    } else {
      setNavigationExtraData(null);
    }
    setSidebarOpen(false); // Close drawer on mobile
  };

  // Consume extra data once used by child components
  const clearNavigationExtraData = () => {
    setNavigationExtraData(null);
  };

  if (!db) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
        <RotateCcw className="w-8 h-8 text-emerald-600 animate-spin" />
        <span>جاري تحميل دفاتر الأمين للمحاسبة...</span>
      </div>
    );
  }

  // Live indicators for Header HUD
  const safeAccount = db.accounts.find(a => a.type === AccountType.SAFE);
  const totalCash = safeAccount ? safeAccount.currentBalance : 0;
  
  const activeRepairsCount = db.maintenance.filter(
    m => m.status === MaintenanceStatus.PENDING || 
         m.status === MaintenanceStatus.IN_PROGRESS || 
         m.status === MaintenanceStatus.READY
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" dir="rtl" id="app-root">
      
      {/* Top HUD bar */}
      <header className="bg-white border-b border-slate-150 h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs print:hidden">
        {/* Toggle + Shop Info */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-150 rounded-lg lg:hidden cursor-pointer text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-emerald-800 text-white p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-800 text-xs md:text-sm">{db.settings.storeName}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold mr-2 hidden sm:inline-block border border-emerald-100">
                الأمين الذكي v4.2
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Business KPI Pillboxes */}
        <div className="flex items-center gap-3">
          {/* Active repairs count */}
          <div className="bg-teal-50 border border-teal-100/55 rounded-xl px-3 py-1.5 flex items-center gap-2 text-teal-900 text-xs hidden sm:flex font-semibold">
            <Wrench className="w-4 h-4 text-teal-600" />
            <span>الصيانة الحالية:</span>
            <span className="font-mono bg-teal-600 text-white px-2 py-0.5 rounded text-[10px] font-black">{activeRepairsCount}</span>
          </div>

          {/* Cash safe value indicator */}
          <div className="bg-emerald-50 border border-emerald-100/55 rounded-xl px-3 py-1.5 flex items-center gap-2 text-emerald-900 text-xs font-semibold">
            <Wallet className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>الصندوق الكاش:</span>
            <span className="font-mono font-black text-emerald-800">{totalCash.toLocaleString()} {db.settings.currency}</span>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex flex-1 relative">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className={`bg-slate-900 text-slate-300 w-64 border-l border-slate-800 shrink-0 flex flex-col justify-between fixed lg:static inset-y-0 right-0 z-50 transform lg:transform-none transition-transform duration-300 print:hidden ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}>
          {/* Navigation Links */}
          <div className="flex flex-col">
            {/* Sidebar header (Mobile only close trigger) */}
            <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between lg:hidden bg-slate-950">
              <span className="font-black text-white text-xs">خيارات التحكم</span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu entries */}
            <div className="p-4 space-y-1.5">
              {[
                { id: "dashboard", label: "لوحة التحكم الرئيسية", icon: LayoutDashboard },
                { id: "inventory", label: "جرد المستودع والمواد", icon: Package },
                { id: "invoices", label: "الفواتير والمشتريات", icon: FileText },
                { id: "accounts", label: "الأستاذ وكشف الحسابات", icon: Users },
                { id: "maintenance", label: "قسم صيانة الأجهزة", icon: Wrench },
                { id: "settings", label: "أدوات النظام والنسخ", icon: Settings }
              ].map(menuItem => {
                const IconComponent = menuItem.icon;
                const isSelected = activeTab === menuItem.id;
                return (
                  <button
                    key={menuItem.id}
                    id={`nav_tab_${menuItem.id}`}
                    onClick={() => handleNavigate(menuItem.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-emerald-800 text-white shadow-xs" 
                        : "hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <IconComponent className={`w-4.5 h-4.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <span>{menuItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credits */}
          <div className="p-5 border-t border-slate-800 text-center bg-slate-950">
            <span className="text-[10px] text-slate-500 block font-medium">الأمين المحاسبي لجوالات</span>
            <span className="text-[9px] text-emerald-600/80 mt-1 block">مؤمن بالكامل أوفلاين محلياً</span>
          </div>
        </aside>

        {/* Overlay backdrop for mobile drawers */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
          />
        )}

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-full">
          {activeTab === "dashboard" && (
            <Dashboard db={db} onNavigate={handleNavigate} />
          )}

          {activeTab === "inventory" && (
            <Inventory 
              db={db} 
              searchQueryFromDashboard={navigationExtraData?.searchItem} 
              onRefresh={loadDb} 
            />
          )}

          {activeTab === "invoices" && (
            <Invoices 
              db={db} 
              navigationExtraData={navigationExtraData} 
              onRefresh={loadDb} 
            />
          )}

          {activeTab === "accounts" && (
            <Accounts 
              db={db} 
              navigationExtraData={navigationExtraData} 
              onRefresh={loadDb} 
            />
          )}

          {activeTab === "maintenance" && (
            <Maintenance 
              db={db} 
              navigationExtraData={navigationExtraData} 
              onRefresh={loadDb} 
            />
          )}

          {activeTab === "settings" && (
            <BackupSettings db={db} onRefresh={loadDb} />
          )}
        </main>
      </div>
    </div>
  );
}
