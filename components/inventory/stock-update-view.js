import React from "react";
import styles from "../../styles/inventory/product-view.module.css";
import { productService } from "../../services/productService";
import useStore from "../state/useStore";
import { toast } from "sonner";
import { parseApiToLocal } from "@/utilities/date-time-utils";

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const StockUpdateView = ({ stockId, onClose }) => {
  const formatVariantSize = (size) => {
    if (!size) return "";
    if (typeof size === 'string' && size.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(size);
        const parts = [];
        if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || 'mm'}H`);
        if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || 'mm'}W`);
        if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || 'mm'}L`);
        if (parsed.radius) parts.push(`R:${parsed.radius}${parsed.radiusUnit || 'mm'}`);
        if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || 'g'}`);
        return parts.length > 0 ? parts.join(" x ") : size;
      } catch (e) {
        return size;
      }
    }
    return size;
  };
  const { jwtToken } = useStore();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (stockId && jwtToken) {
      fetchDetails();
    }
  }, [stockId, jwtToken]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await productService.getStockUpdateById(jwtToken, stockId);
      if (response?.data?.status === "success") {
        setData(response.data.data);
      } else {
        toast.error("Failed to load stock update details");
      }
    } catch (error) {
      console.error("Error fetching stock update:", error);
      toast.error("Error loading details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading details...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>No details found for ID {stockId}</div>;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = parseApiToLocal(dateStr);
    if (!d) return "-";
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const branchAddress = data.branch?.addressDetails;

  const product = data.product || {};
  const productName = product.productName || data.itemName || "-";
  const productCode = product.ProductCode || product.productCode || data.productCode || "-";

  let rawVt = data.variantType || data.variant?.variantType || product.variantType || product.variants?.[0]?.variantType;
  if (typeof rawVt === 'string') {
    try {
      rawVt = JSON.parse(rawVt);
    } catch (e) {
      rawVt = {};
    }
  }
  const vt = rawVt || {};

  let size = vt.size && vt.size !== "1" && vt.size !== "undefined" ? vt.size : "";
  let displayVariant = formatVariantSize(size);
  const flavor = vt.flavor && vt.flavor !== "undefined" ? vt.flavor : "";

  if (displayVariant && flavor) {
    displayVariant = `${displayVariant} ${flavor}`.trim();
  } else if (!displayVariant) {
    if (vt.packCount || vt.packType) {
      displayVariant = `${vt.packCount || ""} ${vt.packType || ""}`.trim();
    } else {
      displayVariant = data.variant?.variantMeasure || data.variantMeasure || "STND";
      if (displayVariant === "STND" && typeof (data.variantType || data.variant?.variantType) === 'string') {
        displayVariant = data.variantType || data.variant?.variantType;
      }
    }
  }

  const isOS = (data.sourceStatus === "openStock" || data.sourceStatus === "Open Stock" || (!data.sourceStatus && (data.reason === "Open Stock" || data.reason === "openStock")));
  const isHold = (data.sourceStatus === "holdQty" || data.sourceStatus === "onHold" || data.sourceStatus === "Hold Qty" || (!data.sourceStatus && (data.reason === "Hold Qty" || data.reason === "holdQty" || data.reason === "onHold")));

  const openStockQuantity = data.variant?.stockUpdates?.openStockQuantity ?? data.stockUpdates?.openStockQuantity;
  const qtyForSale = data.variant?.stockUpdates?.qtyForSale ?? data.stockUpdates?.qtyForSale;
  const onHoldQuantity = data.variant?.stockUpdates?.onHoldQuantity ?? data.stockUpdates?.onHoldQuantity;

  let baseQty = 0;
  if (isHold && onHoldQuantity !== undefined && onHoldQuantity !== null) {
    baseQty = onHoldQuantity;
  } else if (openStockQuantity !== undefined && openStockQuantity !== null) {
    baseQty = openStockQuantity;
  } else if (qtyForSale !== undefined && qtyForSale !== null) {
    baseQty = qtyForSale;
  } else {
    baseQty = data.updatedQty || 0;
  }

  // Updated Qty: openStock → openQty, onHold/holdQty → holdQty, otherwise → updatedQty
  let displayUpdatedQty;
  if (isOS && data.openQty !== undefined && data.openQty !== null) {
    displayUpdatedQty = data.openQty;
  } else if (isHold && data.holdQty !== undefined && data.holdQty !== null) {
    displayUpdatedQty = data.holdQty;
  } else {
    displayUpdatedQty = data.updatedQty !== undefined && data.updatedQty !== null ? data.updatedQty : baseQty;
  }

  // Current Qty: for Hold Qty, show qtyForSale (total available stock) which represents
  // the stock pool before hold was applied. For Open Stock, show openStockQuantity.
  // Falls back to data.stock → data.currentQty → computed.
  let displayCurrentQty;
  if (isHold) {
    // qtyForSale = total stock available for sale (e.g. 100)
    const holdCurrentQty = qtyForSale ?? openStockQuantity ?? data.stock ?? data.currentQty ?? null;
    displayCurrentQty = holdCurrentQty !== null ? holdCurrentQty : (displayUpdatedQty - (data.add || 0) + (data.remove || 0));
  } else if (isOS) {
    const osCurrentQty = openStockQuantity ?? data.stock ?? data.currentQty ?? null;
    displayCurrentQty = osCurrentQty !== null ? osCurrentQty : (displayUpdatedQty - (data.add || 0) + (data.remove || 0));
  } else if (data.currentQty !== undefined && data.currentQty !== null) {
    displayCurrentQty = data.currentQty;
  } else if (data.stock !== undefined && data.stock !== null) {
    // For all other reasons (Internal purpose, Damage, Theft, etc.) use data.stock
    displayCurrentQty = data.stock;
  } else {
    displayCurrentQty = displayUpdatedQty - (data.add || 0) + (data.remove || 0);
  }

  const reasonLower = (data.reason || "").trim().toLowerCase();
  if (reasonLower === "marked damaged items as waste" || reasonLower === "marked expired items as waste" || reasonLower === "restored items to stock") {
    if (data.currentQty !== undefined && data.currentQty !== null) displayCurrentQty = data.currentQty;
    if (data.updatedQty !== undefined && data.updatedQty !== null) displayUpdatedQty = data.updatedQty;
  }

  const displayTotalVal = (() => {
    const rawVal = parseFloat(data.totalValue || 0);
    const addQty = parseInt(data.add) || 0;
    const removeQty = parseInt(data.remove) || 0;
    const cost = parseFloat(data.billItem?.costPrice || data.costPrice || 0);
    const calcVal = rawVal !== 0 ? rawVal : (addQty - removeQty) * cost;
    return removeQty > 0 ? -Math.abs(calcVal) : Math.abs(calcVal);
  })();

  return (
    <div className={styles.viewContainer} style={{ paddingBottom: 40 }}>


      {/* Branch Address Card (Premium Style like Screenshot) */}
      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '24px 32px',
        marginBottom: '32px',
        border: '1px solid #eee'
      }}>
        <div style={{ color: '#999', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Branch Details</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>{data.branch?.name || "Main Branch"}</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          {branchAddress?.addressText && <div>{branchAddress.addressText}</div>}
          <div>{branchAddress?.city}, {branchAddress?.state} - {branchAddress?.pincode}</div>
        </div>
      </div>

      {/* Details Table */}
      <div className={styles.viewSectionTitle}>Update Details</div>
      <div className={styles.viewTableWrapper}>
        <table className={styles.viewTable}>
          <thead>
            <tr>
              <th>Updated Date</th>
              <th>Product Name</th>
              <th>Product Code</th>
              <th>Variants</th>
              <th>Source Status</th>
              <th>Current Qty</th>
              <th>Add</th>
              <th>Remove</th>
              <th>Updated Qty</th>
              <th>Reason</th>
              <th>Exp. Date</th>
              <th>Cost Price</th>
              <th style={{ textAlign: 'right' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatDate(data.createdDate)}</td>
              <td style={{ fontWeight: 700, textTransform: 'uppercase' }}>{productName}</td>
              <td>{productCode}</td>
              <td>{displayVariant}</td>
              <td style={{ fontWeight: 600, color: '#34495e' }}>
                {(data.sourceStatus === "openStock" || data.sourceStatus === "Open Stock") ? "Open Stock" : ((data.sourceStatus === "holdQty" || data.sourceStatus === "onHold" || data.sourceStatus === "Hold Qty") ? "Hold Qty" : ((data.reason === "Open Stock" || data.reason === "openStock") ? "Open Stock" : ((data.reason === "OnHold" || data.reason === "onHold" || data.reason === "holdQty" || data.reason === "Hold Qty") ? "Hold Qty" : "-")))}
              </td>
              <td style={{ fontWeight: 600, background: '#f9f9f9' }}>{displayCurrentQty}</td>
              <td style={{ color: '#27ae60', fontWeight: 700 }}>{data.add > 0 ? `+${data.add}` : "0"}</td>
              <td style={{ color: '#e74c3c', fontWeight: 700 }}>{data.remove > 0 ? `-${data.remove}` : "0"}</td>
              <td style={{ fontWeight: 700 }}>{displayUpdatedQty}</td>
              <td style={{ color: '#E9315D', fontWeight: 700 }}>{data.reason?.toUpperCase()}</td>
              <td>{data.billItem?.expiryDate || "------"}</td>
              <td>₹{data.billItem?.costPrice || "0"}</td>
              <td style={{
                textAlign: 'right',
                fontWeight: 700,
                color: displayTotalVal >= 0 ? '#27ae60' : '#e74c3c'
              }}>
                {displayTotalVal >= 0 ? `+ ₹ ${Math.abs(displayTotalVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `- ₹ ${Math.abs(displayTotalVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total Section Footer */}
      <div style={{
        marginTop: '32px',
        paddingTop: '20px',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#333' }}>TOTAL SURPLUS</div>
        <div style={{
          fontSize: '24px',
          fontWeight: 700,
          color: displayTotalVal >= 0 ? '#27ae60' : '#e74c3c'
        }}>
          {displayTotalVal >= 0 ? `+ ₹ ${Math.abs(displayTotalVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `- ₹ ${Math.abs(displayTotalVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
      </div>
    </div>
  );
};

export default StockUpdateView;