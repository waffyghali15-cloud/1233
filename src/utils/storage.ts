/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DatabaseState,
  ItemCategory,
  AccountType,
  InvoiceType,
  PaymentType,
  VoucherType,
  MaintenanceStatus,
  InventoryItem,
  Account,
  Invoice,
  Voucher,
  MaintenanceJob,
  StoreSettings
} from "../types/accounting";

const STORAGE_KEY = "AL_AMEEN_MOBILE_DB";

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "الأمين للاتصالات والصيانة",
  phone: "0933-123456",
  address: "دمشق، شارع البحصة - سوق الجوالات",
  currency: "$",
  receiptFooter: "شكراً لثقتكم بنا. الأجهزة المبيعة خاضعة للكفالة المصنعية. قطع الصيانة مكفولة لمدة 10 أيام."
};

export const INITIAL_DATABASE: DatabaseState = {
  settings: DEFAULT_SETTINGS,
  inventory: [
    {
      id: "item_1",
      name: "iPhone 15 Pro Max 256GB",
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      category: ItemCategory.DEVICE,
      costPrice: 1100,
      sellingPrice: 1350,
      stock: 3,
      minStockAlert: 2,
      imeis: ["358972104523912", "358972104523913", "358972104523914"],
      soldImeis: ["358972104523901"]
    },
    {
      id: "item_2",
      name: "Samsung Galaxy S24 Ultra 512GB",
      brand: "Samsung",
      model: "S24 Ultra",
      category: ItemCategory.DEVICE,
      costPrice: 950,
      sellingPrice: 1180,
      stock: 2,
      minStockAlert: 1,
      imeis: ["357281048293011", "357281048293012"],
      soldImeis: []
    },
    {
      id: "item_3",
      name: "شاحن أنكر بقوة 20 واط Type-C",
      brand: "Anker",
      model: "PowerPort III",
      category: ItemCategory.ACCESSORY,
      costPrice: 8,
      sellingPrice: 15,
      stock: 24,
      minStockAlert: 5
    },
    {
      id: "item_4",
      name: "كبل آيفون قماشي Type-C إلى Type-C",
      brand: "Apple",
      model: "USB-C Cable 1m",
      category: ItemCategory.ACCESSORY,
      costPrice: 5,
      sellingPrice: 12,
      stock: 40,
      minStockAlert: 10
    },
    {
      id: "item_5",
      name: "شاشة كاملة آيفون 15 برو",
      brand: "Apple",
      model: "iPhone 15 Pro Display",
      category: ItemCategory.SPARE_PART,
      costPrice: 85,
      sellingPrice: 130,
      stock: 4,
      minStockAlert: 2
    },
    {
      id: "item_6",
      name: "بطارية سامسونج S23 أصلية",
      brand: "Samsung",
      model: "S23 Battery",
      category: ItemCategory.SPARE_PART,
      costPrice: 15,
      sellingPrice: 28,
      stock: 6,
      minStockAlert: 2
    }
  ],
  accounts: [
    {
      id: "acc_safe",
      name: "الصندوق الرئيسي (الكاش)",
      type: AccountType.SAFE,
      initialBalance: 3000,
      currentBalance: 3954, // calculated based on sample events
      notes: "نقدية الصندوق المتوفرة بالمحل"
    },
    {
      id: "acc_cust_cash",
      name: "زبون نقدي (عام)",
      type: AccountType.CUSTOMER,
      initialBalance: 0,
      currentBalance: 0,
      notes: "حساب المبيعات النقدية المباشرة"
    },
    {
      id: "acc_cust_ahmed",
      name: "أحمد العلي (زبون آجل)",
      phone: "0955-443322",
      type: AccountType.CUSTOMER,
      initialBalance: 0,
      currentBalance: 150, // owes us 150 (positive debit balance for client in Al-Ameen)
      notes: "زبون من طرف أبو صالح"
    },
    {
      id: "acc_cust_samer",
      name: "سامر حمامي (زبون صيانة)",
      phone: "0944-778899",
      type: AccountType.CUSTOMER,
      initialBalance: 0,
      currentBalance: 0
    },
    {
      id: "acc_supp_nour",
      name: "شركة النور لتوزيع الأجهزة",
      phone: "011-223344",
      type: AccountType.SUPPLIER,
      initialBalance: 0,
      currentBalance: 850, // we owe them 850 (credit balance for supplier)
      notes: "الموزع الرئيسي للهواتف"
    },
    {
      id: "acc_supp_jad",
      name: "مجموعة جاد لقطع الغيار",
      phone: "0988-112233",
      type: AccountType.SUPPLIER,
      initialBalance: 0,
      currentBalance: 0
    },
    {
      id: "acc_exp_rent",
      name: "حساب مصاريف إيجار المحل",
      type: AccountType.EXPENSE,
      initialBalance: 0,
      currentBalance: 500
    },
    {
      id: "acc_exp_elec",
      name: "حساب مصاريف الكهرباء والإنترنت",
      type: AccountType.EXPENSE,
      initialBalance: 0,
      currentBalance: 45
    },
    {
      id: "acc_rev_maint",
      name: "حساب إيرادات أعمال الصيانة",
      type: AccountType.REVENUE,
      initialBalance: 0,
      currentBalance: 90
    }
  ],
  invoices: [
    {
      id: "inv_1",
      invoiceNumber: "1001",
      type: InvoiceType.PURCHASE,
      date: "2026-06-20T10:30:00Z",
      accountId: "acc_supp_nour",
      accountName: "شركة النور لتوزيع الأجهزة",
      paymentType: PaymentType.CREDIT,
      items: [
        {
          itemId: "item_1",
          name: "iPhone 15 Pro Max 256GB",
          category: ItemCategory.DEVICE,
          quantity: 2,
          price: 1100,
          imeis: ["358972104523912", "358972104523913"],
          total: 2200
        }
      ],
      discount: 0,
      tax: 0,
      totalAmount: 2200,
      netAmount: 2200,
      paidAmount: 1350,
      remainingAmount: 850, // adds to company Nour account balance
      notes: "شراء دفعة آيفون 15 برو ماكس جديدة"
    },
    {
      id: "inv_2",
      invoiceNumber: "2001",
      type: InvoiceType.SALES,
      date: "2026-06-22T16:45:00Z",
      accountId: "acc_cust_ahmed",
      accountName: "أحمد العلي (زبون آجل)",
      paymentType: PaymentType.CREDIT,
      items: [
        {
          itemId: "item_3",
          name: "شاحن أنكر بقوة 20 واط Type-C",
          category: ItemCategory.ACCESSORY,
          quantity: 1,
          price: 14, // discounted price
          total: 14
        },
        {
          itemId: "item_1",
          name: "iPhone 15 Pro Max 256GB",
          category: ItemCategory.DEVICE,
          quantity: 1,
          price: 1350,
          imeis: ["358972104523901"],
          total: 1350
        }
      ],
      discount: 14,
      tax: 0,
      totalAmount: 1364,
      netAmount: 1350,
      paidAmount: 1200,
      remainingAmount: 150, // Ahmed owes 150
      notes: "بيع جهاز آيفون مع شاحن"
    }
  ],
  vouchers: [
    {
      id: "vouch_1",
      voucherNumber: "3001",
      type: VoucherType.PAYMENT,
      date: "2026-06-01T12:00:00Z",
      accountId: "acc_exp_rent",
      accountName: "حساب مصاريف إيجار المحل",
      amount: 500,
      notes: "دفع إيجار المحل لشهر حزيران"
    },
    {
      id: "vouch_2",
      voucherNumber: "3002",
      type: VoucherType.PAYMENT,
      date: "2026-06-05T14:30:00Z",
      accountId: "acc_exp_elec",
      accountName: "حساب مصاريف الكهرباء والإنترنت",
      amount: 45,
      notes: "فاتورة كهرباء المحل + اشتراك الإنترنت"
    },
    {
      id: "vouch_3",
      voucherNumber: "4001",
      type: VoucherType.RECEIPT,
      date: "2026-06-23T11:00:00Z",
      accountId: "acc_cust_ahmed",
      accountName: "أحمد العلي (زبون آجل)",
      amount: 150,
      notes: "دفعة نقداً من حساب مبيع الآيفون"
    }
  ],
  maintenance: [
    {
      id: "maint_1",
      jobCardNumber: "5001",
      customerName: "سليم بركات",
      customerPhone: "0933-445566",
      deviceModel: "iPhone 13 Pro Max",
      imei: "351234567890123",
      problemDescription: "شاشة مكسورة بالكامل ولا تظهر بيانات",
      notes: "الجسم الخارجي فيه خدوش خفيفة، الكاميرا الخلفية سليمة",
      dateReceived: "2026-06-24T09:15:00Z",
      status: MaintenanceStatus.READY,
      estimatedCost: 150,
      advancePayment: 20,
      partsUsed: [
        {
          itemId: "item_5",
          name: "شاشة كاملة آيفون 15 برو", // placeholder for screen repair
          quantity: 1,
          costPrice: 85,
          sellingPrice: 110
        }
      ],
      technicianCost: 15,
      totalPartsCost: 85,
      totalPartsPrice: 110,
      finalCost: 150,
      netProfit: 50 // 150 - 15 (technician) - 85 (parts cost) = 50
    },
    {
      id: "maint_2",
      jobCardNumber: "5002",
      customerName: "رنا اليوسف",
      customerPhone: "0955-223344",
      deviceModel: "Samsung Galaxy S23",
      problemDescription: "البطارية تفرغ بسرعة هائلة وتسخن أثناء الشحن",
      dateReceived: "2026-06-25T11:20:00Z",
      status: MaintenanceStatus.IN_PROGRESS,
      estimatedCost: 45,
      advancePayment: 0,
      partsUsed: [],
      technicianCost: 10,
      totalPartsCost: 0,
      totalPartsPrice: 0
    },
    {
      id: "maint_3",
      jobCardNumber: "5003",
      customerName: "خالد المصري",
      customerPhone: "0944-115599",
      deviceModel: "Redmi Note 12",
      problemDescription: "تغيير سوكة شحن كاملة",
      dateReceived: "2026-06-21T10:00:00Z",
      dateDelivered: "2026-06-22T18:00:00Z",
      status: MaintenanceStatus.DELIVERED,
      estimatedCost: 25,
      advancePayment: 5,
      finalCost: 25,
      technicianCost: 5,
      partsUsed: [],
      totalPartsCost: 0,
      totalPartsPrice: 0,
      netProfit: 20 // 25 - 5 - 0 = 20
    }
  ]
};

