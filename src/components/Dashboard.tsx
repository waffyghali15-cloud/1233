/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Wallet, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wrench, 
  TrendingUp, 
  AlertTriangle, 
  PlusCircle, 
  FileText, 
  DollarSign, 
  Users 
} from "lucide-react";
import { 
  DatabaseState, 
  AccountType, 
  MaintenanceStatus, 
  InvoiceType, 
  PaymentType, 
  VoucherType 
} from "../types/accounting";

interface DashboardProps {
  db: DatabaseState;
  onNavigate: (tab: string, extraData?: any) => void;
}

export default function Dashboard({ db, onNavigate }: DashboardProps) {
  // 1. Calculate Financial Summaries
  const safeAccount = db.accounts.find(a => a.type === AccountType.SAFE);
  const totalCash = safeAccount ? safeAccount.currentBalance : 0;

  // Inventory value based on cost price
  const totalInventoryValue = db.inventory.reduce((sum, item) => {
    return sum + (item.stock * item.costPrice);
  }, 0);

  // Total Customer Debts (debited balances > 0)
  const totalCustomerDebts = db.accounts
    .filter(a => a.type === AccountType.CUSTOMER)
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

  // Total Supplier Payables (credited balances > 0)
  const totalSupplierPayables = db.accounts
    .filter(a => a.type === AccountType.SUPPLIER)
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

  // Active Repairs (Pending, In Progress, Ready)
  const activeRepairsCount = db.maintenance.filter(
    m => m.status === MaintenanceStatus.PENDING || 
         m.status === MaintenanceStatus.IN_PROGRESS || 
         m.status === MaintenanceStatus.READY
  ).length;

  // 2. Low Stock Alerts
  const lowStockItems = db.inventory.filter(item => item.stock <= item.minStockAlert);

  // 3. Recent Activity (Combines invoices and vouchers for a unified feed)
  const recentInvoices = db.invoices.slice(-3).reverse();
  const recentVouchers = db.vouchers.slice(-3).reverse();

  // 4. Financial Charts calculation (Sample months for visual display)
  // Let's calculate actual sales, purchases and repair revenue from db
  const totalSales = db.invoices
    .filter(i => i.type === "SALES")
    .reduce((sum, i) => sum + i.netAmount, 0);

  const totalPurchases = db.invoices
    .filter(i => i.type === "PURCHASE")
    .reduce((sum, i) => sum + i.netAmount, 0);

  const totalRepairs = db.maintenance
    .filter(m => m.status === MaintenanceStatus.DELIVERED)
    .reduce((sum, m) => sum + (m.finalCost || m.estimatedCost), 0);

  const totalExpenses = db.vouchers
    .filter(v => v.type === "PAYMENT" && db.accounts.find(a => a.id === v.accountId && a.type === AccountType.EXPENSE))
    .reduce((sum, v) => sum + v.amount, 0);

  const storeCurrency = db.settings.currency;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Upper Welcome Banner */}
      <div className="bg-gradient-to-l from-emerald-850 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight font-sans">
            أهلاً بك في {db.settings.storeName}
          </h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            مستوحى من نظام الأمين - محاسبة ومستودعات وصيانة الهواتف الذكية بكل دقة.
          </p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-mono backdrop-blur-xs flex gap-4">
          <div>التاريخ: {new Date().toLocaleDateString("ar-SY")}</div>
          <div className="border-r border-white/20 pr-4">الصندوق الرئيسي: {totalCash.toLocaleString()} {storeCurrency}</div>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Safe Cash */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full">الصندوق</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-500 font-medium">السيولة النقدية</h3>
            <p className="text-2xl font-bold font-sans text-slate-800 mt-1">
              {totalCash.toLocaleString()} <span className="text-sm font-normal text-slate-500">{storeCurrency}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Inventory Cost */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full">المخزن</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-500 font-medium">قيمة جرد المستودع</h3>
            <p className="text-2xl font-bold font-sans text-slate-800 mt-1">
              {totalInventoryValue.toLocaleString()} <span className="text-sm font-normal text-slate-500">{storeCurrency}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Receivables */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-red-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full">ذمم مدينة</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-500 font-medium">ديون الزبائن لنا</h3>
            <p className="text-2xl font-bold font-sans text-rose-650 mt-1">
              {totalCustomerDebts.toLocaleString()} <span className="text-sm font-normal text-slate-500">{storeCurrency}</span>
            </p>
          </div>
        </div>

        {/* Card 4: Supplier Payables */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full">ذمم دائنة</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-500 font-medium">مستحقات الموردين</h3>
            <p className="text-2xl font-bold font-sans text-amber-650 mt-1">
              {totalSupplierPayables.toLocaleString()} <span className="text-sm font-normal text-slate-500">{storeCurrency}</span>
            </p>
          </div>
        </div>

        {/* Card 5: Repairs */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full">الصيانة</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-500 font-medium">أجهزة قيد الصيانة</h3>
            <p className="text-2xl font-bold font-sans text-slate-800 mt-1">
              {activeRepairsCount} <span className="text-sm font-normal text-slate-500">أجهزة</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          عمليات سريعة بنقرة واحدة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button 
            id="btn_quick_sale"
            onClick={() => onNavigate("invoices", { openCreateSales: true })}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-xl border border-emerald-100 transition-all cursor-pointer text-center group"
          >
            <FileText className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs">فاتورة مبيعات مباشرة</span>
          </button>
          
          <button 
            id="btn_quick_purchase"
            onClick={() => onNavigate("invoices", { openCreatePurchase: true })}
            className="flex flex-col items-center justify-center p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium rounded-xl border border-blue-100 transition-all cursor-pointer text-center group"
          >
            <FileText className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs">فاتورة مشتريات (مواد)</span>
          </button>

          <button 
            id="btn_quick_maint"
            onClick={() => onNavigate("maintenance", { openCreateJob: true })}
            className="flex flex-col items-center justify-center p-3.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium rounded-xl border border-teal-100 transition-all cursor-pointer text-center group"
          >
            <Wrench className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs">كرت صيانة جديد</span>
          </button>

          <button 
            id="btn_quick_receipt"
            onClick={() => onNavigate("accounts", { openCreateReceipt: true })}
            className="flex flex-col items-center justify-center p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium rounded-xl border border-purple-100 transition-all cursor-pointer text-center group"
          >
            <DollarSign className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs">سند قبض (قبض نقدي)</span>
          </button>

          <button 
            id="btn_quick_payment"
            onClick={() => onNavigate("accounts", { openCreatePayment: true })}
            className="flex flex-col items-center justify-center p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium rounded-xl border border-rose-100 transition-all cursor-pointer text-center group col-span-2 sm:col-span-1"
          >
            <DollarSign className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs">سند صرف مصاريف</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Flow Chart / Balance Sheet overview */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              مؤشرات الأداء المالي والنشاط العام
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500">إجمالي المبيعات</span>
                <div className="text-base font-bold text-slate-800 mt-1 font-sans">
                  {totalSales.toLocaleString()} <span className="text-xs font-normal text-slate-500">{storeCurrency}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500">إجمالي المشتريات</span>
                <div className="text-base font-bold text-slate-800 mt-1 font-sans">
                  {totalPurchases.toLocaleString()} <span className="text-xs font-normal text-slate-500">{storeCurrency}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500">إيرادات الصيانة</span>
                <div className="text-base font-bold text-slate-800 mt-1 font-sans">
                  {totalRepairs.toLocaleString()} <span className="text-xs font-normal text-slate-500">{storeCurrency}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500">المصاريف التشغيلية</span>
                <div className="text-base font-bold text-slate-800 mt-1 font-sans">
                  {totalExpenses.toLocaleString()} <span className="text-xs font-normal text-slate-500">{storeCurrency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom SVG Performance Graph */}
          <div className="h-44 flex items-end justify-between px-6 border-b border-slate-100 pb-3 mt-2">
            {[
              { label: "المبيعات", value: totalSales, color: "bg-emerald-500", icon: "📈" },
              { label: "المشتريات", value: totalPurchases, color: "bg-blue-500", icon: "📉" },
              { label: "الصيانة", value: totalRepairs, color: "bg-teal-500", icon: "🛠️" },
              { label: "المصاريف", value: totalExpenses, color: "bg-rose-500", icon: "💸" }
            ].map((col, idx) => {
              const maxVal = Math.max(totalSales, totalPurchases, totalRepairs, totalExpenses, 100);
              const heightPercentage = Math.max(8, (col.value / maxVal) * 100);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 w-1/5 group">
                  <span className="text-xs font-bold text-slate-700 font-sans opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-1.5 py-0.5 rounded text-[10px] -translate-y-1">
                    {col.value.toLocaleString()} {storeCurrency}
                  </span>
                  <div className="w-full bg-slate-50 rounded-t-lg h-24 flex items-end overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                      className={`${col.color} w-full rounded-t-md transition-all duration-700`}
                      style={{ height: `${heightPercentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <span>{col.icon}</span>
                    <span>{col.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-450 mt-3 text-center">
            * يتم احتساب الرسوم البيانية تلقائياً بناءً على تجميع حركات الفواتير وسندات القبض والصرف الفعلية.
          </p>
        </div>

        {/* Low Stock alerts & Repairs alert panel */}
        <div className="space-y-4">
          {/* Low stock list */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              تنبيهات نقص المخزون والقطع
            </h2>
            
            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                👍 جميع المواد متوفرة بكميات كافية في المستودع.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2.5 bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 rounded-lg text-xs transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-[10px] text-slate-500">الماركة: {item.brand} | الموديل: {item.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                        الكمية: {item.stock}
                      </span>
                      <button 
                        onClick={() => onNavigate("inventory", { searchItem: item.name })}
                        className="text-emerald-700 hover:underline text-[10px] font-semibold"
                      >
                        تفاصيل
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats list (Active repairs list overview) */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-600" />
              أحدث طلبات الصيانة المعلقة
            </h2>

            {db.maintenance.filter(m => m.status !== MaintenanceStatus.DELIVERED && m.status !== MaintenanceStatus.CANCELLED).length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                ✨ لا يوجد أجهزة صيانة معلقة حالياً.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {db.maintenance
                  .filter(m => m.status !== MaintenanceStatus.DELIVERED && m.status !== MaintenanceStatus.CANCELLED)
                  .slice(0, 3)
                  .map(job => (
                    <div key={job.id} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 flex justify-between items-center text-xs transition-colors">
                      <div>
                        <div className="font-semibold text-slate-800">{job.deviceModel}</div>
                        <div className="text-[10px] text-slate-500">الزبون: {job.customerName} | العطل: {job.problemDescription}</div>
                      </div>
                      <div className="text-left">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          job.status === MaintenanceStatus.PENDING ? "bg-slate-200 text-slate-800" :
                          job.status === MaintenanceStatus.IN_PROGRESS ? "bg-amber-100 text-amber-800" :
                          "bg-emerald-100 text-emerald-800"
                        }`}>
                          {job.status === MaintenanceStatus.PENDING ? "بانتظار الفحص" :
                           job.status === MaintenanceStatus.IN_PROGRESS ? "قيد التصليح" : "جاهز للتسليم"}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">كرت {job.jobCardNumber}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section: Recent invoices and ledger records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Invoices list */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              آخر الفواتير الصادرة والواردة
            </h2>
            <button 
              onClick={() => onNavigate("invoices")}
              className="text-emerald-700 hover:underline text-xs font-semibold"
            >
              عرض السجل الكامل
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentInvoices.map(invoice => (
              <div key={invoice.id} className="py-2.5 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-lg transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${invoice.type === InvoiceType.SALES ? "bg-emerald-500" : "bg-blue-500"}`} />
                    <span>{invoice.type === InvoiceType.SALES ? "فاتورة مبيع" : "فاتورة مشتريات"}</span>
                    <span className="font-mono text-slate-400">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">الطرف الثاني: {invoice.accountName}</div>
                </div>
                <div className="text-left font-mono">
                  <div className="font-bold text-slate-800">
                    {invoice.netAmount.toLocaleString()} {storeCurrency}
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5">
                    {invoice.paymentType === PaymentType.CASH ? "نقدي" : "آجل"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Vouchers list */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              آخر المقبوضات والمدفوعات (السندات)
            </h2>
            <button 
              onClick={() => onNavigate("accounts")}
              className="text-emerald-700 hover:underline text-xs font-semibold"
            >
              عرض الحسابات والسندات
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentVouchers.map(v => (
              <div key={v.id} className="py-2.5 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-lg transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${v.type === VoucherType.RECEIPT ? "bg-purple-500" : "bg-rose-500"}`} />
                    <span>{v.type === VoucherType.RECEIPT ? "سند قبض" : "سند صرف"}</span>
                    <span className="font-mono text-slate-400">#{v.voucherNumber}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-48">البيان: {v.notes || "-"}</div>
                </div>
                <div className="text-left font-mono">
                  <div className={`font-bold ${v.type === VoucherType.RECEIPT ? "text-purple-650" : "text-rose-650"}`}>
                    {v.type === VoucherType.RECEIPT ? "+" : "-"}{v.amount.toLocaleString()} {storeCurrency}
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5">{v.accountName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
