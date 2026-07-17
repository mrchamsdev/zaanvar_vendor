import { WebApimanager } from "@/components/utilities/WebApiManager";

/**
 * Fetch current settings for a branch.
 * GET /api/vendor/settings/{branchId}
 */
export const getSettings = async (jwtToken, branchId) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.get(`vendor/settings/${branchId}`);
  const data = res?.data || res;
  if (data?.settings?.transaction) {
    data.settings.transaction.displayPurchasePriceOfItems = true;
  } else if (data?.transaction) {
    data.transaction.displayPurchasePriceOfItems = true;
  }
  return data;
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
 * Trigger PUT /api/vendor/settings/messages/{messageId}
 */
export const triggerVendorMessage = async (jwtToken, messageId) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.put(`vendor/settings/messages/${messageId}`, { status: "ok" });
  return res;
};

/**
 * Fetch all terms and conditions
 * GET /api/vendor/terms-and-conditions?branchId={branchId}
 */
export const getTermsAndConditions = async (jwtToken, branchId) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.get(`vendor/terms-and-conditions?branchId=${branchId}`);
  return res;
};

/**
 * Fetch term by id
 * GET /api/vendor/terms-and-conditions/{id}
 */
export const getTermAndConditionById = async (jwtToken, id) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.get(`vendor/terms-and-conditions/${id}`);
  return res;
};

/**
 * Create/Update term and condition
 * POST /api/vendor/terms-and-conditions
 */
export const createTermAndCondition = async (jwtToken, payload) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.post("vendor/terms-and-conditions", payload);
  return res;
};

/**
 * Delete term and condition
 * DELETE /api/vendor/terms-and-conditions/{id}
 */
export const deleteTermAndCondition = async (jwtToken, id) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.delete(`vendor/terms-and-conditions/${id}`);
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
    dueDatesAndPaymentNotifications: false,
    inclusiveExclusiveTaxOnRate: false,
    displayPurchasePriceOfItems: true,
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
    sendPurchaseOrderMessageToSupplier: false,
    sendReceivedOrderMessageToSupplier: false,
    sendPaymentOutMessageToSupplier: false,
    sendPurchaseReturnMessageToSupplier: false,
    sendSaleInvoiceMessageToCustomer: false,
    sendPaymentInMessageToCustomer: false,
    sendSaleReturnMessageToCustomer: false,
    sendCancelInvoiceMessageToCustomer: false,
    includeSupplierBalance: false,
    includeCustomerBalance: false,
    includeSupplierWebInvoiceLink: false,
    includeCustomerWebInvoiceLink: false,
    autoMessageEvents: []
  },
  party: {
    supplierGrouping: false,
    shippingAddress: false,
    printShippingAddress: true,
    customerShippingAddress: false,
    customerPrintShippingAddress: true,
    manageSupplierStatus: true,
    enablePaymentReminder: true,
    paymentReminderDays: 1,
    reminderMessage: "",
    additionalFields: [],
    customerAdditionalFields: [],
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

/**
 * Get tax rates for a branch
 * GET /api/vendor/taxes/branch/{branchId}
 */
export const getTaxRates = async (jwtToken, branchId) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.get(`vendor/taxes/branch/${branchId}`);
  return res;
};

/**
 * Create a new tax rate
 * POST /api/vendor/taxes
 */
export const createTaxRate = async (jwtToken, payload) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.post("vendor/taxes", payload);
  return res;
};

/**
 * Update an existing tax rate
 * PUT /api/vendor/taxes/{id}
 */
export const updateTaxRate = async (jwtToken, id, payload) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.put(`vendor/taxes/${id}`, payload);
  return res;
};

/**
 * Delete a tax rate
 * DELETE /api/vendor/taxes/{id}
 */
export const deleteTaxRate = async (jwtToken, id) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.delete(`vendor/taxes/${id}`);
  return res;
};

/**
 * Get tax groups for a branch
 * GET /api/vendor/tax-groups/branch/{branchId}
 */
export const getTaxGroups = async (jwtToken, branchId) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.get(`vendor/tax-groups/branch/${branchId}`);
  return res;
};

/**
 * Create a new tax group
 * POST /api/vendor/tax-groups
 */
export const createTaxGroup = async (jwtToken, payload) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.post("vendor/tax-groups", payload);
  return res;
};

/**
 * Update an existing tax group
 * PUT /api/vendor/tax-groups/{id}
 */
export const updateTaxGroup = async (jwtToken, id, payload) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.put(`vendor/tax-groups/${id}`, payload);
  return res;
};

/**
 * Delete a tax group
 * DELETE /api/vendor/tax-groups/{id}
 */
export const deleteTaxGroup = async (jwtToken, id) => {
  const webApi = new WebApimanager(jwtToken);
  const res = await webApi.delete(`vendor/tax-groups/${id}`);
  return res;
};