// Loading state from localStorage with fallback
export function getDatabase(): DatabaseState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      saveDatabase(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
    return JSON.parse(serialized);
  } catch (e) {
    console.error("Failed to load database from localStorage, using initial", e);
    return INITIAL_DATABASE;
  }
}

// Saving state to localStorage
export function saveDatabase(db: DatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save database to localStorage", e);
  }
}

// Global accounting ledger state recalculation to keep balances perfectly consistent (Al-Ameen audit trial)
export function auditAndRecalculateBalances(db: DatabaseState): DatabaseState {
  const updatedAccounts = db.accounts.map(acc => {
    // start with initial
    let balance = acc.initialBalance;

    if (acc.type === AccountType.SAFE) {
      // SAFE is cash.
      // PLUS:
      // - paidAmount in Sales Invoices (CASH and CREDIT)
      // - Voucher Receipt amounts
      // - Maintenance advancePayments or cashDelivered
      
      // MINUS:
      // - paidAmount in Purchase Invoices
      // - Voucher Payment amounts
      
      let salesPaid = db.invoices
        .filter(i => i.type === InvoiceType.SALES)
        .reduce((sum, i) => sum + i.paidAmount, 0);

      let receipts = db.vouchers
        .filter(v => v.type === VoucherType.RECEIPT)
        .reduce((sum, v) => sum + v.amount, 0);

      let maintenanceAdvance = db.maintenance
        .reduce((sum, m) => sum + m.advancePayment, 0);

      let maintenanceFinalPaid = db.maintenance
        .filter(m => m.status === MaintenanceStatus.DELIVERED)
        .reduce((sum, m) => sum + ((m.finalCost || m.estimatedCost) - m.advancePayment), 0);

      let purchasesPaid = db.invoices
        .filter(i => i.type === InvoiceType.PURCHASE)
        .reduce((sum, i) => sum + i.paidAmount, 0);

      let payments = db.vouchers
        .filter(v => v.type === VoucherType.PAYMENT)
        .reduce((sum, v) => sum + v.amount, 0);

      balance += (salesPaid + receipts + maintenanceAdvance + maintenanceFinalPaid) - (purchasesPaid + payments);
    } 
    else if (acc.type === AccountType.CUSTOMER) {
      // CUSTOMER owes us:
      // Net Amount of SALES Invoice MINUS paidAmount (remainingAmount)
      // MINUS Vouchers of type RECEIPT from this account
      // Note: we can map maintenance as well or keep maintenance directly cash-based or bound to Samer Account if set.
      
      const invoicesDebt = db.invoices
        .filter(i => i.type === InvoiceType.SALES && i.accountId === acc.id)
        .reduce((sum, i) => sum + i.remainingAmount, 0);

      const receiptsPaid = db.vouchers
        .filter(v => v.type === VoucherType.RECEIPT && v.accountId === acc.id)
        .reduce((sum, v) => sum + v.amount, 0);

      balance += invoicesDebt - receiptsPaid;
    } 
    else if (acc.type === AccountType.SUPPLIER) {
      // SUPPLIER we owe them:
      // Net Amount of PURCHASE Invoice MINUS paidAmount (remainingAmount)
      // MINUS Vouchers of type PAYMENT to this supplier
      
      const invoicesCredit = db.invoices
        .filter(i => i.type === InvoiceType.PURCHASE && i.accountId === acc.id)
        .reduce((sum, i) => sum + i.remainingAmount, 0);

      const paymentsPaid = db.vouchers
        .filter(v => v.type === VoucherType.PAYMENT && v.accountId === acc.id)
        .reduce((sum, v) => sum + v.amount, 0);

      balance += invoicesCredit - paymentsPaid;
    } 
    else if (acc.type === AccountType.EXPENSE) {
      // EXPENSES total:
      // Sum of Payment Vouchers tied to this account
      const spent = db.vouchers
        .filter(v => v.type === VoucherType.PAYMENT && v.accountId === acc.id)
        .reduce((sum, v) => sum + v.amount, 0);

      balance += spent;
    } 
    else if (acc.type === AccountType.REVENUE) {
      // REVENUE total:
      // Sum of Receipt Vouchers + Maintenance Revenues + Net Sales profits (if calculated here, but usually sales has own P&L)
      // For this simple ERP, maintenance revenue goes into acc_rev_maint
      if (acc.id === "acc_rev_maint") {
        const deliveredMaint = db.maintenance
          .filter(m => m.status === MaintenanceStatus.DELIVERED)
          .reduce((sum, m) => sum + (m.finalCost || m.estimatedCost), 0);
        
        balance += deliveredMaint;
      } else {
        const customReceipts = db.vouchers
          .filter(v => v.type === VoucherType.RECEIPT && v.accountId === acc.id)
          .reduce((sum, v) => sum + v.amount, 0);
        balance += customReceipts;
      }
    }

    return {
      ...acc,
      currentBalance: balance
    };
  });

  return {
    ...db,
    accounts: updatedAccounts
  };
}

