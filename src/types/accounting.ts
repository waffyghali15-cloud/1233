/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ItemCategory {
  DEVICE = "DEVICE",       // أجهزة هواتف محددة بـ IMEI
  ACCESSORY = "ACCESSORY",   // إكسسوارات (شواحن، سماعات، الخ) بالكمية
  SPARE_PART = "SPARE_PART"  // قطع غيار للصيانة (شاشات، بطاريات، الخ)
}

export interface InventoryItem {
  id: string;
  name: string;          // اسم المادة (مثال: iPhone 15 Pro Max)
  brand: string;         // الماركة (مثال: Apple)
  model: string;         // الموديل
  category: ItemCategory;
  costPrice: number;     // سعر التكلفة
  sellingPrice: number;  // سعر المبيع
  stock: number;         // الكمية الحالية المتوفرة
  minStockAlert: number; // الحد الأدنى للتنبيه بنقص المادة
  imeis?: string[];      // الأرقام التسلسلية للأجهزة المتوفرة
  soldImeis?: string[];  // الأرقام التسلسلية المباعة سابقاً
}

export enum AccountType {
  CUSTOMER = "CUSTOMER",     // زبون (ذمم مدينة)
  SUPPLIER = "SUPPLIER",     // مورد (ذمم دائنة)
  SAFE = "SAFE",             // الصندوق / الخزينة الرئيسي
  EXPENSE = "EXPENSE",       // حساب مصاريف (رواتب، إيجار، كهرباء، الخ)
  REVENUE = "REVENUE"        // حساب إيرادات أخرى (مثل إيرادات صيانة أو أرباح بيع)
}

export interface Account {
  id: string;
  name: string;             // اسم الحساب (مثال: شركة النور للموزعين، زبون نقدي، زبون أحمد)
  phone?: string;
  type: AccountType;
  initialBalance: number;   // الرصيد الافتتاحي (موجب دائن، سالب مدين)
  currentBalance: number;   // الرصيد الحالي
  notes?: string;
}

export enum InvoiceType {
  SALES = "SALES",       // فاتورة مبيع
  PURCHASE = "PURCHASE"   // فاتورة شراء
}

export enum PaymentType {
  CASH = "CASH",     // نقدي
  CREDIT = "CREDIT"   // آجل (ذمم)
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  price: number;       // سعر المادة في هذه الفاتورة
  imeis?: string[];    // قائمة الـ IMEI المبيعة أو المشتراة في هذه الفاتورة
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // رقم الفاتورة التسلسلي
  type: InvoiceType;
  date: string;          // تاريخ الفاتورة
  accountId: string;     // الحساب المرتبط (زبون للمبيع، مورد للشراء)
  accountName: string;   // اسم الحساب وقت الفاتورة للسرعة
  items: InvoiceItem[];
  discount: number;      // الخصم الممنوح
  tax: number;           // الضريبة (إن وجدت)
  totalAmount: number;   // الإجمالي قبل الخصم
  netAmount: number;     // الصافي النهائي بعد الخصم والضريبة
  paidAmount: number;    // المبلغ المدفوع
  remainingAmount: number; // المبلغ المتبقي (الآجل)
  paymentType: PaymentType;
  notes?: string;
}

export enum VoucherType {
  RECEIPT = "RECEIPT", // سند قبض (دخول أموال للصندوق)
  PAYMENT = "PAYMENT"  // سند صرف (خروج أموال من الصندوق)
}

export interface Voucher {
  id: string;
  voucherNumber: string; // رقم السند التسلسلي
  type: VoucherType;
  date: string;
  accountId: string;     // الحساب المتأثر (مثال: حساب زبون دفع كاش، أو حساب كهرباء صرفنا له)
  accountName: string;
  amount: number;        // المبلغ
  notes?: string;        // البيان التفصيلي للسند
}

export enum MaintenanceStatus {
  PENDING = "PENDING",         // قيد الانتظار
  IN_PROGRESS = "IN_PROGRESS", // قيد الإصلاح
  READY = "READY",             // جاهز للتسليم
  DELIVERED = "DELIVERED",     // تم التسليم والقبض
  CANCELLED = "CANCELLED"      // ملغي (تم الرفض أو تعذر الإصلاح)
}

export interface MaintenancePart {
  itemId: string;
  name: string;
  quantity: number;
  costPrice: number;   // سعر تكلفة القطعة المستخدمة
  sellingPrice: number; // سعر مبيع القطعة للزبون
}

export interface MaintenanceJob {
  id: string;
  jobCardNumber: string;  // رقم كرت الصيانة
  customerName: string;
  customerPhone: string;
  deviceModel: string;    // جهاز الزبون (مثال: Samsung S23 Ultra)
  imei?: string;          // IMEI الخاص بالجهاز إن وجد
  problemDescription: string; // العطل المشكو منه
  notes?: string;         // ملاحظات الفحص أو المظهر الخارجي
  dateReceived: string;   // تاريخ الاستلام
  dateDelivered?: string; // تاريخ التسليم للزبون
  status: MaintenanceStatus;
  
  // الشق المالي للصيانة
  estimatedCost: number;  // التكلفة التقديرية المتفق عليها
  advancePayment: number; // الدفعة المقدمة من الزبون
  finalCost?: number;     // التكلفة النهائية الفعلية المحددة عند الإصلاح
  technicianCost: number; // كلفة المهندس / الفني (أجرة التصليح يدوياً)
  partsUsed: MaintenancePart[]; // قطع الغيار المستخدمة من المستودع
  
  // الأرباح والاحتساب
  totalPartsCost: number; // إجمالي كلفة قطع الغيار
  totalPartsPrice: number; // إجمالي سعر مبيع قطع الغيار للزبون
  netProfit?: number;     // صافي ربح الصيانة = التكلفة النهائية - كلفة الفني - إجمالي كلفة قطع الغيار
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  currency: string;      // العملة (د.أ، ل.س، ر.س، $، الخ)
  logoUrl?: string;
  receiptFooter: string; // تذييل الفاتورة المطبوعة
}

export interface DatabaseState {
  inventory: InventoryItem[];
  accounts: Account[];
  invoices: Invoice[];
  vouchers: Voucher[];
  maintenance: MaintenanceJob[];
  settings: StoreSettings;
}
