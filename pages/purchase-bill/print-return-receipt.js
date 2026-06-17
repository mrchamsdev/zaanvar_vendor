import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import { purchaseService } from "../../services/purchaseService";
import styles from "../../styles/purchase-bill/print-receipt.module.css";
import { parseApiToLocal } from "../../utilities/date-time-utils";

const PrintReturnReceipt = () => {
    const router = useRouter();
    const { id, autoPrint } = router.query;
    const { jwtToken, userInfo } = useStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (jwtToken && id) {
            fetchData();
        }
    }, [jwtToken, id]);

    useEffect(() => {
        if (data && autoPrint === "true") {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [data, autoPrint]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const branchId = userInfo?.branchId || 1;
            let returnData = null;
            let phone = "";

            // 1. Try to fetch detailed return by ID to get vendor details
            try {
                const detailRes = await purchaseService.getReturnById(jwtToken, id);
                if (detailRes.status === "success" && detailRes.data) {
                    const detail = detailRes.data;
                    phone = detail.productsBill?.vendor?.phone || detail.supplierPhone || detail.phone || "";
                    returnData = {
                        ...detail,
                        totalAmount: detail.totalAmount || detail.returnAmount || 0
                    };
                }
            } catch (err) {
                console.error("Error fetching return by ID:", err);
            }

            // 2. Fetch list of returns if not fetched or if phone is missing
            if (!returnData || !phone) {
                const listRes = await purchaseService.getBranchReturns(jwtToken, branchId);
                if (listRes.status === "success" && listRes.data) {
                    const matchedReturn = listRes.data.find(r => r.returnProductsId === parseInt(id));
                    if (matchedReturn) {
                        if (!returnData) {
                            returnData = matchedReturn;
                        }
                        phone = phone || matchedReturn.supplierPhone || matchedReturn.phone || "";
                        
                        // If phone is still missing, search in suppliers list
                        if (!phone) {
                            try {
                                const supRes = await purchaseService.getSuppliers(jwtToken, branchId);
                                if (supRes.status === "success" && supRes.data) {
                                    const supplierId = returnData.supplierId || matchedReturn.supplierId;
                                    const supplierName = returnData.supplierName || matchedReturn.supplierName;
                                    
                                    let matchedSupplier = null;
                                    if (supplierId) {
                                        matchedSupplier = supRes.data.find(s => s.supplierId === supplierId);
                                    }
                                    if (!matchedSupplier && supplierName) {
                                        matchedSupplier = supRes.data.find(s => 
                                            s.supplierName?.toLowerCase() === supplierName.toLowerCase()
                                        );
                                    }
                                    if (matchedSupplier) {
                                        phone = matchedSupplier.phone || "";
                                    }
                                }
                            } catch (supErr) {
                                console.error("Error fetching suppliers for lookup:", supErr);
                            }
                        }
                    }
                }
            }

            if (returnData) {
                setData({
                    ...returnData,
                    supplierPhone: phone || "N/A"
                });
            }
        } catch (error) {
            console.error("Error fetching data for print:", error);
        } finally {
            setLoading(false);
        }
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
        return result ? result + 'Rupees only' : 'Zero Rupees only';
    };

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>Return transaction not found</div>;

    const companyName = userInfo?.companyName || "Naveen Business";

    return (
        <div className={styles.receiptContainer}>
            <h1 className={styles.title}>Purchase Return</h1>
            
            <div className={styles.mainBox}>
                <div className={styles.companyHeader}>
                    <h1>{companyName}</h1>
                    <p>Phone: {userInfo?.phone || "9247684336"}</p>
                </div>
                
                <div className={styles.infoGrid}>
                    <div className={styles.infoCol}>
                        <div className={styles.labelRow}>Returned To:</div>
                        <div className={styles.valueRow}>
                            <p><strong>{data.supplierName || "Supplier"}</strong></p>
                            <p>Contact No: {data.supplierPhone || "N/A"}</p>
                        </div>
                    </div>
                    <div className={styles.infoCol}>
                        <div className={styles.labelRow}>Return Details:</div>
                        <div className={styles.valueRow}>
                            <p>No: {data.returnProductsId}</p>
                            <p>Date: {(parseApiToLocal(data.returnDate || data.createdDate) || new Date()).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.amountRow}>
                <span>Returned Value</span>
                <span>:</span>
                <span className={styles.amountValue}>₹ {Number(data.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className={styles.wordsBox}>
                <div className={styles.labelRow}>Amount in Words:</div>
                <div className={styles.valueRow}>
                    {numberToWords(data.totalAmount)}
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.signatureBox}>
                    <div className={styles.labelRow}>For {companyName}:</div>
                    <div className={styles.signatureArea}>
                        Authorized Signatory
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintReturnReceipt;