// 1. ADD OR UPDATE INVENTORY ITEM
export function saveInventoryItem(item: InventoryItem): DatabaseState {
  const db = getDatabase();
  const existingIndex = db.inventory.findIndex(i => i.id === item.id);
  
  if (existingIndex >= 0) {
    db.inventory[existingIndex] = item;
  } else {
    db.inventory.push(item);
  }
  
  saveDatabase(db);
  return db;
}

// 2. ADD ACCOUNT
export function saveAccount(account: Account): DatabaseState {
  const db = getDatabase();
  const existingIndex = db.accounts.findIndex(a => a.id === account.id);
  
  if (existingIndex >= 0) {
    db.accounts[existingIndex] = account;
  } else {
    db.accounts.push(account);
  }
  
  const updatedDb = auditAndRecalculateBalances(db);
  saveDatabase(updatedDb);
  return updatedDb;
}

// 3. CREATE INVOICE
export function createInvoice(invoice: Invoice): DatabaseState {
  const db = getDatabase();
  
  // Save the invoice
  db.invoices.push(invoice);
  
  // Update Inventory quantities and IMEIs
  invoice.items.forEach(invItem => {
    const storeItem = db.inventory.find(i => i.id === invItem.itemId);
    if (storeItem) {
      if (invoice.type === InvoiceType.SALES) {
        // Decrease stock
        storeItem.stock = Math.max(0, storeItem.stock - invItem.quantity);
        
        // Handle IMEIs
        if (invItem.imeis && invItem.imeis.length > 0) {
          storeItem.imeis = storeItem.imeis?.filter(imei => !invItem.imeis?.includes(imei)) || [];
          if (!storeItem.soldImeis) storeItem.soldImeis = [];
          storeItem.soldImeis.push(...invItem.imeis);
        }
      } else {
        // Purchase: Increase stock
        storeItem.stock += invItem.quantity;
        
        // Handle IMEIs
        if (invItem.imeis && invItem.imeis.length > 0) {
          if (!storeItem.imeis) storeItem.imeis = [];
          storeItem.imeis.push(...invItem.imeis);
        }
      }
    }
  });

  // Automatically create a voucher log for cash portion of the invoice for auditing history if desired,
  // or let auditAndRecalculateBalances handle it implicitly (we do it implicitly to avoid duplicate logs in vouchers, 
  // but let's audit balances to make sure Safe accounts and Client accounts are perfectly updated).
  
  const updatedDb = auditAndRecalculateBalances(db);
  saveDatabase(updatedDb);
  return updatedDb;
}

