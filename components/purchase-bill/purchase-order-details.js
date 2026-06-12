import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/purchase-bill/purchase-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import PurchaseOrderForm from "./purchase-order-form";
import ReceiveOrderForm from "./receive-order-form";
import Loader from "../utilities/Loader";
import PrintInvoiceTemplate from "../shared/PrintInvoiceTemplate";

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
    const [isPdf, setIsPdf] = useState(false);

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
            const isSuccess = res.status === 200 || res.status === "success" || res.status === "ok" || res.data?.status === "success" || res.statusText === "OK";
            if (isSuccess) {
                toast.success(`Order ${newStatus} successfully`);
                setOrderData(prev => ({ ...prev, orderStatus: newStatus }));
                if (onSave) onSave();
            } else {
                toast.error(res?.data?.message || res.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader message="Loading Order Details..." />;
    if (!orderData) return <div style={{ padding: '50px', textAlign: 'center' }}>Order not found</div>;

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
                orderNumber={orderData?.purchaseRequestId}
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

    if (isPdf) {
        const columns = [
            { header: "S.NO", accessor: "sno" },
            { header: "PRODUCT NAME", accessor: "productName" },
            { header: "UNIT", accessor: "variant" },
            { header: "QTY", accessor: "orderQty" },
            { header: "PRICE", accessor: "costPrice" },
            { header: "TAX", accessor: "tax" },
            { header: "DISCOUNT", accessor: "discount" },
            { header: "AMOUNT", accessor: "amount" }
        ];

        const pdfItems = orderData.items.map((item, idx) => ({
            sno: String(idx + 1).padStart(2, '0'),
            productName: item.productName,
            variant: [item.variantType?.packType, formatVariantSize(item.variantType?.size), item.variantType?.flavor].filter(Boolean).join(" - ") || item.variantMeasure || "--",
            costPrice: item.costPrice ? `₹ ${item.costPrice}` : "-",
            orderQty: item.qty,
            tax: "-",
            discount: "-",
            amount: "-"
        }));

        const formattedAddress = orderData.branchAddress?.addressText || [orderData.branchAddress?.flatNo, orderData.branchAddress?.area, orderData.branchAddress?.city, [orderData.branchAddress?.state, orderData.branchAddress?.pincode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        const formattedCountry = orderData.branchAddress?.country || "";
        const completeAddress = [formattedAddress, formattedCountry].filter(Boolean).join(", ");
        
        const customerAddress = [orderData.supplier?.street, orderData.supplier?.city, orderData.supplier?.state, orderData.supplier?.areaPinCode].filter(Boolean).join(", ") + (orderData.supplier?.country ? `, ${orderData.supplier?.country}` : "");

        const orderDateFormatted = (orderData.modifiedDate || orderData.orderDate || orderData.createdDate) ?
            new Date(orderData.modifiedDate || orderData.orderDate || orderData.createdDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "--";

        return (
            <PrintInvoiceTemplate
                title={`Purchase Order ${orderData.orderStatus.toUpperCase()}`}
                headerDetails={{
                    companyName: orderData.branchName || "Branch Name",
                    companyPhone: orderData.branchAddress?.phone || orderData.branchAddress?.mobile || null
                }}
                customerDetails={{
                    name: orderData.supplier?.supplierName || "N/A",
                    address: customerAddress,
                    phone: orderData.supplier?.phone
                }}
                invoiceDetails={{
                    "From Branch": orderData.branchName || "N/A",
                    "Branch Address": completeAddress,
                    "Order No": `PO-${String(orderData.purchaseRequestId).padStart(6, '0')}`,
                    "Date": orderDateFormatted
                }}
                columns={columns}
                items={pdfItems}
                onClose={() => setIsPdf(false)}
            />
        );
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                    <div className={styles.poNumberLarge}>
                        Purchase Order <span className={styles.poId}>{String(orderData.purchaseRequestId).padStart(6, '0')}</span>
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
                            On {(orderData.modifiedDate || orderData.orderDate || orderData.createdDate) ?
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
                            {orderData.branchAddress?.addressText}<br />
                            {orderData.branchAddress?.city}, {orderData.branchAddress?.state}
                        </div>
                    </div>
                    <div className={styles.addressBlock}>
                        <div className={styles.addressLabel}>To</div>
                        <div className={styles.addressName}>{orderData.supplier?.supplierName || "N/A"}</div>
                        <div className={styles.addressText}>
                            Ph: {orderData.supplier?.phone || "N/A"}<br />
                            {orderData.supplier?.street && <>{orderData.supplier.street}, {orderData.supplier.city}</>}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper} style={{ marginTop: '20px' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center' }}>S.NO</th>
                            <th>PRODUCT NAME</th>
                            <th style={{ textAlign: 'center' }}>PRODUCT CODE</th>
                            <th style={{ textAlign: 'center' }}>VARIANT</th>
                            <th style={{ textAlign: 'center' }}>COST PRICE</th>
                            <th style={{ textAlign: 'center' }}>ORDER QTY</th>
                            {orderData.orderStatus !== "order placed" && orderData.orderStatus !== "cancel order" && (
                                <th style={{ textAlign: 'center' }}>RECEIVED QTY</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {orderData.items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ textAlign: 'center', fontWeight: '700' }}>{String(index + 1).padStart(2, '0')}</td>
                                <td style={{ fontWeight: '500' }}>{item.productName}</td>
                                <td style={{ textAlign: 'center' }}>{item.productCode || "--"}</td>
                                <td style={{ textAlign: 'center', color: '#666' }}>
                                    {[item.variantType?.packType, formatVariantSize(item.variantType?.size), item.variantType?.flavor].filter(Boolean).join(" - ") || item.variantMeasure || "--"}
                                </td>
                                <td style={{ textAlign: 'center' }}>{item.costPrice ? `₹ ${item.costPrice}` : "-"}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: '700' }}>{item.qty}</div>
                                </td>
                                {orderData.orderStatus !== "order placed" && orderData.orderStatus !== "cancel order" && (
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '700' }}>{item.receivedQty || 0}</div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>Current Qty - {item.currentQty || 0}</div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.actions} style={{ justifyContent: 'flex-end', gap: '15px' }}>
                {orderData.orderStatus === "order placed" && (
                    <>
                        <button className={styles.cancelBtn} onClick={() => handleUpdateStatus("cancel order")}>Cancel Order</button>
                        <button className={styles.printBtn} onClick={() => setIsPdf(true)}>Print</button>
                        <button className={styles.placeOrderBtn} style={{ background: '#000' }} onClick={onReceive}>Receive Order</button>
                    </>
                )}
                {orderData.orderStatus === "cancel order" && (
                    <button className={styles.printBtn} onClick={() => setIsPdf(true)}>Print Summary</button>
                )}
                {orderData.orderStatus === "received" && (
                    <button className={styles.printBtn} onClick={() => setIsPdf(true)}>Print Receipt</button>
                )}
            </div>
        </div>
    );
};

export default PurchaseOrderDetails;
