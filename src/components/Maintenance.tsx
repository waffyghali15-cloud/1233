/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  AlertCircle, 
  DollarSign, 
  Hammer, 
  ShoppingBag, 
  Users, 
  Bookmark, 
  ChevronRight, 
  Activity, 
  Smartphone, 
  UserCheck 
} from "lucide-react";
import { 
  DatabaseState, 
  MaintenanceJob, 
  MaintenanceStatus, 
  ItemCategory, 
  MaintenancePart 
} from "../types/accounting";
import { saveMaintenanceJob } from "../utils/storage";

interface MaintenanceProps {
  db: DatabaseState;
  navigationExtraData?: any;
  onRefresh: () => void;
}

export default function Maintenance({ db, navigationExtraData, onRefresh }: MaintenanceProps) {
  const [jobs, setJobs] = useState<MaintenanceJob[]>(db.maintenance);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Job Fields
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [problemDesc, setProblemDesc] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [jobNotes, setJobNotes] = useState("");

  // Edit/Manage Job details modal
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [editStatus, setEditStatus] = useState<MaintenanceStatus>(MaintenanceStatus.PENDING);
  const [editFinalCost, setEditFinalCost] = useState(0);
  const [editTechnicianCost, setEditTechnicianCost] = useState(0);
  
  // Consuming parts inside repair order state
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQuantity, setPartQuantity] = useState(1);
  const [activePartsUsed, setActivePartsUsed] = useState<MaintenancePart[]>([]);

  useEffect(() => {
    setJobs(db.maintenance);
  }, [db]);

  // Handle direct open request from dashboard shortcuts
  useEffect(() => {
    if (navigationExtraData && navigationExtraData.openCreateJob) {
      handleOpenCreate();
    }
  }, [navigationExtraData]);

  // Open Create Job modal
  const handleOpenCreate = () => {
    setCustName("");
    setCustPhone("");
    setDeviceModel("");
    setDeviceImei("");
    setProblemDesc("");
    setEstimatedCost(0);
    setAdvancePayment(0);
    setJobNotes("");
    setShowCreateModal(true);
  };

  // Submit new Job card
  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !deviceModel.trim() || !problemDesc.trim()) return;

    const newJob: MaintenanceJob = {
      id: "maint_" + Date.now(),
      jobCardNumber: String(5000 + db.maintenance.length + 1),
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      deviceModel: deviceModel.trim(),
      imei: deviceImei.trim() || undefined,
      problemDescription: problemDesc.trim(),
      notes: jobNotes.trim() || undefined,
      dateReceived: new Date().toISOString(),
      status: MaintenanceStatus.PENDING,
      estimatedCost: Number(estimatedCost),
      advancePayment: Number(advancePayment),
      partsUsed: [],
      technicianCost: 0,
      totalPartsCost: 0,
      totalPartsPrice: 0
    };

    saveMaintenanceJob(newJob);
    onRefresh();
    setShowCreateModal(false);
  };

  // Open Manage job modal
  const handleOpenManage = (job: MaintenanceJob) => {
    setSelectedJob(job);
    setEditStatus(job.status);
    setEditFinalCost(job.finalCost || job.estimatedCost);
    setEditTechnicianCost(job.technicianCost || 0);
    setActivePartsUsed(job.partsUsed || []);
    
    // reset single part selections
    setSelectedPartId("");
    setPartQuantity(1);
  };

  // Add Part used in repairing
  const handleAddPartToRepair = () => {
    const storeItem = db.inventory.find(i => i.id === selectedPartId);
    if (!storeItem) return;

    if (partQuantity > storeItem.stock) {
      alert(`عذراً، الكمية المطلوبة (${partQuantity}) تتجاوز المتوفر في المستودع (${storeItem.stock})!`);
      return;
    }

    const newPart: MaintenancePart = {
      itemId: storeItem.id,
      name: storeItem.name,
      quantity: partQuantity,
      costPrice: storeItem.costPrice,
      sellingPrice: storeItem.sellingPrice
    };

    const updatedParts = [...activePartsUsed, newPart];
    setActivePartsUsed(updatedParts);
    setSelectedPartId("");
    setPartQuantity(1);
  };

  // Remove Part used
  const handleRemovePartFromRepair = (index: number) => {
    setActivePartsUsed(activePartsUsed.filter((_, i) => i !== index));
  };

  // Submit Manage update
  const handleUpdateJobStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    const finalPartsCost = activePartsUsed.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    const finalPartsPrice = activePartsUsed.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);

    const isDelivered = editStatus === MaintenanceStatus.DELIVERED;
    const dateDelivered = isDelivered ? new Date().toISOString() : selectedJob.dateDelivered;

    // Calculate net profits: Final Paid Cost - Technician wage - parts cost
    const profit = editFinalCost - editTechnicianCost - finalPartsCost;

    const updatedJob: MaintenanceJob = {
      ...selectedJob,
      status: editStatus,
      finalCost: Number(editFinalCost),
      technicianCost: Number(editTechnicianCost),
      partsUsed: activePartsUsed,
      totalPartsCost: finalPartsCost,
      totalPartsPrice: finalPartsPrice,
      netProfit: profit,
      dateDelivered: dateDelivered
    };

    saveMaintenanceJob(updatedJob);
    onRefresh();
    setSelectedJob(null);
  };

  // Filters
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return matchesStatus;

    const matchesCard = job.jobCardNumber.includes(term);
    const matchesName = job.customerName.toLowerCase().includes(term);
    const matchesPhone = job.customerPhone.includes(term);
    const matchesModel = job.deviceModel.toLowerCase().includes(term);
    const matchesProblem = job.problemDescription.toLowerCase().includes(term);

    return matchesStatus && (matchesCard || matchesName || matchesPhone || matchesModel || matchesProblem);
  });

  const getStatusLabel = (st: MaintenanceStatus) => {
    switch (st) {
      case MaintenanceStatus.PENDING: return "بانتظار الفحص";
      case MaintenanceStatus.IN_PROGRESS: return "قيد التصليح";
      case MaintenanceStatus.READY: return "جاهز للتسليم";
      case MaintenanceStatus.DELIVERED: return "تم التسليم وقبض الصافي";
      case MaintenanceStatus.CANCELLED: return "تم الإلغاء / معتذر";
    }
  };

  const getStatusColor = (st: MaintenanceStatus) => {
    switch (st) {
      case MaintenanceStatus.PENDING: return "bg-slate-100 text-slate-800 border-slate-200";
      case MaintenanceStatus.IN_PROGRESS: return "bg-amber-50 text-amber-800 border-amber-100";
      case MaintenanceStatus.READY: return "bg-blue-50 text-blue-800 border-blue-100";
      case MaintenanceStatus.DELIVERED: return "bg-emerald-50 text-emerald-800 border-emerald-100";
      case MaintenanceStatus.CANCELLED: return "bg-rose-50 text-rose-800 border-rose-100";
    }
  };

  const sparePartsInStore = db.inventory.filter(i => i.category === ItemCategory.SPARE_PART || i.category === ItemCategory.ACCESSORY);
  const storeCurrency = db.settings.currency;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-650" />
            ورشة الصيانة والتصليح الفني
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            استقبال هواتف الزبائن التالفة، مراقبة حالات الفحص والإصلاح، تقدير الكلفة وتوثيق قطع الغيار المستهلكة لربحية دقيقة.
          </p>
        </div>
        <button
          id="btn_new_maintenance_job"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          استقبال جهاز (كرت صيانة جديد)
        </button>
      </div>

      {/* Filters Control Ribbon */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <input
              id="input_search_maintenance"
              type="text"
              placeholder="البحث برقم كرت الصيانة، اسم العميل، الهاتف، أو نوع وموديل الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none transition-all"
            />
            <Search className="absolute right-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
          </div>

          {/* Status Tab Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "كافة بطاقات الورشة" },
              { id: MaintenanceStatus.PENDING, label: "بانتظار الفحص" },
              { id: MaintenanceStatus.IN_PROGRESS, label: "قيد التصليح" },
              { id: MaintenanceStatus.READY, label: "جاهزة للتسليم" },
              { id: MaintenanceStatus.DELIVERED, label: "تم تسليمها" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  statusFilter === tab.id
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

      {/* Repair Cards bento grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredJobs.length === 0 ? (
          <div className="md:col-span-3 text-center py-16 bg-white border border-slate-100 rounded-xl text-slate-400 text-xs">
            ❌ لم يتم العثور على أي بطاقات صيانة تناسب الاختيار.
          </div>
        ) : (
          filteredJobs.reverse().map(job => {
            const hasParts = job.partsUsed && job.partsUsed.length > 0;
            return (
              <div 
                key={job.id} 
                className="bg-white border border-slate-150/75 rounded-xl shadow-xs hover:border-emerald-250 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header details */}
                <div className="p-4.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4.5 h-4.5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-xs truncate max-w-44">{job.deviceModel}</span>
                  </div>
                  <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                    كرت #{job.jobCardNumber}
                  </span>
                </div>

                {/* Card Body details */}
                <div className="p-4.5 space-y-3 flex-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">الزبون المستلم:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                      {job.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">العطل المشكو:</span>
                    <span className="font-bold text-slate-700 bg-rose-50 text-rose-800 px-2 py-0.5 rounded max-w-48 truncate" title={job.problemDescription}>
                      {job.problemDescription}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-slate-500">التكلفة التقديرية:</span>
                    <span className="font-bold text-slate-800">
                      {job.estimatedCost.toLocaleString()} {storeCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-850 bg-emerald-50/50 p-2 rounded-lg font-mono text-[11px]">
                    <span className="font-semibold">الدفعة المقدمة المدفوعة:</span>
                    <span className="font-black">
                      {job.advancePayment.toLocaleString()} {storeCurrency}
                    </span>
                  </div>

                  {hasParts && (
                    <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between items-center">
                      <span>قطع غيار مستهلكة:</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">
                        {job.partsUsed.length} قطع
                      </span>
                    </div>
                  )}
                </div>

                {/* Card footer Actions */}
                <div className="px-4.5 py-3 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-semibold border ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                  
                  <button
                    id={`btn_manage_repair_${job.id}`}
                    onClick={() => handleOpenManage(job)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-slate-800 hover:bg-slate-950 rounded-lg cursor-pointer font-semibold transition-all"
                  >
                    <span>إدارة الكرت</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DIALOG 1: REPAIR RECEIVING MODAL (كرت صيانة جديد) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Wrench className="w-5 h-5 text-emerald-650" />
                استقبال جهاز جديد وفتح كرت صيانة
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم العميل صاحب الهاتف *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد عبد الله"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                  />
                </div>

                {/* Customer phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم هاتف العميل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 0944123456"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none font-mono"
                  />
                </div>

                {/* Device model */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">نوع وموديل الهاتف المستلم *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: iPhone 13 Pro Max, S23"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                  />
                </div>

                {/* Device IMEI */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الرقم التسلسلي للجهاز IMEI</label>
                  <input
                    type="text"
                    placeholder="أدخل الـ IMEI المكون من 15 خانة..."
                    value={deviceImei}
                    onChange={(e) => setDeviceImei(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none font-mono"
                  />
                </div>

                {/* problem description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">العطل المشكو منه بدقة (توصيف العطل) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الشاشة مكسورة سوداء، لا يشحن مطلقاً، تهريب شحن..."
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                  />
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">التكلفة التقديرية المتفق عليها</label>
                  <input
                    type="number"
                    min="0"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none font-sans"
                  />
                </div>

                {/* Advance Payment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الدفعة المقدمة المسلمة للمحل</label>
                  <input
                    type="number"
                    min="0"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none font-sans"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">ملاحظات الفحص المبدئي ومظهر الجهاز</label>
                  <textarea
                    placeholder="مثال: الظهر مكسور، الكاميرات سليمة، الكابل المرفق مع العلبة..."
                    rows={2}
                    value={jobNotes}
                    onChange={(e) => setJobNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  id="btn_submit_maintenance_form"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  حفظ وفتح بطاقة صيانة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: MANAGE REPAIR WORKSHOP MODAL (إدارة كرت الصيانة وصرف قطع الغيار) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-2xl max-h-[94vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">كرت #{selectedJob.jobCardNumber}</span>
                <h2 className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Hammer className="w-4.5 h-4.5 text-emerald-650" />
                  إدارة عمليات التصليح الفني لجهاز: {selectedJob.deviceModel}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateJobStatus} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">تحديث حالة الإصلاح</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as MaintenanceStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value={MaintenanceStatus.PENDING}>بانتظار الفحص (Pending)</option>
                    <option value={MaintenanceStatus.IN_PROGRESS}>قيد التصليح (In Progress)</option>
                    <option value={MaintenanceStatus.READY}>جاهز للتسليم (Ready)</option>
                    <option value={MaintenanceStatus.DELIVERED}>تم التسليم والقبض (Delivered)</option>
                    <option value={MaintenanceStatus.CANCELLED}>إلغاء ورفض (Cancelled)</option>
                  </select>
                </div>

                {/* Final actual cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">التكلفة النهائية الفعلية للزبون</label>
                  <input
                    type="number"
                    min="0"
                    value={editFinalCost}
                    onChange={(e) => setEditFinalCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none font-sans"
                  />
                </div>

                {/* Technician Wage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">أجرة الفني / كلفة المهندس اليدوية</label>
                  <input
                    type="number"
                    min="0"
                    value={editTechnicianCost}
                    onChange={(e) => setEditTechnicianCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none font-sans"
                  />
                </div>
              </div>

              {/* Spare Parts Consuming sub-frame */}
              <div className="bg-purple-50/20 p-4 border border-purple-100 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-4.5 h-4.5 text-purple-700" />
                  صرف وإخراج قطع غيار للمادة من المستودع
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Select Part */}
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">اختر قطعة الصيانة *</label>
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none"
                    >
                      <option value="">-- اختر قطعة غيار غشاء/بطارية... --</option>
                      {sparePartsInStore.map(part => (
                        <option key={part.id} value={part.id}>
                          {part.name} (المتوفر: {part.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">الكمية المستهلكة</label>
                    <input
                      type="number"
                      min="1"
                      value={partQuantity}
                      onChange={(e) => setPartQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-none font-sans"
                      disabled={!selectedPartId}
                    />
                  </div>

                  {/* Consume button */}
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      disabled={!selectedPartId}
                      onClick={handleAddPartToRepair}
                      className="w-full py-1.5 bg-purple-700 hover:bg-purple-850 disabled:bg-slate-350 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all text-center"
                    >
                      صرف قطعة
                    </button>
                  </div>
                </div>

                {/* Consumed parts list */}
                <div className="border border-purple-100 bg-white rounded-lg overflow-hidden">
                  <table className="w-full text-right text-[11px] font-medium text-slate-700">
                    <thead className="bg-purple-50 text-purple-900 font-semibold border-b border-purple-100">
                      <tr>
                        <th className="py-2 px-3">اسم المادة المفرغة</th>
                        <th className="py-2 text-center">الكمية</th>
                        <th className="py-2 text-left font-sans">كلفة القطعة مفرد</th>
                        <th className="py-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {activePartsUsed.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-slate-400 font-normal">
                            لم يتم استهلاك أو صرف أية قطع غيار لهذا الكرت بعد.
                          </td>
                        </tr>
                      ) : (
                        activePartsUsed.map((row, index) => (
                          <tr key={index} className="hover:bg-purple-50/20">
                            <td className="py-2 px-3 font-semibold text-slate-800">{row.name}</td>
                            <td className="py-2 text-center font-mono font-bold text-slate-700">{row.quantity}</td>
                            <td className="py-2 text-left font-sans">{row.costPrice.toLocaleString()} {storeCurrency}</td>
                            <td className="py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePartFromRepair(index)}
                                className="text-rose-600 hover:underline cursor-pointer"
                              >
                                حذف
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profitability dynamic preview */}
              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block font-semibold mb-0.5">تكلفة قطع الغيار المسحوبة:</span>
                  <span className="font-bold font-sans text-slate-800">
                    {activePartsUsed.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0).toLocaleString()} {storeCurrency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold mb-0.5">أجرة المهندس الفني:</span>
                  <span className="font-bold font-sans text-slate-800">
                    {editTechnicianCost.toLocaleString()} {storeCurrency}
                  </span>
                </div>
                <div className="border-r border-slate-200 pr-3">
                  <span className="text-emerald-900 block font-bold mb-0.5">صافي الأرباح المقدر للمحل:</span>
                  <span className="text-sm font-black font-sans text-emerald-850">
                    {(
                      editFinalCost - 
                      editTechnicianCost - 
                      activePartsUsed.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0)
                    ).toLocaleString()} {storeCurrency}
                  </span>
                </div>
              </div>

              {/* Notice for Deliver status */}
              {editStatus === MaintenanceStatus.DELIVERED && (
                <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                  💡 **ملاحظة ترحيل محاسبي:** عند تعديل كرت الصيانة إلى الحالة "تم التسليم"، سيقوم نظام الأمين تلقائياً بخصم كميات قطع الغيار المستهلكة من المستودع، وترحيل مبلغ الصافي الباقي ({editFinalCost - selectedJob.advancePayment} {storeCurrency}) مباشرة إلى صندوق النقدية حساب إيرادات أعمال الصيانة.
                </div>
              )}

              {/* Submit buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  id="btn_submit_status_update"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  تثبيت وتحديث الصيانة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
