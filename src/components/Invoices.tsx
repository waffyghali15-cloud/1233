/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  PlusCircle, 
  AlertCircle, 
  X, 
  Smartphone, 
  Calculator, 
  Check, 
  DollarSign, 
  ShoppingBag, 
  History 
} from "lucide-react";
import { 
  DatabaseState, 
  Invoice, 
  InvoiceType, 
  PaymentType, 
  InvoiceItem, 
  ItemCategory, 
  Account, 
  AccountType 
} from "../types/accounting";
import { createInvoice } from "../utils/storage";

interface InvoicesProps {
  db: DatabaseState;
  navigationExtraData?: any;
  onRefresh: () => void;
}

export default function Invoices({ db, navigationExtraData, onRefresh }: InvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(db.invoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>("ALL");
  
  // Create state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<InvoiceType>(InvoiceType.SALES);
  
  // Invoice form fields
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CASH);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [tax, setTax] = useState(0);

  // Selector for adding single item to invoice list
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  // Print/Preview Modal state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setInvoices(db.invoices);
  }, [db]);

  // Handle direct navigation requests from dashboard quick-actions
  useEffect(() => {
    if (navigationExtraData) {
      if (navigationExtraData.openCreateSales) {
        handleOpenCreate(InvoiceType.SALES);
      } else if (navigationExtraData.openCreatePurchase) {
        handleOpenCreate(InvoiceType.PURCHASE);
      }
    }
  }, [navigationExtraData]);

  // Filter Accounts based on Invoice Type
  const allowedAccounts = db.accounts.filter(acc => {
    if (createType === InvoiceType.SALES) {
      return acc.type === AccountType.CUSTOMER;
    } else {
      return acc.type === AccountType.SUPPLIER;
    }
  });

  // Open Create Modal
  const handleOpenCreate = (type: InvoiceType) => {
    setCreateType(type);
    
    // Auto-select Cash customer as default for sales
    const defaultAcc = db.accounts.find(
      a => type === InvoiceType.SALES ? a.id === "acc_cust_cash" : a.type === AccountType.SUPPLIER
    );
    
    setSelectedAccountId(defaultAcc ? defaultAcc.id : "");
    setPaymentType(PaymentType.CASH);
    setInvoiceItems([]);
    setDiscount(0);
    setTax(0);
    setPaidAmount(0);
    setInvoiceNotes("");
    
    // Clear item inputs
    setSelectedItemId("");
    setSelectedImeis([]);
    setItemQuantity(1);
    setItemPrice(0);
    
    setShowCreateModal(true);
  };

  // When an item is selected in the creation form
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setSelectedImeis([]);
    setItemQuantity(1);
    
    const storeItem = db.inventory.find(i => i.id === itemId);
    if (storeItem) {
      // If purchase, prefill with cost price, if sales, prefill with selling price
      setItemPrice(createType === InvoiceType.SALES ? storeItem.sellingPrice : storeItem.costPrice);
    }
  };

  // Add Item to active Invoice items list
  const handleAddItemToInvoice = () => {
    const storeItem = db.inventory.find(i => i.id === selectedItemId);
    if (!storeItem) return;

    // Validate quantities and IMEIs for Sales
    if (createType === InvoiceType.SALES) {
      if (storeItem.category === ItemCategory.DEVICE) {
        if (selectedImeis.length === 0) {
          alert("الرجاء اختيار الرقم التسلسلي IMEI للجهاز المبيع!");
          return;
        }
      } else {
        if (itemQuantity > storeItem.stock) {
          alert(`الكمية المطلوبة (${itemQuantity}) تتجاوز المتوفر في المستودع (${storeItem.stock})!`);
          return;
        }
      }
    }

    // Determine final quantity and IMEIs
    const finalQuantity = storeItem.category === ItemCategory.DEVICE ? selectedImeis.length : itemQuantity;
    const finalPrice = itemPrice;
    const finalTotal = finalQuantity * finalPrice;

    const existingRowIndex = invoiceItems.findIndex(row => row.itemId === selectedItemId);
    
    if (existingRowIndex >= 0 && storeItem.category !== ItemCategory.DEVICE) {
      // Update existing accessory quantity
      const rows = [...invoiceItems];
      const newQty = rows[existingRowIndex].quantity + finalQuantity;
      
      // Stock limit check again for updated quantity
      if (createType === InvoiceType.SALES && newQty > storeItem.stock) {
        alert(`إجمالي الكمية (${newQty}) يتجاوز المتوفر في المستودع (${storeItem.stock})!`);
        return;
      }

      rows[existingRowIndex].quantity = newQty;
      rows[existingRowIndex].total = newQty * rows[existingRowIndex].price;
      setInvoiceItems(rows);
    } else {
      // Add new row (Devices always added as separate rows or separate IMEIs list)
      const newInvoiceItem: InvoiceItem = {
        itemId: storeItem.id,
        name: storeItem.name,
        category: storeItem.category,
        quantity: finalQuantity,
        price: finalPrice,
        imeis: storeItem.category === ItemCategory.DEVICE ? selectedImeis : undefined,
        total: finalTotal
      };
      setInvoiceItems([...invoiceItems, newInvoiceItem]);
    }

    // Clear item section
    setSelectedItemId("");
    setSelectedImeis([]);
    setItemQuantity(1);
    setItemPrice(0);
  };

  // Remove row from active Invoice
  const handleRemoveItemFromInvoice = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Live Calculations
  const invoiceSubtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const netInvoiceAmount = Math.max(0, invoiceSubtotal + tax - discount);
  
  // Sync Paid Amount if Cash payment
  useEffect(() => {
    if (paymentType === PaymentType.CASH) {
      setPaidAmount(netInvoiceAmount);
    }
  }, [paymentType, netInvoiceAmount]);

  // Submit Invoice Creation
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (invoiceItems.length === 0) {
      alert("الرجاء إضافة مادة واحدة على الأقل للفاتورة!");
      return;
    }

    const account = db.accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    const finalPaid = paymentType === PaymentType.CASH ? netInvoiceAmount : paidAmount;
    if (finalPaid > netInvoiceAmount) {
      alert("المبلغ المدفوع لا يمكن أن يكون أكبر من صافي الفاتورة!");
      return;
    }

    const remaining = Math.max(0, netInvoiceAmount - finalPaid);

    // Build the Al-Ameen invoice receipt
    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: String(1000 + db.invoices.length + 1),
      type: createType,
      date: new Date().toISOString(),
      accountId: selectedAccountId,
      accountName: account.name,
      items: invoiceItems,
      discount: discount,
      tax: tax,
      totalAmount: invoiceSubtotal,
      netAmount: netInvoiceAmount,
      paidAmount: finalPaid,
      remainingAmount: remaining,
      paymentType: paymentType,
      notes: invoiceNotes.trim() || undefined
    };

    createInvoice(newInvoice);
    onRefresh();
    setShowCreateModal(false);
    
    // Automatically trigger Print Preview for the newly saved invoice
    setPreviewInvoice(newInvoice);
  };

  // Filters previous invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesType = invoiceTypeFilter === "ALL" || inv.type === invoiceTypeFilter;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return matchesType;

    const matchesNumber = inv.invoiceNumber.includes(term);
    const matchesName = inv.accountName.toLowerCase().includes(term);
    const matchesNote = inv.notes?.toLowerCase().includes(term) || false;
    const matchesItem = inv.items.some(i => i.name.toLowerCase().includes(term));

    return matchesType && (matchesNumber || matchesName || matchesNote || matchesItem);
  });

  const getInvoiceTypeLabel = (type: InvoiceType) => {
    return type === InvoiceType.SALES ? "فاتورة مبيعات" : "فاتورة مشتريات";
  };

  const getInvoiceTypeColor = (type: InvoiceType) => {
    return type === InvoiceType.SALES 
      ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
      : "bg-blue-50 text-blue-800 border-blue-100";
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-650" />
            فواتير المبيعات والمشتريات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إصدار فواتير بيع الأجهزة الذكية وملحقاتها، معالجة حسابات الموردين، وإدخال IMEIs الأجهزة المشتراة.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            id="btn_new_sales_invoice"
            onClick={() => handleOpenCreate(InvoiceType.SALES)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            فاتورة مبيعات جديدة
          </button>
          <button 
            id="btn_new_purchase_invoice"
            onClick={() => handleOpenCreate(InvoiceType.PURCHASE)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            فاتورة مشتريات جديدة
          </button>
        </div>
      </div>

      {/* Control Ribbon */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <input 
              id="input_search_invoices"
              type="text" 
              placeholder="البحث برقم الفاتورة، اسم العميل/المورد، الملاحظات أو المواد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none transition-all"
            />
            <Search className="absolute right-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "كافة الفواتير" },
              { id: InvoiceType.SALES, label: "فواتير المبيعات" },
              { id: InvoiceType.PURCHASE, label: "فواتير المشتريات" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setInvoiceTypeFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  invoiceTypeFilter === tab.id 
                    ? "bg-slate-800 text-white shadow-xs" 
                    : "bg-slate-50 text-slate-650 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-xs text-slate-550 uppercase bg-slate-50/75 border-b border-slate-150">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-semibold">رقم الفاتورة</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-center">النوع</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">التاريخ</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">اسم الطرف الآخر</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-center">طريقة الدفع</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-left font-sans">صافي القيمة</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-left font-sans">المسدد نقداً</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-left font-sans text-rose-600">المتبقي (آجل)</th>
                <th scope="col" className="px-5 py-3.5 font-semibold text-center">معاينة وطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                    ❌ لم يتم العثور على أي فواتير تطابق شروط البحث.
                  </td>
                </tr>
              ) : (
                filteredInvoices.reverse().map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold border ${getInvoiceTypeColor(inv.type)}`}>
                        {getInvoiceTypeLabel(inv.type)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {new Date(inv.date).toLocaleDateString("ar-SY")} {new Date(inv.date).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {inv.accountName}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inv.paymentType === PaymentType.CASH 
                          ? "bg-slate-100 text-slate-800" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {inv.paymentType === PaymentType.CASH ? "نقدي" : "آجل"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-left font-sans font-bold text-slate-850">
                      {inv.netAmount.toLocaleString()} {db.settings.currency}
                    </td>
                    <td className="px-4 py-4 text-left font-sans text-emerald-750 font-semibold">
                      {inv.paidAmount.toLocaleString()} {db.settings.currency}
                    </td>
                    <td className={`px-4 py-4 text-left font-sans font-semibold ${inv.remainingAmount > 0 ? "text-rose-650" : "text-slate-400"}`}>
                      {inv.remainingAmount > 0 ? `${inv.remainingAmount.toLocaleString()} ${db.settings.currency}` : "مسدد بالكامل"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        id={`btn_preview_invoice_${inv.id}`}
                        onClick={() => setPreviewInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-750 border border-emerald-100 hover:border-emerald-750 rounded-lg cursor-pointer font-semibold transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        سند الفاتورة
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-4xl max-h-[94vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-650" />
                إنشاء {createType === InvoiceType.SALES ? "فاتورة مبيعات هاتف وإكسسوار" : "فاتورة شراء بضائع ومواد"} جديد
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer font-sans text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-5 space-y-4">
              {/* Header: Partner & Payment Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                {/* Account field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    {createType === InvoiceType.SALES ? "الزبون / العميل *" : "المورد / الشركة المجهزة *"}
                  </label>
                  <select
                    required
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                  >
                    <option value="">-- حدد الحساب المرتبط --</option>
                    {allowedAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} {acc.phone ? `(${acc.phone})` : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">طريقة الدفع للفاتورة</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType(PaymentType.CASH)}
                      className={`py-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        paymentType === PaymentType.CASH
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      نقدي (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType(PaymentType.CREDIT)}
                      className={`py-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        paymentType === PaymentType.CREDIT
                          ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      آجل / ذمم (Credit)
                    </button>
                  </div>
                </div>

                {/* Invoice number display */}
                <div className="flex flex-col justify-end">
                  <div className="text-xs text-slate-500 mb-1 font-semibold">رقم الفاتورة المقترح (تلقائي)</div>
                  <div className="px-3 py-2 bg-slate-200 font-mono font-bold text-slate-700 rounded-lg text-xs border border-slate-300">
                    #{1000 + db.invoices.length + 1}
                  </div>
                </div>
              </div>

              {/* Items Adding Row section */}
              <div className="bg-emerald-50/20 p-4 border border-emerald-100 rounded-xl space-y-3.5">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  إضافة مواد وبضائع للفاتورة
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Select Material */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">اختر المادة من المستودع *</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => handleItemSelect(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none"
                    >
                      <option value="">-- اختر مادة من المستودع --</option>
                      {db.inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (ماركة: {item.brand} | المتوفر: {item.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Device IMEIs Selection (Only displays if selected item category is DEVICE) */}
                  {selectedItemId && db.inventory.find(i => i.id === selectedItemId)?.category === ItemCategory.DEVICE ? (
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-semibold text-slate-650 mb-1">
                        {createType === InvoiceType.SALES ? "اختر الأرقام التسلسلية (IMEI) *" : "أدخل الـ IMEI للشراء (افصل بفاصلة) *"}
                      </label>
                      {createType === InvoiceType.SALES ? (
                        /* Choose from available devices */
                        <div className="border border-slate-200 rounded-lg p-2 bg-white max-h-24 overflow-y-auto space-y-1">
                          {db.inventory.find(i => i.id === selectedItemId)?.imeis?.length === 0 ? (
                            <div className="text-[10px] text-red-650 font-bold text-center">لا توجد أرقام تسلسلية متوفرة بالمستودع!</div>
                          ) : (
                            db.inventory.find(i => i.id === selectedItemId)?.imeis?.map(imei => (
                              <label key={imei} className="flex items-center gap-2 text-[10px] text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedImeis.includes(imei)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedImeis([...selectedImeis, imei]);
                                    } else {
                                      setSelectedImeis(selectedImeis.filter(i => i !== imei));
                                    }
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-mono">{imei}</span>
                              </label>
                            ))
                          )}
                        </div>
                      ) : (
                        /* Purchase: type new IMEIs */
                        <input
                          type="text"
                          placeholder="مثال: 35897210..., 35897210..."
                          value={selectedImeis.join(", ")}
                          onChange={(e) => setSelectedImeis(e.target.value.split(",").map(i => i.trim()).filter(i => i.length > 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none font-mono"
                        />
                      )}
                    </div>
                  ) : (
                    /* Accessory / parts Quantity Input */
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">الكمية</label>
                      <input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none font-sans"
                        disabled={!selectedItemId}
                      />
                    </div>
                  )}

                  {/* Price Input */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      السعر الفردي ({db.settings.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none font-sans"
                      disabled={!selectedItemId}
                    />
                  </div>

                  {/* Add Row Button */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={!selectedItemId}
                      onClick={handleAddItemToInvoice}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      إدراج للجدول
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice Rows list table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">المادة المضافة</th>
                      <th className="px-4 py-2.5 text-center">الكمية</th>
                      <th className="px-4 py-2.5 text-left font-sans">السعر الإفرادي</th>
                      <th className="px-4 py-2.5 text-left font-sans">الإجمالي</th>
                      <th className="px-4 py-2.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                          جدول الفاتورة فارغ. الرجاء إدراج المواد من الأعلى.
                        </td>
                      </tr>
                    ) : (
                      invoiceItems.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800">{row.name}</span>
                            {row.imeis && row.imeis.length > 0 && (
                              <div className="text-[9px] text-blue-700 font-mono mt-1 select-all">
                                IMEIs: {row.imeis.join(", ")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                            {row.quantity}
                          </td>
                          <td className="px-4 py-3 text-left font-sans text-slate-650">
                            {row.price.toLocaleString()} {db.settings.currency}
                          </td>
                          <td className="px-4 py-3 text-left font-sans font-bold text-slate-850">
                            {row.total.toLocaleString()} {db.settings.currency}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromInvoice(idx)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Calculations section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Notes & Voucher logs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">ملاحظات الفاتورة والبيان</label>
                    <textarea
                      placeholder="أية ملاحظات تظهر على الفاتورة وسجلات الحسابات المزدوجة..."
                      rows={3}
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Subtotal & Discounts math */}
                <div className="bg-slate-50 border border-slate-250/50 rounded-xl p-4 space-y-3.5">
                  <div className="flex justify-between items-center text-xs text-slate-650">
                    <span>مجموع المواد:</span>
                    <span className="font-mono font-bold text-slate-800">{invoiceSubtotal.toLocaleString()} {db.settings.currency}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Discount */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">الخصم الممنوح (تنزيل)</label>
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none font-sans"
                      />
                    </div>

                    {/* Tax */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">رسوم / ضرائب مضافة</label>
                      <input
                        type="number"
                        min="0"
                        value={tax}
                        onChange={(e) => setTax(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Net final display */}
                  <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg">
                    <span className="text-xs font-bold">الصافي النهائي للمطالبة:</span>
                    <span className="text-sm font-black font-sans">{netInvoiceAmount.toLocaleString()} {db.settings.currency}</span>
                  </div>

                  {/* Paid and Remaining inputs if Credit */}
                  {paymentType === PaymentType.CREDIT && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <div>
                        <label className="block text-[10px] font-semibold text-amber-900 mb-1">الدفعة النقدية المسددة</label>
                        <input
                          type="number"
                          min="0"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-200 text-xs rounded-lg outline-none font-sans"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <span className="text-[10px] text-amber-800 font-semibold mb-1">المبلغ المتبقي بالذمة:</span>
                        <span className="px-2.5 py-1.5 bg-amber-100 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-900 text-left">
                          {(netInvoiceAmount - paidAmount).toLocaleString()} {db.settings.currency}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  id="btn_submit_invoice_form"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <ShoppingBag className="w-4 h-4" />
                  حفظ وترحيل الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[94vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl print:hidden">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-650" />
                معاينة وطباعة الفاتورة #{previewInvoice.invoiceNumber}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة الفاتورة
                </button>
                <button 
                  onClick={() => setPreviewInvoice(null)}
                  className="px-3.5 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-750 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>

            {/* Print Area - Real Invoice Receipt Style */}
            <div className="p-8 space-y-6 text-slate-800 select-all" id="ameen-printable-invoice">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-850 pb-4">
                <div className="space-y-1">
                  <h1 className="text-lg font-black tracking-tight text-slate-900">{db.settings.storeName}</h1>
                  <p className="text-[10px] text-slate-500 font-semibold">المبيعات والصيانة العامة للهواتف الذكية</p>
                  <p className="text-[10px] text-slate-500">العنوان: {db.settings.address}</p>
                  <p className="text-[10px] text-slate-500 font-mono">الهاتف: {db.settings.phone}</p>
                </div>
                <div className="text-left space-y-1">
                  <div className="text-sm font-black bg-slate-850 text-white px-3 py-1 rounded">
                    {previewInvoice.type === InvoiceType.SALES ? "فاتورة مبيعات" : "فاتورة مشتريات"}
                  </div>
                  <div className="text-[10px] text-slate-650 font-mono mt-1">رقم الفاتورة: #{previewInvoice.invoiceNumber}</div>
                  <div className="text-[10px] text-slate-650 font-mono">التاريخ: {new Date(previewInvoice.date).toLocaleDateString("ar-SY")}</div>
                </div>
              </div>

              {/* Bill To Customer info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block font-semibold mb-0.5">صادرة إلى السيد/الشركة:</span>
                  <span className="font-bold text-slate-800 text-sm">{previewInvoice.accountName}</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 block font-semibold mb-0.5">نوع الدفع المحاسبي:</span>
                  <span className="font-bold text-slate-800">
                    {previewInvoice.paymentType === PaymentType.CASH ? "نقدي (خزينة الصندوق)" : "ذمم - حساب آجل"}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold bg-slate-50">
                    <th className="py-2 px-1">المادة المبيعة / المشتراة</th>
                    <th className="py-2 text-center w-16">الكمية</th>
                    <th className="py-2 text-left w-28 font-sans">سعر المفرد</th>
                    <th className="py-2 text-left w-28 font-sans">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewInvoice.items.map((item, index) => (
                    <tr key={index} className="py-2">
                      <td className="py-2.5 px-1">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        {item.imeis && item.imeis.length > 0 && (
                          <div className="text-[9px] text-slate-600 font-mono mt-1 select-all">
                            الأرقام التسلسلية IMEI: {item.imeis.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-2.5 text-left font-sans">{item.price.toLocaleString()} {db.settings.currency}</td>
                      <td className="py-2.5 text-left font-sans font-bold text-slate-850">{item.total.toLocaleString()} {db.settings.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Invoice Totals Summary layout */}
              <div className="border-t border-slate-800 pt-3 flex justify-between items-start gap-4">
                <div className="text-[10px] text-slate-500 max-w-xs space-y-1">
                  <span className="font-bold block text-slate-700">ملاحظات الفاتورة:</span>
                  <p>{previewInvoice.notes || "لا توجد ملاحظات إضافية مسجلة على هذه الفاتورة."}</p>
                </div>
                
                <div className="w-64 space-y-2 text-xs text-left">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>مجموع المواد:</span>
                    <span className="font-mono">{previewInvoice.totalAmount.toLocaleString()} {db.settings.currency}</span>
                  </div>
                  {previewInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>الخصم الممنوح:</span>
                      <span className="font-mono">-{previewInvoice.discount.toLocaleString()} {db.settings.currency}</span>
                    </div>
                  )}
                  {previewInvoice.tax > 0 && (
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>الضريبة والرسوم:</span>
                      <span className="font-mono">+{previewInvoice.tax.toLocaleString()} {db.settings.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-2 text-sm">
                    <span>الصافي النهائي:</span>
                    <span className="font-sans text-emerald-800">{previewInvoice.netAmount.toLocaleString()} {db.settings.currency}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>المبلغ المسدد:</span>
                    <span className="font-mono">{previewInvoice.paidAmount.toLocaleString()} {db.settings.currency}</span>
                  </div>
                  {previewInvoice.remainingAmount > 0 && (
                    <div className="flex justify-between text-rose-650 font-bold">
                      <span>المتبقي في الذمة:</span>
                      <span className="font-mono">{previewInvoice.remainingAmount.toLocaleString()} {db.settings.currency}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Printable Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-[11px] pt-10 border-t border-dashed border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-8">توقيع المستلم / الزبون</span>
                  <span className="border-t border-slate-300 px-8 pt-1 text-slate-500 font-medium">توقيع المشتري</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-8">توقيع وختم المحل</span>
                  <span className="border-t border-slate-300 px-8 pt-1 text-slate-800 font-bold">{db.settings.storeName}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="pt-4 border-t border-slate-250 text-center text-[10px] text-slate-400 font-medium leading-relaxed">
                {db.settings.receiptFooter}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
