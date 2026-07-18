import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import useStore from "@/components/state/useStore";
import { purchaseService } from "../../../services/purchaseService";
import { saleService } from "../../../services/saleService";
import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";
import { getAmountDecimalPlaces } from "@/components/utilities/formatAmount";
import { parseApiToLocal, parseWallClockDate } from "../../../utilities/date-time-utils";

const InvoiceDynamic = () => {
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const { type, id } = router.query;
  const { jwtToken, userInfo, _hasHydrated } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!_hasHydrated) return; // wait for Zustand to rehydrate from localStorage
    if (jwtToken && type && id) {
      fetchData();
    } else if (_hasHydrated && !jwtToken) {
      setLoading(false); // stop loading — user is not logged in
    }
  }, [_hasHydrated, jwtToken, type, id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = null;
      switch (type) {
        case "purchase-order":
          res = await purchaseService.getPurchaseRequestSummary(jwtToken, id);
          break;
        case "received-order":
          res = await purchaseService.getBillById(jwtToken, id);
          break;
        case "payment-out":
          res = await purchaseService.getTransactionById(jwtToken, id);
          break;
        case "purchase-return":
          res = await purchaseService.getReturnById(jwtToken, id);
          break;
        case "sale-invoice":
          res = await saleService.getOrderById(jwtToken, id);
          break;
        case "sale-return":
          res = await saleService.getSalesReturnById(jwtToken, id);
          break;
        case "payment-in":
          res = await saleService.getPaymentById(jwtToken, id);
          break;
        default:
          throw new Error("Invalid transaction type");
      }

      if (res && (res.status === "success" || res.data)) {
        setData(res.data || res);
      } else {
        setError("Transaction details not found.");
      }
    } catch (err) {
      console.error("Error fetching print data:", err);
      setError(err.message || "Failed to load transaction data.");
    } finally {
      setLoading(false);
    }
  };

  const formatDatePretty = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = parseWallClockDate(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const formatVal = (amount) => {
    const dec = getAmountDecimalPlaces();
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(amount || 0);
  };

  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
      return 'Large Amount';
    };

    const result = convert(Math.floor(num));
    return result ? (result + 'Rupees only').toUpperCase() : 'ZERO RUPEES ONLY';
  };

  const getDocDetails = () => {
    const details = {
      title: "RECEIPT",
      rowTitle: "AMOUNT PAID",
      partyLabel: "Paid To:",
      detailsLabel: "Supplier Payment Details",
      noLabel: "Receipt No",
      no: "-",
      date: "-",
      partyName: "-",
      partyPhone: "-",
      items: [],
      totals: [],
      grandTotalValue: 0,
      paymentMode: "CASH",
      refNo: "-",
      paymentRows: [],
      fromBranch: "-",
      branchAddress: "-",
      receivedDate: "-",
      status: "-",
      originalReceiptNo: "-",
      billDate: "-",
      reason: "-",
      amounts: [],
    };

    if (!data) return details;

    switch (type) {
      case "purchase-order":
        details.title = `Purchase Order ${(data.orderStatus || "order placed").toUpperCase()}`;
        details.rowTitle = "TOTAL AMOUNT";
        details.partyLabel = "Bill To:";
        details.detailsLabel = "Invoice Details";
        details.noLabel = "Order No";
        details.no = data.orderNo || `PO-${String(data.productsPurchaseRqstID || data.purchaseRequestId || 0).padStart(6, '0')}`;
        details.date = formatDatePretty(data.orderDate);
        details.partyName = data.supplier?.supplierName || "Supplier";
        details.partyPhone = data.supplier?.phone || "-";

        details.fromBranch = data.branchName || userInfo?.companyName || "Hello 11";
        details.branchAddress = data.branchAddress?.addressText || "Kukatpally, IN";

        details.items = (data.items || []).map((item) => ({
          name: item.product?.productName || item.productName || "Product",
          qty: item.orderQuantity || item.qty || 0,
          unit: item.productVariantName || item.unit || "-",
          rate: item.costPrice || 0,
          total: (item.orderQuantity || item.qty || 0) * (item.costPrice || 0),
        }));
        details.grandTotalValue = details.items.reduce((sum, i) => sum + i.total, 0);
        details.amounts = [
          { label: "TOTAL AMOUNT", val: details.grandTotalValue }
        ];
        break;

      case "received-order":
        details.title = "Received Order Receipt";
        details.rowTitle = "TOTAL AMOUNT";
        details.partyLabel = "Bill To:";
        details.detailsLabel = "Invoice Details";
        details.noLabel = "Bill No";
        details.no = data.billNo || `PB-${String(data.productsBillID || 0).padStart(6, '0')}`;
        details.date = formatDatePretty(data.billDate);
        details.partyName = data.supplier?.supplierName || "Supplier";
        details.partyPhone = data.supplier?.phone || "-";

        details.fromBranch = data.branchName || userInfo?.companyName || "Hello 11";
        details.branchAddress = data.branchAddress?.addressText || "Kukatpally, IN";
        details.receivedDate = formatDatePretty(data.modifiedDate || data.billDate);
        details.status = "RECEIVED";

        details.items = (data.items || []).map((item) => {
          const qty = item.billQuantity || item.qty || 0;
          const rate = item.costPrice || 0;
          const taxPct = item.taxPercent || 0;
          const taxAmt = item.taxAmount || (rate * qty * taxPct) / 100;
          const discPct = item.discountPercent || 0;
          const discAmt = item.discountAmount || (rate * qty * discPct) / 100;
          const total = (qty * rate) + taxAmt - discAmt;
          return {
            name: item.product?.productName || item.productName || "Product",
            qty,
            unit: item.productVariantName || item.unit || "-",
            rate,
            taxPercent: taxPct,
            taxAmount: taxAmt,
            discountPercent: discPct,
            discountAmount: discAmt,
            total,
          };
        });

        const totalQty = details.items.reduce((sum, i) => sum + i.qty, 0);
        const totalPrice = details.items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
        const totalTax = details.items.reduce((sum, i) => sum + i.taxAmount, 0);
        const totalDiscount = details.items.reduce((sum, i) => sum + i.discountAmount, 0);

        details.grandTotalValue = data.totalAmount || (totalPrice + totalTax - totalDiscount);
        details.amounts = [
          { label: "TOTAL QUANTITY", val: totalQty, noFormat: true },
          { label: "TOTAL PRICE", val: totalPrice },
          { label: "TOTAL TAX", val: totalTax },
          { label: "TOTAL DISCOUNT", val: totalDiscount },
          { label: "TOTAL AMOUNT", val: details.grandTotalValue },
        ];
        break;

      case "payment-out":
        details.title = "PAYMENT OUT RECEIPT";
        details.rowTitle = "AMOUNT PAID";
        details.partyLabel = "Paid To:";
        details.detailsLabel = "Supplier Payment Details";
        details.noLabel = "Receipt No";
        details.no = data.suppliersTransactionId || data.transactionNo || "-";
        details.date = formatDatePretty(data.transactionDate || data.userTransactionDate);
        details.partyName = data.supplier?.supplierName || data.supplierName || data.transactionInfo || "Supplier";
        details.partyPhone = data.supplier?.phone || "-";
        // Build payment rows from main + splitTransactions
        const poRows = [
          { mode: (data.paymentType || data.paymentMode || "Cash").toUpperCase(), ref: data.transactionNo || "-", amount: parseFloat(data.amount || 0) },
          ...(data.splitTransactions || []).map(st => ({
            mode: (st.paymentType || st.paymentMethod || "Cash").toUpperCase(),
            ref: st.transactionRef || st.referenceNumber || "-",
            amount: parseFloat(st.paidAmount || st.amount || 0),
          })),
        ];
        details.paymentRows = poRows;
        details.grandTotalValue = poRows.reduce((sum, r) => sum + r.amount, 0);
        details.paymentMode = poRows[0]?.mode || "CASH";
        details.refNo = poRows[0]?.ref || "-";
        break;

      case "purchase-return":
        details.title = "PURCHASE RETURN";
        details.rowTitle = "RETURN AMOUNT";
        details.partyLabel = "Bill To:";
        details.detailsLabel = "Return Details";
        details.noLabel = "Return No";
        details.no = data.returnNo || `PR-${String(data.returnProductsId || 0).padStart(6, '0')}`;
        details.date = formatDatePretty(data.returnDate);
        details.partyName = data.supplierName || "Supplier";
        details.partyPhone = data.supplierPhone || "-";

        details.originalReceiptNo = data.productsBill?.billNo || "1000124";
        details.billDate = formatDatePretty(data.productsBill?.billDate || data.returnDate);
        details.reason = data.reason || "Manual Return";

        details.items = (data.items || []).map((item) => {
          const qty = item.returnQty || item.qty || 0;
          const rate = item.costPrice || 0;
          const taxPct = item.taxPercent || 0;
          const taxAmt = item.taxAmount || (rate * qty * taxPct) / 100;
          const discPct = item.discountPercent || 0;
          const discAmt = item.discountAmount || (rate * qty * discPct) / 100;
          const total = (qty * rate) + taxAmt - discAmt;
          return {
            name: item.productName || item.product?.productName || "Product",
            qty,
            unit: item.productVariantName || item.unit || "-",
            rate,
            taxPercent: taxPct,
            taxAmount: taxAmt,
            discountPercent: discPct,
            discountAmount: discAmt,
            total,
          };
        });

        const retQty = details.items.reduce((sum, i) => sum + i.qty, 0);
        const retPrice = details.items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
        const retTax = details.items.reduce((sum, i) => sum + i.taxAmount, 0);
        const retDiscount = details.items.reduce((sum, i) => sum + i.discountAmount, 0);

        details.grandTotalValue = data.returnAmount || data.totalAmount || (retPrice + retTax - retDiscount);
        details.amounts = [
          { label: "TOTAL QUANTITY", val: retQty, noFormat: true },
          { label: "TOTAL PRICE", val: retPrice },
          { label: "TOTAL TAX", val: retTax },
          { label: "TOTAL DISCOUNT", val: retDiscount },
          { label: "GRAND TOTAL", val: details.grandTotalValue },
        ];
        break;

      case "sale-invoice":
        details.title = "SALE INVOICE";
        details.rowTitle = "AMOUNT DUE";
        details.partyLabel = "Bill To:";
        details.detailsLabel = "Invoice Details";
        details.noLabel = "Invoice No";
        details.no = data.invoiceNumber || data.userOrderId || "-";
        details.date = formatDatePretty(data.invoiceDate || data.createdDate);
        details.partyName = data.customer ? `${data.customer.firstName} ${data.customer.lastName || ""}`.trim() : "Customer";
        details.partyPhone = data.customer?.phoneNumber || "-";
        details.partyAddress = data.customer?.shippingAddress || data.customer?.serviceableAddress || "";

        details.fromBranch = data.branchName || userInfo?.companyName || "Hello 11";
        details.branchAddress = data.branchAddress?.addressText || "Kukatpally, IN";
        details.status = data.status || "Pending";
        details.orderId = data.userOrderId || "-";

        details.items = (data.cartItems || data.items || []).map((item) => {
          const variant = item.variant || item.Variant || {};
          const vType = variant.variantType || {};
          const qty = item.quantity || item.qty || 0;
          const rate = parseFloat(item.sellingPrice || item.salePrice || 0);
          const taxPct = parseFloat(item.taxPercentage || item.taxPercent || 0);
          const taxAmt = parseFloat(item.taxAmount || 0) || (rate * qty * taxPct) / 100;
          const discPct = parseFloat(item.discountForItem || item.discountPercent || 0);
          const discAmt = (rate * qty * discPct) / 100;
          const total = parseFloat(item.itemTotal || 0) || ((qty * rate) + taxAmt - discAmt);
          return {
            name: item.productName || item.product?.productName || variant.SKU || "Product",
            qty,
            unit: vType.size || vType.type || item.productVariantName || item.unit || "-",
            rate,
            taxPercent: taxPct,
            taxAmount: taxAmt,
            discountPercent: discPct,
            discountAmount: discAmt,
            total,
          };
        });

        const saleQty = details.items.reduce((sum, i) => sum + i.qty, 0);
        const saleSubtotal = details.items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
        const saleTax = details.items.reduce((sum, i) => sum + i.taxAmount, 0);
        const saleDiscount = details.items.reduce((sum, i) => sum + i.discountAmount, 0);
        const saleGrandTotal = details.items.reduce((sum, i) => sum + i.total, 0);
        const salePaid = parseFloat(data.paidAmount || 0);
        const saleBalance = parseFloat(data.dueAmount || 0) || (saleGrandTotal - salePaid);

        details.grandTotalValue = saleGrandTotal || data.totalAmount || data.grandTotal || 0;
        details.amounts = [
          { label: "TOTAL QUANTITY", val: saleQty, noFormat: true },
          { label: "SUBTOTAL", val: saleSubtotal },
          { label: "TOTAL DISCOUNT", val: saleDiscount },
          { label: "TOTAL TAX", val: saleTax },
          { label: "GRAND TOTAL", val: details.grandTotalValue, highlight: true },
          { label: "AMOUNT PAID", val: salePaid },
          { label: "BALANCE DUE", val: saleBalance },
        ];
        break;

      case "sale-return":
        details.title = "CREDIT NOTE (SALE RETURN)";
        details.rowTitle = "RETURN AMOUNT";
        details.partyLabel = "Returned From:";
        details.detailsLabel = "Credit Note Details";
        details.noLabel = "Return No";
        details.no = data.returnNo || `SR-${data.customerReturnId}` || "-";
        details.date = formatDatePretty(data.returnDate || data.createdDate);
        details.partyName = data.customer ? `${data.customer.firstName} ${data.customer.lastName || ""}`.trim() : "Customer";
        details.partyPhone = data.customer?.phoneNumber || "-";

        details.fromBranch = data.branchName || userInfo?.companyName || "Hello 11";
        details.branchAddress = data.branchAddress?.addressText || "Kukatpally, IN";
        details.originalReceiptNo = data.userOrderId || "-";
        details.billDate = formatDatePretty(data.invoiceDate || data.orderDate || data.createdDate);
        details.reason = data.returnReason || "Manual Return";

        details.items = (data.items || data.cartItems || []).map((item) => {
          const qty = item.quantity || item.returnQuantity || item.qty || 0;
          const rate = parseFloat(item.sellingPrice || item.price || 0);
          const taxPct = parseFloat(item.taxPercentage || item.taxPercent || 0);
          const discPct = parseFloat(item.discountPercentage || item.discountForItem || item.discountPercent || 0);
          // Discount is applied first, then tax is computed on the post-discount amount
          // (matches AddSalesReturn.js logic for both form state and PDF summary)
          const discAmt = (rate * qty * discPct) / 100;
          const taxableAmt = (rate * qty) - discAmt;
          const taxAmt = parseFloat(item.taxAmount || 0) || (taxableAmt * taxPct) / 100;
          const total = parseFloat(item.itemTotal || 0) || (taxableAmt + taxAmt);
          return {
            name: item.productName || item.product?.productName || "Product",
            qty,
            unit: item.productVariantName || item.unit || "-",
            rate,
            taxPercent: taxPct,
            taxAmount: taxAmt,
            discountPercent: discPct,
            discountAmount: discAmt,
            total,
          };
        });

        const retSalesQty = details.items.reduce((sum, i) => sum + i.qty, 0);
        const retSalesPrice = details.items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
        const retSalesTax = details.items.reduce((sum, i) => sum + i.taxAmount, 0);
        const retSalesDiscount = details.items.reduce((sum, i) => sum + i.discountAmount, 0);
        const retSalesGrandTotal = details.items.reduce((sum, i) => sum + i.total, 0);

        // Prefer API-stored totalReturnAmount so invoice matches what was saved
        details.grandTotalValue = parseFloat(data.totalReturnAmount || 0) || retSalesGrandTotal || parseFloat(data.totalAmount || 0) || 0;
        details.amounts = [
          { label: "TOTAL QUANTITY", val: retSalesQty, noFormat: true },
          { label: "TOTAL PRICE", val: retSalesPrice },
          { label: "TOTAL TAX", val: retSalesTax },
          { label: "TOTAL DISCOUNT", val: retSalesDiscount },
          { label: "GRAND TOTAL", val: details.grandTotalValue },
        ];
        break;

      case "payment-in":
        details.title = "PAYMENT IN RECEIPT";
        details.rowTitle = "AMOUNT RECEIVED";
        details.partyLabel = "Received From:";
        details.detailsLabel = "Customer Payment Details";
        details.noLabel = "Receipt No";
        details.no = data.paymentId || data.paymentNo || data.customerPaymentId || "-";
        details.date = formatDatePretty(data.paymentDate || data.createdDate);
        details.partyName = data.customer ? `${data.customer.firstName} ${data.customer.lastName || ""}`.trim() : "Customer";
        details.partyPhone = data.customer?.phoneNumber || "-";
        // Build payment rows from paymentMethods array
        const piMethods = data.paymentMethods || [];
        if (piMethods.length > 0) {
          details.paymentRows = piMethods.map(pm => ({
            mode: (pm.paymentMethod || pm.method || "Cash").toUpperCase(),
            ref: pm.transactionRef || pm.referenceNumber || "-",
            amount: parseFloat(pm.amount || 0),
          }));
        } else {
          details.paymentRows = [{
            mode: (data.paymentMethod || data.paymentMode || "CASH").toUpperCase(),
            ref: data.transactionRef || data.referenceNumber || details.no,
            amount: parseFloat(data.amount || data.paidAmount || 0),
          }];
        }
        details.grandTotalValue = details.paymentRows.reduce((sum, r) => sum + r.amount, 0);
        details.paymentMode = details.paymentRows[0]?.mode || "CASH";
        details.refNo = details.paymentRows[0]?.ref || "-";
        break;
    }

    return details;
  };

  if (loading || !_hasHydrated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <h3>Loading invoice details...</h3>
      </div>
    );
  }

  if (!jwtToken) {
    return (
      <div style={{ padding: 24, textAlign: "center", fontFamily: "sans-serif" }}>
        <h3 style={{ color: "#e9315d" }}>Session expired. Please log in to view this invoice.</h3>
        <button onClick={() => router.push("/login")} style={{ padding: "8px 16px", marginTop: 16, cursor: "pointer", background: "#e9315d", color: "#fff", border: "none", borderRadius: 4 }}>Go to Login</button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center", fontFamily: "sans-serif" }}>
        <h3 style={{ color: "#e9315d" }}>{error}</h3>
        <button onClick={() => router.back()} style={{ padding: "8px 16px", marginTop: 16, cursor: "pointer" }}>Go Back</button>
      </div>
    );
  }

  const details = getDocDetails();
  const companyName = userInfo?.companyName || "Hello 11";
  const displayPhone = userInfo?.phone || "+919248176187";

  const isVoucher = ["payment-out", "payment-in"].includes(type);

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "30px 15px", fontFamily: "sans-serif" }}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`
        * { box-sizing: border-box; }

        /* ─── MOBILE ≤ 600px ─── */
        @media (max-width: 600px) {
          .inv-back-wrap { margin: 0 10px 10px !important; }

          /* card: no side borders, flush to screen */
          .inv-card {
            border-left: none !important;
            border-right: none !important;
            box-shadow: none !important;
          }

          /* title bar */
          .inv-title-bar { font-size: 14px !important; padding: 10px 14px !important; letter-spacing: 0 !important; }

          /* company header: keep row but allow wrap */
          .inv-firm-header {
            flex-wrap: wrap !important;
            padding: 12px 14px !important;
            gap: 8px !important;
          }
          .inv-firm-header h2 { font-size: 17px !important; }
          .inv-firm-header .inv-logo {
            width: 60px !important;
            height: 38px !important;
            font-size: 8px !important;
          }

          /* party block: stack vertically */
          .inv-party-block {
            flex-direction: column !important;
            gap: 0 !important;
            padding: 12px 14px !important;
          }
          .inv-party-right {
            text-align: left !important;
            width: 100% !important;
            border-top: 1px solid #eee !important;
            padding-top: 10px !important;
            margin-top: 10px !important;
          }
          .inv-party-right > div:first-child { margin-bottom: 4px !important; }
          .inv-party-right div { font-size: 13px !important; line-height: 1.7 !important; }

          /* amount banner: never let amount wrap to second line */
          .inv-amount-banner {
            font-size: 13px !important;
            padding: 10px 14px !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .inv-amount-val { white-space: nowrap !important; }

          /* table: horizontal scroll so columns stay readable */
          .inv-table-outer { position: relative !important; }
          .inv-table-wrap {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: thin !important;
            scrollbar-color: #e9315d #f0f0f0 !important;
          }
          .inv-table-wrap::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .inv-table-wrap::-webkit-scrollbar-track {
            background: #f0f0f0 !important;
            border-radius: 3px !important;
          }
          .inv-table-wrap::-webkit-scrollbar-thumb {
            background: #e9315d !important;
            border-radius: 3px !important;
          }
          /* swipe hint label */
          .inv-scroll-hint {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            padding: 5px 0 8px !important;
            font-size: 11px !important;
            color: #e9315d !important;
            font-weight: 600 !important;
            letter-spacing: 0.3px !important;
          }
          /* 8-col table (received-order, sale-invoice, etc.) needs more room */
          .inv-table-wrap table { min-width: 720px !important; }
          /* 6-col purchase-order table */
          .inv-table-6col { min-width: 480px !important; }
          /* 3-col voucher table */
          .inv-table-3col { min-width: 300px !important; }
          .inv-table-wrap th {
            font-size: 10px !important;
            padding: 8px 5px !important;
            white-space: nowrap !important;
          }
          .inv-table-wrap td {
            font-size: 11px !important;
            padding: 8px 5px !important;
            white-space: nowrap !important;
          }

          /* bottom boxes: stack vertically */
          .inv-bottom-boxes {
            flex-direction: column !important;
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .inv-words-box { width: 100% !important; min-width: 0 !important; }
          .inv-amounts-box { width: 100% !important; }

          /* signature: center it */
          .inv-sig-wrap {
            padding: 14px !important;
            justify-content: center !important;
          }

          /* footer bar */
          .inv-footer-bar { font-size: 11px !important; padding: 10px 14px !important; letter-spacing: 0 !important; }

          /* voucher words inline block */
          .inv-words-label { padding: 6px 14px !important; }
          .inv-words-val { padding: 10px 14px !important; font-size: 12px !important; }
        }
      `}</style>
      <div className="inv-back-wrap" style={{ maxWidth: 850, margin: "0 auto 15px" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            padding: "8px 16px",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
            color: "#666",
            fontSize: 13,
          }}
        >
          ← Back
        </button>
      </div>

      <div
        className="inv-card"
        style={{
          background: "#fff",
          maxWidth: 850,
          margin: "0 auto",
          border: "1px solid #bbb",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          className="inv-title-bar"
          style={{
            background: "#7d7d7d",
            color: "#fff",
            padding: "16px 20px",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          {details.title}
        </div>

        <div className="inv-firm-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px", borderBottom: "1px solid #000" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "bold", color: "#000" }}>{companyName}</h2>
            <div style={{ fontSize: "13px", color: "#555" }}>Ph no. {displayPhone}</div>
          </div>
          {/* Logo Placeholder */}
          <div className="inv-logo" style={{ width: 100, height: 60, border: "1px solid #ccc", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#888" }}>
            [ LOGO ]
          </div>
        </div>

        {/* Party Info Block */}
        <div className="inv-party-block" style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "#fafafa", borderBottom: "1px solid #ddd" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#777", fontWeight: "bold", marginBottom: "4px" }}>{details.partyLabel}</div>
            <div style={{ fontSize: "15px", fontWeight: "bold", color: "#000" }}>
              {details.partyName}
            </div>
            {details.partyAddress && (
              <div style={{ fontSize: "12px", color: "#555", marginTop: "4px", maxWidth: 300 }}>{details.partyAddress}</div>
            )}
            {details.partyPhone && details.partyPhone !== "-" && (
              <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>Contact No : {details.partyPhone}</div>
            )}
          </div>
          <div className="inv-party-right" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", color: "#777", fontWeight: "bold", marginBottom: "4px" }}>{details.detailsLabel}</div>
            <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.6" }}>
              {type === "purchase-order" && (
                <>
                  <div>From Branch : {details.fromBranch}</div>
                  <div>Branch Address : {details.branchAddress}</div>
                  <div>Order No : {details.no}</div>
                  <div>Date : {details.date}</div>
                </>
              )}
              {type === "received-order" && (
                <>
                  <div>Received From : {details.fromBranch}</div>
                  <div>Address : {details.branchAddress}</div>
                  <div>Bill No : {details.no}</div>
                  <div>Order Date : {details.date}</div>
                  <div>Received Date : {details.receivedDate}</div>
                  <div>Status : <span style={{ color: "#2e7d32", fontWeight: "bold" }}>{details.status}</span></div>
                </>
              )}
              {type === "purchase-return" && (
                <>
                  <div>Receipt No : {details.originalReceiptNo}</div>
                  <div>Return No : {details.no}</div>
                  <div>Bill Date : {details.billDate}</div>
                  <div>Return Date : {details.date}</div>
                  <div>Reason : {details.reason}</div>
                </>
              )}
              {type === "sale-invoice" && (
                <>
                  <div>Invoice No : {details.no}</div>
                  <div>Order Id : {details.orderId}</div>
                  <div>Date : {details.date}</div>
                  <div>Status : {details.status}</div>
                </>
              )}
              {type === "sale-return" && (
                <>
                  <div>Receipt No : {details.originalReceiptNo}</div>
                  <div>Return No : {details.no}</div>
                  <div>Bill Date : {details.billDate}</div>
                  <div>Return Date : {details.date}</div>
                  <div>Reason : {details.reason}</div>
                </>
              )}
              {!["purchase-order", "received-order", "purchase-return", "sale-invoice", "sale-return"].includes(type) && (
                <>
                  <div>{details.noLabel} : {details.no}</div>
                  <div>Date : {details.date}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* AMOUNT PAID Banner Row */}
        <div
          className="inv-amount-banner"
          style={{
            background: "#e9315d",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 20px",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          <div>{details.rowTitle}</div>
          <div className="inv-amount-val">{currencySymbol} {formatVal(details.grandTotalValue)}</div>
        </div>

        {/* Inline words logic for vouchers */}
        {isVoucher && (
          <>
            <div
              className="inv-words-label"
              style={{
                background: "#eaeaea",
                color: "#444",
                padding: "8px 20px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              AMOUNT IN WORDS
            </div>
            <div
              className="inv-words-val"
              style={{
                padding: "12px 20px",
                fontSize: "13px",
                fontWeight: "bold",
                color: "#000",
                borderBottom: "1px solid #ddd",
              }}
            >
              {numberToWords(details.grandTotalValue)}
            </div>
          </>
        )}

        {/* Items/Payment Grid Table */}
        <div className="inv-table-outer">
        <div className="inv-table-wrap" style={{ padding: "0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e9315d", color: "#fff" }}>
                {isVoucher ? (
                  <>
                    <th style={{ padding: "10px 12px", fontSize: "13px", fontWeight: "bold", textAlign: "left", borderRight: "1px solid #f8bbd0" }}>PAYMENT MODE</th>
                    <th style={{ padding: "10px 12px", fontSize: "13px", fontWeight: "bold", textAlign: "left", borderRight: "1px solid #f8bbd0" }}>TRANSACTION / REF NO</th>
                    <th style={{ padding: "10px 12px", fontSize: "13px", fontWeight: "bold", textAlign: "right" }}>AMOUNT</th>
                  </>
                ) : type === "purchase-order" ? (
                  <>
                    <th style={{ padding: "10px 8px", fontSize: "12px", fontWeight: "bold", textAlign: "center", width: 44, borderRight: "1px solid #f8bbd0" }}>S.NO</th>
                    <th style={{ padding: "10px 10px", fontSize: "12px", fontWeight: "bold", textAlign: "left", borderRight: "1px solid #f8bbd0" }}>PRODUCT NAME</th>
                    <th style={{ padding: "10px 8px", fontSize: "12px", fontWeight: "bold", textAlign: "center", width: 48, borderRight: "1px solid #f8bbd0" }}>QTY</th>
                    <th style={{ padding: "10px 8px", fontSize: "12px", fontWeight: "bold", textAlign: "center", width: 60, borderRight: "1px solid #f8bbd0" }}>UNIT</th>
                    <th style={{ padding: "10px 8px", fontSize: "12px", fontWeight: "bold", textAlign: "right", width: 80, borderRight: "1px solid #f8bbd0" }}>PRICE</th>
                    <th style={{ padding: "10px 10px", fontSize: "12px", fontWeight: "bold", textAlign: "right", width: 90 }}>AMOUNT</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: "10px 6px", fontSize: "11px", fontWeight: "bold", textAlign: "center", width: 38, borderRight: "1px solid #f8bbd0" }}>S.NO</th>
                    <th style={{ padding: "10px 8px", fontSize: "11px", fontWeight: "bold", textAlign: "left", borderRight: "1px solid #f8bbd0" }}>PRODUCT NAME</th>
                    <th style={{ padding: "10px 6px", fontSize: "11px", fontWeight: "bold", textAlign: "center", width: 42, borderRight: "1px solid #f8bbd0" }}>QTY</th>
                    <th style={{ padding: "10px 6px", fontSize: "11px", fontWeight: "bold", textAlign: "center", width: 50, borderRight: "1px solid #f8bbd0" }}>UNIT</th>
                    <th style={{ padding: "10px 6px", fontSize: "11px", fontWeight: "bold", textAlign: "right", width: 80, borderRight: "1px solid #f8bbd0" }}>PRICE</th>
                    <th style={{ padding: "10px 6px", fontSize: "11px", fontWeight: "bold", textAlign: "center", width: 80, borderRight: "1px solid #f8bbd0" }}>TAX (% / ₹)</th>
                    <th style={{ padding: "10px 6px", fontSize: "11px", fontWeight: "bold", textAlign: "center", width: 90, borderRight: "1px solid #f8bbd0" }}>DISC (% / ₹)</th>
                    <th style={{ padding: "10px 8px", fontSize: "11px", fontWeight: "bold", textAlign: "right", width: 90 }}>AMOUNT</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {isVoucher ? (
                <>
                  {(details.paymentRows.length > 0 ? details.paymentRows : [{ mode: details.paymentMode, ref: details.refNo, amount: details.grandTotalValue }]).map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: "#fff", borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "12px 20px", fontSize: "13px", color: "#000", borderRight: "1px solid #ddd" }}>{row.mode}</td>
                      <td style={{ padding: "12px 20px", fontSize: "13px", color: "#000", borderRight: "1px solid #ddd" }}>{row.ref}</td>
                      <td style={{ padding: "12px 20px", fontSize: "13px", color: "#000", textAlign: "right", fontWeight: "bold" }}>{currencySymbol} {formatVal(row.amount)}</td>
                    </tr>
                  ))}
                </>
              ) : type === "purchase-order" ? (
                <>
                  {details.items.map((item, index) => (
                    <tr key={index} style={{ background: "#fff", borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "10px 10px", fontSize: "13px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{String(index + 1).padStart(2, '0')}</td>
                      <td style={{ padding: "10px 15px", fontSize: "13px", color: "#000", borderRight: "1px solid #ddd" }}>{item.name}</td>
                      <td style={{ padding: "10px 10px", fontSize: "13px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{item.qty}</td>
                      <td style={{ padding: "10px 10px", fontSize: "13px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{item.unit}</td>
                      <td style={{ padding: "10px 10px", fontSize: "13px", color: "#000", textAlign: "right", borderRight: "1px solid #ddd" }}>{currencySymbol} {formatVal(item.rate)}</td>
                      <td style={{ padding: "10px 15px", fontSize: "13px", color: "#000", textAlign: "right", fontWeight: "bold" }}>{currencySymbol} {formatVal(item.total)}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr style={{ background: "#fff", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                    <td colSpan={2} style={{ padding: "12px 15px", fontSize: "13px", color: "#000", borderRight: "1px solid #ddd" }}>TOTAL</td>
                    <td style={{ padding: "12px 10px", fontSize: "13px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{details.items.reduce((sum, i) => sum + i.qty, 0)}</td>
                    <td style={{ borderRight: "1px solid #ddd" }}></td>
                    <td style={{ borderRight: "1px solid #ddd" }}></td>
                    <td style={{ padding: "12px 15px", fontSize: "13px", color: "#000", textAlign: "right" }}>{currencySymbol} {formatVal(details.grandTotalValue)}</td>
                  </tr>
                </>
              ) : (
                <>
                  {details.items.map((item, index) => (
                    <tr key={index} style={{ background: "#fff", borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "10px 8px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{String(index + 1).padStart(2, '0')}</td>
                      <td style={{ padding: "10px 10px", fontSize: "12px", color: "#000", borderRight: "1px solid #ddd" }}>{item.name}</td>
                      <td style={{ padding: "10px 6px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{item.qty}</td>
                      <td style={{ padding: "10px 6px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{item.unit}</td>
                      <td style={{ padding: "10px 6px", fontSize: "12px", color: "#000", textAlign: "right", borderRight: "1px solid #ddd" }}>{currencySymbol} {formatVal(item.rate)}</td>
                      <td style={{ padding: "10px 6px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>
                        <span style={{ color: "#666" }}>{item.taxPercent}%</span> | {currencySymbol}{formatVal(item.taxAmount)}
                      </td>
                      <td style={{ padding: "10px 6px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>
                        <span style={{ color: "#666" }}>{item.discountPercent}%</span> | {currencySymbol}{formatVal(item.discountAmount)}
                      </td>
                      <td style={{ padding: "10px 10px", fontSize: "12px", color: "#000", textAlign: "right", fontWeight: "bold" }}>{currencySymbol} {formatVal(item.total)}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr style={{ background: "#fff", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                    <td colSpan={2} style={{ padding: "12px 10px", fontSize: "12px", color: "#000", borderRight: "1px solid #ddd" }}>TOTAL</td>
                    <td style={{ padding: "12px 6px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>{details.items.reduce((sum, i) => sum + i.qty, 0)}</td>
                    <td style={{ borderRight: "1px solid #ddd" }}></td>
                    <td style={{ borderRight: "1px solid #ddd" }}></td>
                    <td style={{ padding: "12px 6px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>
                      {currencySymbol}{formatVal(details.items.reduce((sum, i) => sum + i.taxAmount, 0))}
                    </td>
                    <td style={{ padding: "12px 6px", fontSize: "12px", color: "#000", textAlign: "center", borderRight: "1px solid #ddd" }}>
                      {currencySymbol}{formatVal(details.items.reduce((sum, i) => sum + i.discountAmount, 0))}
                    </td>
                    <td style={{ padding: "12px 10px", fontSize: "12px", color: "#000", textAlign: "right" }}>{currencySymbol} {formatVal(details.grandTotalValue)}</td>
                  </tr>
                </>
              )}

              {/* Total Summary Row */}
              <tr style={{ background: "#e9315d", color: "#fff", fontWeight: "bold" }}>
                <td colSpan={isVoucher ? 2 : type === "purchase-order" ? 5 : 7} style={{ padding: "12px 20px", fontSize: "14px", whiteSpace: "nowrap" }}>
                  {isVoucher ? "TOTAL PAID" : "TOTAL AMOUNT"}
                </td>
                <td style={{ padding: "12px 20px", fontSize: "14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {currencySymbol} {formatVal(details.grandTotalValue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Swipe hint – only visible on mobile via CSS */}
        <div className="inv-scroll-hint" style={{ display: "none" }}>
          <span>⟵</span>
          <span>Swipe to see all columns</span>
          <span>⟶</span>
        </div>
        </div>

        {/* Bottom Double-Box Block */}
        {!isVoucher && (
          <div className="inv-bottom-boxes" style={{ display: "flex", gap: "20px", padding: "20px", flexWrap: "wrap" }}>
            <div className="inv-words-box" style={{ flex: 1, minWidth: 0, border: "1px solid #ddd", borderRadius: 2 }}>
              <div style={{ background: "#e9315d", color: "#fff", padding: "8px 16px", fontSize: "13px", fontWeight: "bold" }}>
                AMOUNT IN WORDS
              </div>
              <div style={{ padding: "16px", fontSize: "14px", fontWeight: "bold", color: "#333" }}>
                {numberToWords(details.grandTotalValue)}
              </div>
            </div>

            <div className="inv-amounts-box" style={{ width: "320px", border: "1px solid #ddd", borderRadius: 2 }}>
              <div style={{ background: "#e9315d", color: "#fff", padding: "8px 16px", fontSize: "13px", fontWeight: "bold" }}>
                AMOUNTS
              </div>
              <div style={{ padding: "12px 16px" }}>
                {details.amounts.map((amt, idx) => {
                  const isLast = idx === details.amounts.length - 1;
                  const isHighlight = amt.highlight;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: (isLast || isHighlight) ? "10px 0 0" : "6px 0",
                        borderTop: (isLast || isHighlight) ? "1px solid #ddd" : "none",
                        marginTop: (isLast || isHighlight) ? "6px" : "0",
                        fontSize: "13px",
                        fontWeight: (isLast || isHighlight) ? "bold" : "normal",
                        color: (isLast || isHighlight) ? "#e9315d" : "#333",
                      }}
                    >
                      <div>{amt.label}</div>
                      <div>
                        {amt.noFormat ? amt.val : `${currencySymbol} ${formatVal(amt.val)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Signature Box */}
        <div className="inv-sig-wrap" style={{ display: "flex", justifyContent: "flex-end", padding: "24px 20px" }}>
          <div style={{ width: 280, border: "1px solid #e9315d", borderRadius: 2 }}>
            <div
              style={{
                background: "#e9315d",
                color: "#fff",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: "bold",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              For {companyName}
            </div>
            <div style={{ height: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "8px" }}>
              <span style={{ fontSize: "10px", color: "#888", fontWeight: "bold", letterSpacing: "0.5px" }}>AUTHORIZED SIGNATURE</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div
          className="inv-footer-bar"
          style={{
            background: "#e9315d",
            color: "#fff",
            padding: "12px 20px",
            fontSize: "12px",
            fontWeight: "bold",
            textAlign: "center",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Smart Business Solutions by Zaanvar
        </div>
      </div>
    </div>
  );
};

export default InvoiceDynamic;
