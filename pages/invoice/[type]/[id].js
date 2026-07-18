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
    if (type && id) {
      fetchData();
    }
  }, [type, id, jwtToken, _hasHydrated]);

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
    return <div className="inv-state-screen"><h3>Loading invoice details...</h3></div>;
  }


  if (error) {
    return (
      <div className="inv-error-screen">
        <h3 className="inv-error-title">{error}</h3>
        <button onClick={() => router.back()} className="inv-error-btn">Go Back</button>
      </div>
    );
  }

  const details = getDocDetails();
  const companyName = userInfo?.companyName || "Hello 11";
  const displayPhone = userInfo?.phone || "+919248176187";

  const isVoucher = ["payment-out", "payment-in"].includes(type);

  return (
    <div className="inv-page">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="inv-back-wrap">
        <button onClick={() => router.back()} className="inv-back-btn">
          ← Back
        </button>
      </div>

      <div className="inv-card">
        <div className="inv-title-bar">{details.title}</div>

        <div className="inv-firm-header">
          <div>
            <h2>{companyName}</h2>
            <div className="inv-firm-phone">Ph no. {displayPhone}</div>
          </div>
          <div className="inv-logo">[ LOGO ]</div>
        </div>

        {/* Party Info Block */}
        <div className="inv-party-block">
          <div>
            <div className="inv-party-label">{details.partyLabel}</div>
            <div className="inv-party-name">{details.partyName}</div>
            {details.partyAddress && <div className="inv-party-address">{details.partyAddress}</div>}
            {details.partyPhone && details.partyPhone !== "-" && (
              <div className="inv-party-phone">Contact No : {details.partyPhone}</div>
            )}
          </div>
          <div className="inv-party-right">
            <div className="inv-party-right-label">{details.detailsLabel}</div>
            <div className="inv-party-right-details">
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
                  <div>Status : <span className="inv-status-active">{details.status}</span></div>
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

        <div className="inv-words-table-roa">
          {/* AMOUNT PAID Banner Row */}
          <div className="inv-amount-banner">
            <div>{details.rowTitle}</div>
            <div className="inv-amount-val">{currencySymbol} {formatVal(details.grandTotalValue)}</div>
          </div>

          {/* Inline words logic for vouchers */}
          {isVoucher && (
            <>
              <div className="inv-words-label">AMOUNT IN WORDS</div>
              <div className="inv-words-val">{numberToWords(details.grandTotalValue)}</div>
            </>
          )}

          {/* Items/Payment Grid Table */}
          <div className="inv-table-outer">
            <div className="inv-table-wrap">
              <table>
                <thead>
                  <tr className="inv-thead-row">
                    {isVoucher ? (
                      <>
                        <th className="inv-th" style={{ textAlign: "left" }}>PAYMENT MODE</th>
                        <th className="inv-th" style={{ textAlign: "left" }}>TRANSACTION / REF NO</th>
                        <th className="inv-th inv-th-amt">AMOUNT</th>
                      </>
                    ) : type === "purchase-order" ? (
                      <>
                        <th className="inv-th inv-th-sno">S.NO</th>
                        <th className="inv-th" style={{ textAlign: "left" }}>PRODUCT NAME</th>
                        <th className="inv-th inv-th-qty">QTY</th>
                        <th className="inv-th inv-th-unit">UNIT</th>
                        <th className="inv-th inv-th-price">PRICE</th>
                        <th className="inv-th inv-th-amt">AMOUNT</th>
                      </>
                    ) : (
                      <>
                        <th className="inv-th inv-th-sno" style={{ width: 38 }}>S.NO</th>
                        <th className="inv-th" style={{ textAlign: "left" }}>PRODUCT NAME</th>
                        <th className="inv-th inv-th-qty" style={{ width: 42 }}>QTY</th>
                        <th className="inv-th inv-th-unit" style={{ width: 50 }}>UNIT</th>
                        <th className="inv-th inv-th-price">PRICE</th>
                        <th className="inv-th inv-th-tax">TAX (% / ₹)</th>
                        <th className="inv-th inv-th-disc">DISC (% / ₹)</th>
                        <th className="inv-th inv-th-amt">AMOUNT</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isVoucher ? (
                    <>
                      {(details.paymentRows.length > 0 ? details.paymentRows : [{ mode: details.paymentMode, ref: details.refNo, amount: details.grandTotalValue }]).map((row, rIdx) => (
                        <tr key={rIdx} className="inv-tbody-row">
                          <td className="inv-td">{row.mode}</td>
                          <td className="inv-td">{row.ref}</td>
                          <td className="inv-td inv-td-right inv-td-bold inv-td-no-border">{currencySymbol} {formatVal(row.amount)}</td>
                        </tr>
                      ))}
                    </>
                  ) : type === "purchase-order" ? (
                    <>
                      {details.items.map((item, index) => (
                        <tr key={index} className="inv-tbody-row">
                          <td className="inv-td inv-td-center">{String(index + 1).padStart(2, '0')}</td>
                          <td className="inv-td">{item.name}</td>
                          <td className="inv-td inv-td-center">{item.qty}</td>
                          <td className="inv-td inv-td-center">{item.unit}</td>
                          <td className="inv-td inv-td-right">{currencySymbol} {formatVal(item.rate)}</td>
                          <td className="inv-td inv-td-right inv-td-bold inv-td-no-border">{currencySymbol} {formatVal(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="inv-tbody-row-total">
                        <td className="inv-td" colSpan={2}>TOTAL</td>
                        <td className="inv-td inv-td-center">{details.items.reduce((sum, i) => sum + i.qty, 0)}</td>
                        <td className="inv-td"></td>
                        <td className="inv-td"></td>
                        <td className="inv-td inv-td-right inv-td-no-border">{currencySymbol} {formatVal(details.grandTotalValue)}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      {details.items.map((item, index) => (
                        <tr key={index} className="inv-tbody-row">
                          <td className="inv-td inv-td-center">{String(index + 1).padStart(2, '0')}</td>
                          <td className="inv-td">{item.name}</td>
                          <td className="inv-td inv-td-center">{item.qty}</td>
                          <td className="inv-td inv-td-center">{item.unit}</td>
                          <td className="inv-td inv-td-right">{currencySymbol} {formatVal(item.rate)}</td>
                          <td className="inv-td inv-td-center">
                            <span className="inv-tax-pct">{item.taxPercent}%</span> | {currencySymbol}{formatVal(item.taxAmount)}
                          </td>
                          <td className="inv-td inv-td-center">
                            <span className="inv-tax-pct">{item.discountPercent}%</span> | {currencySymbol}{formatVal(item.discountAmount)}
                          </td>
                          <td className="inv-td inv-td-right inv-td-bold inv-td-no-border">{currencySymbol} {formatVal(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="inv-tbody-row-total">
                        <td className="inv-td" colSpan={2}>TOTAL</td>
                        <td className="inv-td inv-td-center">{details.items.reduce((sum, i) => sum + i.qty, 0)}</td>
                        <td className="inv-td"></td>
                        <td className="inv-td"></td>
                        <td className="inv-td inv-td-center">{currencySymbol}{formatVal(details.items.reduce((sum, i) => sum + i.taxAmount, 0))}</td>
                        <td className="inv-td inv-td-center">{currencySymbol}{formatVal(details.items.reduce((sum, i) => sum + i.discountAmount, 0))}</td>
                        <td className="inv-td inv-td-right inv-td-no-border">{currencySymbol} {formatVal(details.grandTotalValue)}</td>
                      </tr>
                    </>
                  )}

                  {/* Total Summary Row */}
                  <tr className="inv-summary-row">
                    <td className="inv-summary-label" colSpan={isVoucher ? 2 : type === "purchase-order" ? 5 : 7}>
                      {isVoucher ? "TOTAL PAID" : "TOTAL AMOUNT"}
                    </td>
                    <td className="inv-summary-val">
                      {currencySymbol} {formatVal(details.grandTotalValue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Swipe hint – only visible on mobile via CSS */}
            <div className="inv-scroll-hint">
              <span>⟵</span><span>Swipe to see all columns</span><span>⟶</span>
            </div>
          </div>

        </div>
        {/* Bottom Double-Box Block */}
        {!isVoucher && (
          <div className="inv-bottom-boxes">
            <div className="inv-words-box">
              <div className="inv-words-box-header">AMOUNT IN WORDS</div>
              <div className="inv-words-box-body">{numberToWords(details.grandTotalValue)}</div>
            </div>
            <div className="inv-amounts-box">
              <div className="inv-amounts-box-header">AMOUNTS</div>
              <div className="inv-amounts-box-body">
                {details.amounts.map((amt, idx) => {
                  const isHighlight = amt.highlight || idx === details.amounts.length - 1;
                  return (
                    <div key={idx} className={isHighlight ? "inv-amt-row-highlight" : "inv-amt-row"}>
                      <div>{amt.label}</div>
                      <div>{amt.noFormat ? amt.val : `${currencySymbol} ${formatVal(amt.val)}`}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Signature Box */}
        <div className="inv-sig-wrap">
          <div className="inv-sig-box">
            <div className="inv-sig-header">For {companyName}</div>
            <div className="inv-sig-body">
              <span className="inv-sig-label">AUTHORIZED SIGNATURE</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="inv-footer-bar">
          Smart Business Solutions by Zaanvar
        </div>
      </div>
    </div>
  );
};

export default InvoiceDynamic;
