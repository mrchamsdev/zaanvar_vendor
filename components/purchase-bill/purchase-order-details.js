import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/purchase-bill/purchase-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import PurchaseOrderForm from "./purchase-order-form";
import ReceiveOrderForm from "./receive-order-form";

const PurchaseOrderDetails = ({ requestId, onClose, onSave, onReceive }) => {
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
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        if (jwtToken && requestId) {
            fetchOrderDetails();
        }
    }, [jwtToken, requestId]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await purchaseService.getPurchaseRequestSummary(jwtToken, requestId);
            if (res.status === "success") {
                setOrderData(res.data);
            } else {
                toast.error("Failed to fetch order details");
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setLoading(true);
        try {
            const payload = { orderStatus: newStatus };
            const res = await purchaseService.updatePurchaseOrder(jwtToken, requestId, payload);
            if (res.status === "success" || res.status === "ok") {
                toast.success(`Order ${newStatus} successfully`);
                if (onSave) onSave();
                else if (onClose) onClose();
            } else {
                toast.error(res.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Loading Order Details...</div>;
    if (!orderData) return <div style={{padding: '50px', textAlign: 'center'}}>Order not found</div>;

    // Condition 1: If Draft, show the editable Form
    if (orderData.orderStatus === "draft") {
        // Map backend summary data to form initial data structure
        const initialData = {
            branchId: orderData.branchId,
            supplierId: orderData.supplier?.supplierId,
            supplierPhone: orderData.supplier?.phone,
            orderDate: orderData.orderDate,
            items: orderData.items.map(item => ({
                id: item.productId + item.variantId,
                productId: item.productId,
                productName: item.productName,
                productCode: item.productCode,
                variant: item.variantType ? `${item.variantType.packType || ""} ${formatVariantSize(item.variantType.size) || ""} ${item.variantType.flavor || ""}`.trim() : (item.variantMeasure || "--"),
                currentStock: item.currentQty || 0,
                orderQty: item.qty,
                variantId: item.variantId,
                costPrice: item.costPrice,
                taxGroupId: item.taxGroupId
            }))
        };

        return (
            <PurchaseOrderForm 
                initialData={initialData} 
                requestId={requestId} // Pass requestId to indicate it's an update
                onSave={() => {
                    if (onSave) onSave();
                    if (onClose) onClose();
                    router.push("/purchase-bill?tab=Orders");
                }}
                onBack={onClose}
            />
        );
    }

    if (orderData.orderStatus === "received") {
        return <ReceiveOrderForm requestId={requestId} onClose={onClose} mode="view" />;
    }

    // Condition 2 & 3: Order Placed or Cancelled - Show Summary View
    return (
        <div className={styles.formContainer}>
            <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                    <div className={styles.poNumberLarge}>
                        Purchase Order <span className={styles.poId}>#{String(orderData.purchaseRequestId).padStart(6, '0')}</span>
                    </div>
                    <div className={styles.summaryStatusBadge}>
                        <span className={
                            orderData.orderStatus === "order placed" ? styles.statusBadgePlaced : 
                            orderData.orderStatus === "cancel order" ? styles.statusBadgeCancelled : 
                            styles.statusBadgeReceived
                        }>
                            {orderData.orderStatus.toUpperCase()}
                        </span>
                        <div className={styles.summaryDate}>
                            On { (orderData.modifiedDate || orderData.orderDate || orderData.createdDate) ? 
                                new Date(orderData.modifiedDate || orderData.orderDate || orderData.createdDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' }) : 
                                "--" 
                            }
                        </div>
                    </div>
                </div>

                <div className={styles.addressSection}>
                    <div className={styles.addressBlock}>
                        <div className={styles.addressLabel}>From</div>
                        <div className={styles.addressName}>{orderData.branchName}</div>
                        <div className={styles.addressText}>
                            {orderData.branchAddress?.addressText}<br/>
                            {orderData.branchAddress?.city}, {orderData.branchAddress?.state}
                        </div>
                    </div>
                    <div className={styles.addressBlock}>
                        <div className={styles.addressLabel}>To</div>
                        <div className={styles.addressName}>{orderData.supplier?.supplierName || "N/A"}</div>
                        <div className={styles.addressText}>
                             Ph: {orderData.supplier?.phone || "N/A"}<br/>
                             {orderData.supplier?.street && <>{orderData.supplier.street}, {orderData.supplier.city}</>}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper} style={{marginTop: '20px'}}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{textAlign: 'center'}}>S.NO</th>
                            <th>PRODUCT NAME</th>
                            <th style={{textAlign: 'center'}}>PRODUCT CODE</th>
                            <th style={{textAlign: 'center'}}>VARIANT</th>
                            <th style={{textAlign: 'center'}}>COST PRICE</th>
                            <th style={{textAlign: 'center'}}>Order QTY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderData.items.map((item, index) => (
                            <tr key={index}>
                                <td style={{textAlign: 'center', fontWeight: '700'}}>{String(index + 1).padStart(2, '0')}</td>
                                <td style={{fontWeight: '500'}}>{item.productName}</td>
                                <td style={{textAlign: 'center'}}>{item.productCode || "--"}</td>
                                <td style={{textAlign: 'center', color: '#666'}}>
                                    {[item.variantType?.packType, formatVariantSize(item.variantType?.size), item.variantType?.flavor].filter(Boolean).join(" - ") || item.variantMeasure || "--"}
                                </td>
                                <td style={{textAlign: 'center'}}>{item.costPrice ? `₹ ${item.costPrice}` : "-"}</td>
                                <td style={{textAlign: 'center'}}>
                                    <div style={{fontWeight: '700'}}>{item.qty}</div>
                                    <div style={{fontSize: '11px', color: '#999'}}>Current Qty - {item.currentQty || 0}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.actions} style={{justifyContent: 'flex-end', gap: '15px'}}>
                {orderData.orderStatus === "order placed" && (
                    <>
                        <button className={styles.cancelBtn} onClick={() => handleUpdateStatus("cancel order")}>Cancel Order</button>
                        <button className={styles.printBtn} onClick={() => window.print()}>Print</button>
                        <button className={styles.placeOrderBtn} style={{background: '#000'}} onClick={onReceive}>Receive Order</button>
                    </>
                )}
                {orderData.orderStatus === "cancel order" && (
                    <button className={styles.printBtn} onClick={() => window.print()}>Print Summary</button>
                )}
                {orderData.orderStatus === "received" && (
                    <button className={styles.printBtn} onClick={() => window.print()}>Print Receipt</button>
                )}
            </div>
        </div>
    );
};

export default PurchaseOrderDetails;
