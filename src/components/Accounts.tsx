/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileSpreadsheet, 
  Calculator, 
  History, 
  TrendingDown, 
  FileText, 
  Info 
} from "lucide-react";
import { 
  DatabaseState, 
  Account, 
  AccountType, 
  Voucher, 
  VoucherType, 
  InvoiceType 
} from "../types/accounting";
import { saveAccount, createVoucher } from "../utils/storage";

interface AccountsProps {
  db: DatabaseState;
  navigationExtraData?: any;
  onRefresh: () => void;
}

interface StatementLine {
  date: string;
  type: string;
  docNumber: string;
  debit: number;  // مدين (زيادة ديون زبون / نقص ديون مورد)
  credit: number; // دائن (دفع الزبون لنا / شراء من مورد بالدين)
  balance: number;
  notes: string;
}

export default function Accounts({ db, navigationExtraData, onRefresh }: AccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>(db.accounts);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("ALL");

  // Create account fields
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [accName, setAccName] = useState("");
  const [accPhone, setAccPhone] = useState("");
  const [accType, setAccType] = useState<AccountType>(AccountType.CUSTOMER);
  const [accInitial, setAccInitial] = useState(0);
  const [accNotes, setAccNotes] = useState("");

  // Create voucher fields
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vType, setVType] = useState<VoucherType>(VoucherType.RECEIPT);
  const [vAccountId, setVAccountId] = useState("");
  const [vAmount, setVAmount] = useState(0);
  const [vNotes, setVNotes] = useState("");

  // Account Statement (كشف حساب) fields
  const [selectedStatementAccountId, setSelectedStatementAccountId] = useState<string | null>(null);
  const [statementLines, setStatementLines] = useState<StatementLine[]>([]);

  useEffect(() => {
    setAccounts(db.accounts);
  }, [db]);

  // Handle direct navigation triggers from Dashboard quick buttons
  useEffect(() => {
    if (navigationExtraData) {
      if (navigationExtraData.openCreateReceipt) {
        handleOpenVoucher(VoucherType.RECEIPT);
      } else if (navigationExtraData.openCreatePayment) {
        handleOpenVoucher(VoucherType.PAYMENT);
      }
    }
  }, [navigationExtraData]);

  // Handle create account submit
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    const newAcc: Account = {
      id: "acc_" + Date.now(),
      name: accName.trim(),
      phone: accPhone.trim() || undefined,
      type: accType,
      initialBalance: Number(accInitial),
      currentBalance: Number(accInitial),
      notes: accNotes.trim() || undefined
    };

    saveAccount(newAcc);
    onRefresh();
    setShowAddAccountModal(false);

    // Reset fields
    setAccName("");
    setAccPhone("");
    setAccInitial(0);
    setAccNotes("");
  };

  // Open Voucher Creation Modal
  const handleOpenVoucher = (type: VoucherType) => {
    setVType(type);
    
    // Default select first available customer for receipt, first supplier for payment
    const defaultAcc = db.accounts.find(
      a => type === VoucherType.RECEIPT 
        ? a.type === AccountType.CUSTOMER 
        : (a.type === AccountType.SUPPLIER || a.type === AccountType.EXPENSE)
    );

    setVAccountId(defaultAcc ? defaultAcc.id : "");
    setVAmount(0);
    setVNotes("");
    setShowVoucherModal(true);
  };

  // Submit Voucher Creation
  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (vAmount <= 0) {
      alert("الرجاء إدخال مبلغ صحيح أكبر من الصفر!");
      return;
    }

    const account = db.accounts.find(a => a.id === vAccountId);
    if (!account) return;

    const newVoucher: Voucher = {
      id: "vouch_" + Date.now(),
      voucherNumber: String(3000 + db.vouchers.length + 1),
      type: vType,
      date: new Date().toISOString(),
      accountId: vAccountId,
      accountName: account.name,
      amount: Number(vAmount),
      notes: vNotes.trim() || undefined
    };

    createVoucher(newVoucher);
    onRefresh();
    setShowVoucherModal(false);

    // If viewing the statement of this account, reload it
    if (selectedStatementAccountId === vAccountId) {
      setTimeout(() => generateStatement(vAccountId), 100);
    }
  };

  // Generate kashf hisab / Account Statement
  const generateStatement = (accId: string) => {
    const targetAcc = db.accounts.find(a => a.id === accId);
    if (!targetAcc) return;

    setSelectedStatementAccountId(accId);

    const lines: StatementLine[] = [];
    let runningBalance = targetAcc.initialBalance;

    // Add initial line if not zero
    if (targetAcc.initialBalance !== 0) {
      lines.push({
        date: "",
        type: "رصيد افتتاحي",
        docNumber: "-",
        debit: targetAcc.initialBalance > 0 ? targetAcc.initialBalance : 0,
        credit: targetAcc.initialBalance < 0 ? Math.abs(targetAcc.initialBalance) : 0,
        balance: runningBalance,
        notes: "الرصيد المدور عند بدء الحساب"
      });
    }

    // Combine invoices and vouchers affecting this account
    // For customers: 
    // Sales Invoice net amount DEBITS (increases what they owe us)
    // Voucher RECEIPT CREDITS (decreases what they owe us)
    // For suppliers:
    // Purchase Invoice net amount CREDITS (increases what we owe them)
    // Voucher PAYMENT DEBITS (decreases what we owe them)

    const relevantInvoices = db.invoices.filter(i => i.accountId === accId);
    const relevantVouchers = db.vouchers.filter(v => v.accountId === accId);

    // Let's gather all transactions, sort by date
    const events: { date: string; type: "invoice" | "voucher"; data: any }[] = [];

    relevantInvoices.forEach(i => events.push({ date: i.date, type: "invoice", data: i }));
    relevantVouchers.forEach(v => events.push({ date: v.date, type: "voucher", data: v }));

    // Sort events chronological
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    events.forEach(ev => {
      let debit = 0;
      let credit = 0;
      let typeLabel = "";
      let docNo = "";
      let notes = "";

      if (ev.type === "invoice") {
        const inv = ev.data;
        docNo = `#${inv.invoiceNumber}`;
        notes = inv.notes || `فاتورة ${inv.type === InvoiceType.SALES ? "مبيعات" : "مشتريات"} بمواد متعددة`;

        if (targetAcc.type === AccountType.CUSTOMER) {
          // Client is debited by sales net invoice total
          debit = inv.netAmount;
          // But wait, the client credited us by paidAmount on the spot
          credit = inv.paidAmount;
          runningBalance += (debit - credit);
          typeLabel = "فاتورة مبيع";
        } else if (targetAcc.type === AccountType.SUPPLIER) {
          // Supplier is credited by purchase net invoice total
          credit = inv.netAmount;
          // We debited them by paidAmount on the spot
          debit = inv.paidAmount;
          runningBalance += (credit - debit);
          typeLabel = "فاتورة شراء";
        }
      } else {
        const vouch = ev.data;
        docNo = `#${vouch.voucherNumber}`;
        notes = vouch.notes || "-";

        if (vouch.type === VoucherType.RECEIPT) {
          credit = vouch.amount;
          runningBalance -= credit;
          typeLabel = "سند قبض";
        } else {
          debit = vouch.amount;
          runningBalance -= debit; // Reduces what we owe supplier, or increases expense
          typeLabel = "سند صرف";
        }
      }

      lines.push({
        date: ev.date,
        type: typeLabel,
        docNumber: docNo,
        debit,
        credit,
        balance: runningBalance,
        notes
      });
    });

    setStatementLines(lines);
  };

  // Filter accounts list
  const filteredAccounts = accounts.filter(acc => {
    // Hide safe cash from default customer/supplier lists unless they choose ALL
    if (accountTypeFilter === "ALL") {
      return acc.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }

    const matchesType = acc.type === accountTypeFilter;
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
                          acc.phone?.includes(searchQuery) || false;

    return matchesType && matchesSearch;
  });

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case AccountType.CUSTOMER: return "حساب زبون (ذمم مدينة)";
      case AccountType.SUPPLIER: return "حساب مورد (ذمم دائنة)";
      case AccountType.SAFE: return "الصندوق والكاش";
      case AccountType.EXPENSE: return "حساب مصاريف";
      case AccountType.REVENUE: return "حساب إيرادات";
    }
  };

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case AccountType.CUSTOMER: return "bg-rose-50 text-rose-800 border-rose-100";
      case AccountType.SUPPLIER: return "bg-amber-50 text-amber-800 border-amber-100";
      case AccountType.SAFE: return "bg-emerald-50 text-emerald-800 border-emerald-100";
      case AccountType.EXPENSE: return "bg-slate-100 text-slate-800 border-slate-200";
      case AccountType.REVENUE: return "bg-purple-50 text-purple-800 border-purple-100";
    }
  };

  // Allowed accounts for voucher dropdown
  const getVoucherAllowedAccounts = () => {
    if (vType === VoucherType.RECEIPT) {
      // Receipts are cash coming in: from Customers or Revenues
      return db.accounts.filter(a => a.type === AccountType.CUSTOMER || a.type === AccountType.REVENUE);
    } else {
      // Payments are cash going out: to Suppliers or Expenses
      return db.accounts.filter(a => a.type === AccountType.SUPPLIER || a.type === AccountType.EXPENSE);
    }
  };

  const selectedAccountDetails = db.accounts.find(a => a.id === selectedStatementAccountId);
  const storeCurrency = db.settings.currency;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-650" />
            الحسابات والعملاء والسندات المالية
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة ديون الزبائن، مستحقات شركات التوريد، تسجيل مصاريف المحل، وتوليد كشوف حسابات تفصيلية دقيقة.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            id="btn_new_account"
            onClick={() => setShowAddAccountModal(true)}
            className="flex items-center gap-1 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            فتح حساب جديد (زبون / مورد)
          </button>
          <button
            id="btn_voucher_receipt"
            onClick={() => handleOpenVoucher(VoucherType.RECEIPT)}
            className="flex items-center gap-1 px-3.5 py-2 bg-purple-750 hover:bg-purple-900 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" />
            سند قبض نقدي
          </button>
          <button
            id="btn_voucher_payment"
            onClick={() => handleOpenVoucher(VoucherType.PAYMENT)}
            className="flex items-center gap-1 px-3.5 py-2 bg-rose-750 hover:bg-rose-900 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <ArrowUpCircle className="w-4 h-4" />
            سند صرف مصاريف
          </button>
        </div>
      </div>

      {/* Main Grid: Accounts List on Left, Account Statement on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACCOUNTS LEDGER SUMMARY (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-750 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              أستاذ الحسابات العام
            </h2>

            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث باسم الحساب أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none transition-all"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1">
                {[
                  { id: "ALL", label: "الكل" },
                  { id: AccountType.CUSTOMER, label: "الزبائن" },
                  { id: AccountType.SUPPLIER, label: "الموردين" },
                  { id: AccountType.EXPENSE, label: "المصاريف" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAccountTypeFilter(tab.id)}
                    className={`px-3 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      accountTypeFilter === tab.id
                        ? "bg-slate-800 text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accounts Listing */}
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
              {filteredAccounts.map(acc => {
                const isDebit = acc.currentBalance > 0;
                return (
                  <div 
                    key={acc.id} 
                    onClick={() => generateStatement(acc.id)}
                    className={`p-3 flex justify-between items-center rounded-xl cursor-pointer transition-all ${
                      selectedStatementAccountId === acc.id 
                        ? "bg-emerald-50/70 border border-emerald-100 shadow-inner" 
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold border ${getAccountTypeColor(acc.type)}`}>
                          {getAccountTypeLabel(acc.type).split(" ")[1] || "حساب"}
                        </span>
                        {acc.phone && <span>الهاتف: {acc.phone}</span>}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className={`text-xs font-mono font-bold ${
                        acc.type === AccountType.CUSTOMER && isDebit ? "text-rose-650" :
                        acc.type === AccountType.SUPPLIER && isDebit ? "text-amber-650" :
                        "text-slate-700"
                      }`}>
                        {acc.currentBalance.toLocaleString()} {storeCurrency}
                      </div>
                      <div className="text-[9px] text-slate-450 mt-1 font-semibold">
                        {acc.type === AccountType.CUSTOMER ? (isDebit ? "مطلوب منه (مدين)" : "مسدد") :
                         acc.type === AccountType.SUPPLIER ? (isDebit ? "يطلبنا (دائن)" : "مسدد") : "رصيد"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED ACCOUNT STATEMENT (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs h-full flex flex-col justify-between">
            {selectedStatementAccountId && selectedAccountDetails ? (
              <div className="space-y-4">
                {/* Statement Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded font-semibold">كشف حساب تفصيلي</span>
                    <h2 className="text-base font-black text-slate-850 mt-1.5">{selectedAccountDetails.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono">رقم الهاتف: {selectedAccountDetails.phone || "غير متوفر"}</p>
                  </div>

                  <div className="text-left font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-500 block font-semibold">الرصيد الختامي الحالي:</span>
                    <span className="text-base font-black text-slate-800">
                      {selectedAccountDetails.currentBalance.toLocaleString()} {storeCurrency}
                    </span>
                  </div>
                </div>

                {/* Audit Statement lines table */}
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-650 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">التاريخ والنوع</th>
                        <th className="py-2.5 text-center">المستند</th>
                        <th className="py-2.5 text-left font-sans">مدين (+)</th>
                        <th className="py-2.5 text-left font-sans">دائن (-)</th>
                        <th className="py-2.5 text-left font-sans">الرصيد الجاري</th>
                        <th className="py-2.5 px-2">البيان والتفصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {statementLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 text-slate-700">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-800">{line.type}</span>
                            <div className="text-[9px] text-slate-450 mt-1 font-mono">
                              {line.date ? new Date(line.date).toLocaleDateString("ar-SY") : "-"}
                            </div>
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-blue-800">{line.docNumber}</td>
                          <td className="py-3 text-left font-sans text-rose-650 font-bold">
                            {line.debit > 0 ? line.debit.toLocaleString() : "-"}
                          </td>
                          <td className="py-3 text-left font-sans text-emerald-700 font-bold">
                            {line.credit > 0 ? line.credit.toLocaleString() : "-"}
                          </td>
                          <td className="py-3 text-left font-sans font-black text-slate-800">
                            {line.balance.toLocaleString()} {storeCurrency}
                          </td>
                          <td className="py-3 px-2 text-slate-500 max-w-[140px] truncate" title={line.notes}>
                            {line.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Print button statement */}
                <div className="pt-4 border-t border-slate-100 text-left print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    طباعة كشف حساب عميل
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <Info className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-650">كشف الحساب التفصيلي</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  الرجاء اختيار أي حساب (زبون أو مورد) من قائمة الأستاذ يمين الشاشة لاستعراض كافة الفواتير والسندات وحركات الدفع والقبض المرتبطة به.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIALOG 1: OPEN ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-sm font-bold text-slate-800">فتح بطاقة حساب مالي جديدة</h2>
              <button 
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم الحساب الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النقاء لقطع الصيانة، زبون أحمد اليوسف"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم الهاتف / الجوال</label>
                <input
                  type="text"
                  placeholder="مثال: 0955123456"
                  value={accPhone}
                  onChange={(e) => setAccPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none font-mono"
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">نوع الحساب المحاسبي</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value={AccountType.CUSTOMER}>زبون / عميل (ذمم مدينة)</option>
                  <option value={AccountType.SUPPLIER}>مورد / شركة توزيع (ذمم دائنة)</option>
                  <option value={AccountType.EXPENSE}>مصاريف عامة للمحل (رواتب، إيجار، الخ)</option>
                  <option value={AccountType.REVENUE}>إيرادات إضافية أخرى</option>
                </select>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الرصيد الافتتاحي المالي ({db.settings.currency})</label>
                <input
                  type="number"
                  placeholder="أدخل 0 إذا كان حساباً جديداً تماماً"
                  value={accInitial}
                  onChange={(e) => setAccInitial(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none font-sans"
                />
                <p className="text-[9px] text-slate-450 mt-1">
                  * للموردين: رصيد موجب يعني نحن مدينون لهم. للزبائن: رصيد موجب يعني هم مدينون لنا.
                </p>
              </div>

              {/* Account notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ملاحظات الحساب</label>
                <textarea
                  placeholder="ملاحظات تفصيلية..."
                  rows={2}
                  value={accNotes}
                  onChange={(e) => setAccNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  id="btn_submit_account_form"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  حفظ وتثبيت الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: VOUCHER REGISTRATION MODAL (سند قبض وسند صرف) */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-650" />
                تحرير {vType === VoucherType.RECEIPT ? "سند قبض نقدي (وارد)" : "سند صرف مصاريف ومستحقات (صادر)"}
              </h2>
              <button 
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="p-5 space-y-4">
              {/* Account Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {vType === VoucherType.RECEIPT ? "مستلم من الحساب (الزبون) *" : "مدفوع لصالح الحساب (مورد / مصاريف) *"}
                </label>
                <select
                  required
                  value={vAccountId}
                  onChange={(e) => setVAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="">-- اختر الحساب المتأثر --</option>
                  {getVoucherAllowedAccounts().map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({getAccountTypeLabel(acc.type).split(" ")[1]} | رصيد الحالي: {acc.currentBalance} {storeCurrency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">المبلغ النقدي المحول * ({storeCurrency})</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="أدخل قيمة السند..."
                  value={vAmount}
                  onChange={(e) => setVAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs outline-none font-sans"
                />
              </div>

              {/* Voucher Number display */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">رقم السند المالي المولد (تلقائي)</label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600">
                  #{3000 + db.vouchers.length + 1}
                </div>
              </div>

              {/* Voucher Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">البيان والتفصيل المالي (السبب) *</label>
                <textarea
                  required
                  placeholder="اكتب هنا تفاصيل الدفعة أو سبب الصرف (مثال: سداد ذمة فاتورة الآيفون، دفعة من كرت الصيانة، سداد فاتورة كهرباء المحل...)"
                  rows={3}
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  id="btn_submit_voucher_form"
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  تثبيت وترحيل السند للدفاتر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
