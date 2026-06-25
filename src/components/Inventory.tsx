/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  FolderPlus, 
  Package, 
  Edit, 
  AlertCircle, 
  BarChart, 
  CheckCircle, 
  Tag, 
  RefreshCw, 
  FileSpreadsheet, 
  Layers 
} from "lucide-react";
import { DatabaseState, InventoryItem, ItemCategory } from "../types/accounting";
import { saveInventoryItem } from "../utils/storage";

interface InventoryProps {
  db: DatabaseState;
  searchQueryFromDashboard?: string;
  onRefresh: () => void;
}

export default function Inventory({ db, searchQueryFromDashboard, onRefresh }: InventoryProps) {
  const [items, setItems] = useState<InventoryItem[]>(db.inventory);
  const [searchQuery, setSearchQuery] = useState(searchQueryFromDashboard || "");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formCategory, setFormCategory] = useState<ItemCategory>(ItemCategory.DEVICE);
  const [formCostPrice, setFormCostPrice] = useState(0);
  const [formSellingPrice, setFormSellingPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(2);
  const [formImeis, setFormImeis] = useState(""); // Comma/newline separated list

  useEffect(() => {
    setItems(db.inventory);
  }, [db]);

  useEffect(() => {
    if (searchQueryFromDashboard) {
      setSearchQuery(searchQueryFromDashboard);
    }
  }, [searchQueryFromDashboard]);

  // Open Modal for adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormBrand("");
    setFormModel("");
    setFormCategory(ItemCategory.DEVICE);
    setFormCostPrice(0);
    setFormSellingPrice(0);
    setFormStock(0);
    setFormMinStock(2);
    setFormImeis("");
    setShowAddModal(true);
  };

  // Open Modal for editing
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormBrand(item.brand);
    setFormModel(item.model);
    setFormCategory(item.category);
    setFormCostPrice(item.costPrice);
    setFormSellingPrice(item.sellingPrice);
    setFormStock(item.stock);
    setFormMinStock(item.minStockAlert);
    setFormImeis(item.imeis ? item.imeis.join(", ") : "");
    setShowAddModal(true);
  };

  // Handle Save
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) return;

    // Parse IMEIs if Category is DEVICE
    let finalImeis: string[] | undefined;
    let finalStock = formStock;

    if (formCategory === ItemCategory.DEVICE) {
      const parsed = formImeis
        .split(/[,\n]/)
        .map(i => i.trim())
        .filter(i => i.length > 0);
      
      finalImeis = parsed;
      // Auto-set stock to the count of IMEIs provided
      finalStock = parsed.length;
    }

    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : "item_" + Date.now(),
      name: formName.trim(),
      brand: formBrand.trim(),
      model: formModel.trim(),
      category: formCategory,
      costPrice: Number(formCostPrice),
      sellingPrice: Number(formSellingPrice),
      stock: Number(finalStock),
      minStockAlert: Number(formMinStock),
      imeis: finalImeis,
      soldImeis: editingItem ? editingItem.soldImeis : []
    };

    saveInventoryItem(newItem);
    onRefresh();
    setShowAddModal(false);
  };

  // Filter and Search logic
  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    
    const term = searchQuery.toLowerCase().trim();
    if (!term) return matchesCategory;

    // Search in Name, Brand, Model or inside IMEIs!
    const matchesName = item.name.toLowerCase().includes(term);
    const matchesBrand = item.brand.toLowerCase().includes(term);
    const matchesModel = item.model.toLowerCase().includes(term);
    const matchesImei = item.imeis?.some(imei => imei.includes(term)) || false;
    const matchesSoldImei = item.soldImeis?.some(imei => imei.includes(term)) || false;

    return matchesCategory && (matchesName || matchesBrand || matchesModel || matchesImei || matchesSoldImei);
  });

  const getCategoryLabel = (cat: ItemCategory) => {
    switch (cat) {
      case ItemCategory.DEVICE: return "أجهزة هواتف";
      case ItemCategory.ACCESSORY: return "إكسسوارات وملحقات";
      case ItemCategory.SPARE_PART: return "قطع غيار صيانة";
    }
  };

  const getCategoryColor = (cat: ItemCategory) => {
    switch (cat) {
      case ItemCategory.DEVICE: return "bg-blue-50 text-blue-800 border-blue-100";
      case ItemCategory.ACCESSORY: return "bg-emerald-50 text-emerald-800 border-emerald-100";
      case ItemCategory.SPARE_PART: return "bg-purple-50 text-purple-800 border-purple-100";
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            جرد المستودعات والمواد
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بطاقات المواد والمستودع، تعريف الأجهزة الذكية بالأرقام التسلسلية IMEI ومتابعة الملحقات.
          </p>
        </div>
        <button 
          id="btn_add_inventory_item"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          تعريف بطاقة مادة جديدة
        </button>
      </div>

      {/* Control Panel: Search & Filter Tabs */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input 
              id="input_search_inventory"
              type="text" 
              placeholder="البحث باسم الجهاز، الماركة، أو الرقم التسلسلي IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none transition-all"
            />
            <Search className="absolute right-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
          </div>

          {/* Filter Categories Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "كافة المستودع" },
              { id: ItemCategory.DEVICE, label: "الهواتف والأجهزة" },
              { id: ItemCategory.ACCESSORY, label: "الإكسسوارات" },
              { id: ItemCategory.SPARE_PART, label: "قطع الغيار" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  categoryFilter === tab.id 
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

      {/* Main Inventory List Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-xs text-slate-550 uppercase bg-slate-50/75 border-b border-slate-150">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-semibold">اسم المادة / الموديل</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-center">التصنيف</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-center">الكمية الحالية</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-left font-sans">سعر التكلفة</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-left font-sans">سعر المبيع</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-center">حالة المخزون</th>
                <th scope="col" className="px-5 py-3.5 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    ❌ لم يتم العثور على أي مواد تطابق شروط البحث الفلترة.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLow = item.stock <= item.minStockAlert;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 text-xs">{item.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>الماركة: {item.brand}</span>
                          <span className="text-slate-300">|</span>
                          <span>الموديل: {item.model}</span>
                          {item.imeis && item.imeis.length > 0 && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                متوفر: {item.imeis.length} IMEI
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getCategoryColor(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-bold text-slate-800">
                        {item.stock}
                      </td>
                      <td className="px-4 py-4 text-left font-sans font-medium text-slate-650">
                        {item.costPrice.toLocaleString()} {db.settings.currency}
                      </td>
                      <td className="px-4 py-4 text-left font-sans font-bold text-slate-850">
                        {item.sellingPrice.toLocaleString()} {db.settings.currency}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-semibold">
                            <AlertCircle className="w-3 h-3" /> منفذ بالكامل
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-semibold">
                            <AlertCircle className="w-3 h-3" /> تنبيه نقص المواد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">
                            <CheckCircle className="w-3 h-3" /> ممتاز
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            id={`btn_edit_item_${item.id}`}
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 border border-slate-200 hover:border-emerald-200 rounded-lg cursor-pointer transition-all"
                            title="تعديل المادة"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEFINITION MODAL: ADD / EDIT DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-sm font-bold text-slate-800">
                {editingItem ? `تعديل بطاقة مادة: ${editingItem.name}` : "تعريف بطاقة مادة ومستودع جديدة"}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer font-sans text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم المادة / الجهاز كاملاً *</label>
                  <input 
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: iPhone 15 Pro Max 256GB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none transition-all"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الماركة (المصنع)</label>
                  <input 
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="مثال: Apple, Samsung, Xiaomi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none transition-all"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الموديل</label>
                  <input 
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="مثال: A3102, S24-Ultra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none transition-all"
                  />
                </div>

                {/* Category Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">تصنيف المادة في المستودع</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: ItemCategory.DEVICE, label: "هاتف ذكي (بـ IMEI)" },
                      { value: ItemCategory.ACCESSORY, label: "ملحق / إكسسوار بالكمية" },
                      { value: ItemCategory.SPARE_PART, label: "قطعة صيانة غيار" }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormCategory(opt.value)}
                        className={`py-2 px-1 text-center rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          formCategory === opt.value
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">سعر التكلفة ({db.settings.currency})</label>
                  <input 
                    type="number"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none font-sans"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">سعر المبيع المقترح ({db.settings.currency})</label>
                  <input 
                    type="number"
                    min="0"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none font-sans"
                  />
                </div>

                {/* Stock Controls (Conditional based on category) */}
                {formCategory === ItemCategory.DEVICE ? (
                  /* If phone: enter IMEIs and stock is automated */
                  <div className="sm:col-span-2 bg-blue-50/50 p-4 border border-blue-100/50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-blue-900">الأرقام التسلسلية للأجهزة (IMEI) *</label>
                      <span className="text-[10px] bg-blue-100 text-blue-850 px-2 py-0.5 rounded font-mono font-bold">
                        الكمية المضافة تلقائياً: {
                          formImeis.split(/[,\n]/).map(i => i.trim()).filter(i => i.length > 0).length
                        }
                      </span>
                    </div>
                    <textarea
                      value={formImeis}
                      onChange={(e) => setFormImeis(e.target.value)}
                      placeholder="أدخل الأرقام التسلسلية IMEI هنا (افصل بينها بفاصلة أو سطر جديد لكل جهاز)..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-mono outline-none"
                    />
                    <p className="text-[10px] text-blue-700">
                      * في الهواتف، يتم تحديث رصيد المستودع للكمية تلقائياً بناءً على عدد أرقام الـ IMEI المدخلة.
                    </p>
                  </div>
                ) : (
                  /* If accessory / parts: enter stock directly */
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">الكمية الافتتاحية الحالية</label>
                      <input 
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">حد تنبيه النقصان</label>
                      <input 
                        type="number"
                        min="1"
                        value={formMinStock}
                        onChange={(e) => setFormMinStock(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none font-sans"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  إلغاء الأمر
                </button>
                <button
                  id="btn_submit_inventory_form"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
                >
                  حفظ بطاقة المادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