// 4. CREATE VOUCHER (سند قبض / سند صرف)
export function createVoucher(voucher: Voucher): DatabaseState {
  const db = getDatabase();
  db.vouchers.push(voucher);
  
  const updatedDb = auditAndRecalculateBalances(db);
  saveDatabase(updatedDb);
  return updatedDb;
}

// 5. CREATE OR UPDATE MAINTENANCE JOB
export function saveMaintenanceJob(job: MaintenanceJob): DatabaseState {
  const db = getDatabase();
  const existingIndex = db.maintenance.findIndex(m => m.id === job.id);
  
  // If moving to DELIVERED, we need to process parts consumed and record revenue
  let oldJob: MaintenanceJob | undefined;
  if (existingIndex >= 0) {
    oldJob = db.maintenance[existingIndex];
    db.maintenance[existingIndex] = job;
  } else {
    db.maintenance.push(job);
  }

  // Stock deduction if status JUST became DELIVERED or parts used got modified
  const statusJustDelivered = job.status === MaintenanceStatus.DELIVERED && (!oldJob || oldJob.status !== MaintenanceStatus.DELIVERED);
  
  if (statusJustDelivered && job.partsUsed && job.partsUsed.length > 0) {
    job.partsUsed.forEach(part => {
      const item = db.inventory.find(i => i.id === part.itemId);
      if (item) {
        item.stock = Math.max(0, item.stock - part.quantity);
      }
    });
  }

  const updatedDb = auditAndRecalculateBalances(db);
  saveDatabase(updatedDb);
  return updatedDb;
}

// 6. UPDATE SETTINGS
export function updateSettings(settings: StoreSettings): DatabaseState {
  const db = getDatabase();
  db.settings = settings;
  saveDatabase(db);
  return db;
}

// 7. RESTORE AND RESET DATABASE
export function resetDatabase(): DatabaseState {
  saveDatabase(INITIAL_DATABASE);
  return INITIAL_DATABASE;
}

export function restoreDatabase(jsonString: string): { success: boolean; error?: string; db?: DatabaseState } {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.inventory && parsed.accounts && parsed.invoices && parsed.vouchers && parsed.maintenance && parsed.settings) {
      saveDatabase(parsed);
      return { success: true, db: parsed };
    }
    return { success: false, error: "بنية الملف غير متوافقة مع ملف قاعدة بيانات الأمين لجوالات." };
  } catch (e) {
    return { success: false, error: "الملف المرفوع ليس ملف JSON صالحاً." };
  }
}
