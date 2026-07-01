import { WebApimanager } from "@/components/utilities/WebApiManager";

/**
 * Fetch current settings for a branch.
 * GET /api/vendor/settings?branchId=X
 */
export const getSettings = async (jwtToken, branchId) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.get(`vendor/settings?branchId=${branchId}`);
  return res?.data || res;
};

/**
 * Save (POST) settings for the first time.
 * POST /api/vendor/settings
 */
export const createSettings = async (jwtToken, payload) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.post("vendor/settings", payload);
  return res;
};

/**
 * Update (PUT) existing settings.
 * PUT /api/vendor/settings
 */
export const updateSettings = async (jwtToken, payload) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.put("vendor/settings", payload);
  return res;
};

/**
 * Default settings payload — mirrors the API spec.
 */
export const DEFAULT_SETTINGS = {
  general: {
    businessCurrency: "₹",
    amountDecimalPlaces: 2,
    enableGstin: false,
    gstType: "Unregistered/Consumer",
    stopSaleNegativeStock: true,
    blockNewItemsFromTxn: false,
    blockNewSupplierFromTxn: false,
    blockNewCustomerFromTxn: false
  },
  backup: {
    autoBackup: false,
    backupIntervalDays: 15
  },
  tax: {
    enableGst: true,
    enableTcs: false,
    enableTds: false
  },
  transaction: {
    invoiceBillNoEditable: false,
    addTimeOnTransactions: false,
    cashSaleByDefault: true,
    billingNameOfCustomer: false,
    customerProfileDetails: false,
    displayPurchasePrice: false,
    showProfitOnSales: false,
    countEnabled: false,
    passcodeForTxnEdit: false,
    txnEditPasscode: null,
    discountDuringPayments: false,
    linkPaymentsToInvoices: false,
    showProfitWhileMakingInvoice: false,
    termsAndConditions: false,
    inclusiveExclusiveTaxOnRate: false,
    displayPurchasePriceOfItems: false,
    transactionWiseTax: false,
    transactionWiseDiscount: false,
    roundOffTotal: true,
    roundOffType: "nearest",
    roundOffValue: 1
  },
  messages: {
    messageType: "Send via Zaanvar",
    sendMessageToSupplier: false,
    sendMessageToCustomer: false,
    sendTxnUpdateToSupplier: false,
    sendTxnUpdateToCustomer: false,
    sendCopyToSelf: false,
    includeSupplierBalance: false,
    includeCustomerBalance: false,
    includeSupplierWebInvoiceLink: false,
    includeCustomerWebInvoiceLink: false,
    autoMessageEvents: {
      purchaseOrder: false,
      purchaseOrderReceive: false,
      paymentOut: false,
      purchaseReturn: false,
      purchaseOrderTransaction: false,
      saleInvoice: false,
      paymentIn: false,
      saleReturn: false,
      saleOrderTransaction: false,
      cancelledInvoice: false
    }
  },
  party: {
    supplierGrouping: false,
    shippingAddress: false,
    printShippingAddress: true,
    manageSupplierStatus: true,
    enablePaymentReminder: true,
    paymentReminderDays: 1,
    reminderMessage: "",
    additionalFields: [],
    enableLoyaltyPoint: false
  },
  item: {
    barcodeScan: false,
    showLowStockDialog: false,
    updateSalePriceFromTxn: false,
    calculateTaxBasedOnMrp: false,
    manageItemStatus: true,
    customFields: []
  }
};

