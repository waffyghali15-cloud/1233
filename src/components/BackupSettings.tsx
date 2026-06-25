/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Download, 
  Upload, 
  RefreshCcw, 
  Store, 
  Phone, 
  MapPin, 
  Coins, 
  FileText, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  FileSpreadsheet, 
  HelpCircle 
} from "lucide-react";
import { DatabaseState, StoreSettings } from "../types/accounting";
import { updateSettings, resetDatabase, restoreDatabase } from "../utils/storage";

interface BackupSettingsProps {
  db: DatabaseState;
  onRefresh: () => void;
}

export default function BackupSettings({ db, onRefresh }: BackupSettingsProps) {
  // Store Settings state
  const [storeName, setStoreName] = useState(db.settings.storeName);
  const [phone, setPhone] = useState(db.settings.phone);
  const [address, setAddress] = useState(db.settings.address);
  const [currency, setCurrency] = useState(db.settings.currency);
  const [receiptFooter, setReceiptFooter] = useState(db.settings.receiptFooter);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Handle Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !currency.trim()) return;

    const newSettings: StoreSettings = {
      storeName: storeName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency: currency.trim(),
      receiptFooter: receiptFooter.trim()
    };

    updateSettings(newSettings);
    onRefresh();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export Backup File (نسخة احتياطية بصيغة .ameen)
  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(db, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `AlAmeen_Backup_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      alert("تعذر تصدير الملف الاحتياطي!");
    }
  };

  // Import Backup File
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const resultStr = event.target?.result as string;
      const res = restoreDatabase(resultStr);
      
      if (res.success) {
        setRestoreSuccess(true);
        setRestoreError(null);
        onRefresh();
        setTimeout(() => setRestoreSuccess(false), 3000);
      } else {
        setRestoreError(res.error || "حدث خطأ أثناء فك تشفير الملف.");
        setRestoreSuccess(false);
      }
    };
    
    fileReader.readAsText(file);
  };

  // Hard Reset Database (تصفير السنة المالية)
  const handleHardReset = () => {
    const confirmed = window.confirm("🚨 تحذير هام جداً:\n\nهل أنت متأكد من رغبتك في تهيئة وتصفير قاعدة البيانات بالكامل؟\nهذا الإجراء سيقوم بحذف جميع الفواتير والسندات وبطاقات الصيانة المضافة، ويعيد تهيئة المستودع إلى الحالة الافتتاحية للمحل.");
    if (confirmed) {
      resetDatabase();
      onRefresh();
      alert("تمت تهيئة قاعدة البيانات بنجاح وبدء دورة مالية جديدة.");
    }
  };

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-650" />
          تهيئة النظام والنسخ الاحتياطي
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          تعديل الاسم التجاري وبيانات ترويسة الفواتير المطبوعة، وإدارة قواعد بيانات المحل والمستندات السنوية.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SHOP SETTINGS (7 cols) */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-7 bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-750 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4.5 h-4.5 text-emerald-600" />
            تعديل بيانات المحل وترويسة المطبوعات
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Store Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                الاسم التجاري للمحل *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: الأمين لتجارة وصيانة الموبايل"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                رقم جوال المحل
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 0933123456"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs font-mono outline-none"
              />
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                العملة الحسابية المعتمدة *
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="مثال: $, ل.س, ر.س, AED"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs font-bold text-center outline-none"
              />
            </div>

            {/* Store address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                عنوان المحل / صالة المبيعات
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: دمشق، سوق الجوالات بالبحصة"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none"
              />
            </div>

            {/* Receipt Footer */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                شروط كفالة الصيانة وتذييل الفاتورة
              </label>
              <textarea
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="أدخل الشروط القانونية التي ستطبع أسفل فواتير المبيع وإيصالات الصيانة للزبائن..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none"
              />
            </div>
          </div>

          {/* Alert Success */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              تم حفظ الإعدادات بنجاح، ستنعكس على ترويسة وتذييل الفواتير فوراً.
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 text-left">
            <button
              id="btn_save_settings"
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              حفظ وتطبيق الإعدادات
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: BACKUP & DATABASE UTILITY (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Backup & Restore Utility Frame */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-750 flex items-center gap-2 border-b border-slate-100 pb-3">
              <RefreshCcw className="w-4.5 h-4.5 text-slate-600" />
              إدارة وتأمين قواعد البيانات
            </h2>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              لحماية بيانات محل الجوالات ومستندات الفواتير من الضياع، نوصي بشدة بأخذ نسخة احتياطية بشكل يومي وتنزيلها على ذاكرة خارجية فلاشة.
            </p>

            {/* Export block */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">نسخ احتياطي كامل (Export):</span>
              <button
                id="btn_export_database_backup"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4.5 h-4.5" />
                إنشاء وتنزيل ملف النسخة الاحتياطية
              </button>
            </div>

            {/* Import block */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">استرجاع نسخة احتياطية (Import):</span>
              
              <label className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs text-center">
                <Upload className="w-4.5 h-4.5 text-emerald-650" />
                <span>رفع واستعادة ملف (.json)</span>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden" 
                />
              </label>

              {restoreSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-lg text-emerald-800 text-[10px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تمت استعادة الدفاتر والمخزون بنجاح كامل.
                </div>
              )}

              {restoreError && (
                <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-lg text-rose-800 text-[10px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {restoreError}
                </div>
              )}
            </div>
          </div>

          {/* Hard Reset Card (تصفير السنة المالية) */}
          <div className="bg-rose-50/45 border border-rose-150 rounded-xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-650 animate-pulse" />
              منطقة الخطر: تصفير وتهيئة السنة المالية
            </h3>
            <p className="text-[10px] text-rose-800 leading-relaxed">
              التهيئة ستمسح كافة حركات الفواتير، المقبوضات والصيانات المسجلة وتبدأ بسنة فارغة تماماً مع بقاء المواد الافتتاحية فقط. يرجى الحذر الشديد!
            </p>
            <button
              id="btn_danger_reset_db"
              onClick={handleHardReset}
              className="w-full py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              تصفير قاعدة البيانات بالكامل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
