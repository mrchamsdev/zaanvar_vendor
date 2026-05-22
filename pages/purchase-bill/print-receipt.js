import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import { purchaseService } from "../../services/purchaseService";
import styles from "../../styles/purchase-bill/print-receipt.module.css";

const PrintReceipt = () => {
    const router = useRouter();
    const { id, autoPrint } = router.query;
    const { jwtToken, userInfo } = useStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [supplierName, setSupplierName] = useState("Supplier");

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
            // Fetch Transactions
            const transRes = await purchaseService.getBranchTransactions(jwtToken, branchId);
            if (transRes.status === "success") {
                const transaction = transRes.data.find(t => t.suppliersTransactionId === parseInt(id));
                setData(transaction);

                // Fetch Supplier Name specifically
                if (transaction?.supplierId) {
                    const supRes = await purchaseService.getSuppliers(jwtToken, branchId);
                    if (supRes.status === "success") {
                        const supplier = supRes.data.find(s => s.supplierId === transaction.supplierId);
                        setSupplierName(supplier?.supplierName || transaction.transactionInfo || "Supplier");
                    }
                }
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
    if (!data) return <div>Transaction not found</div>;

    const companyName = userInfo?.companyName || "Naveen Business";

    return (
        <div className={styles.receiptContainer}>
            <h1 className={styles.title}>Payment Out</h1>
            
            <div className={styles.mainBox}>
                <div className={styles.companyHeader}>
                    <h1>{companyName}</h1>
                    <p>Phone: {userInfo?.phone || "9247684336"}</p>
                </div>
                
                <div className={styles.infoGrid}>
                    <div className={styles.infoCol}>
                        <div className={styles.labelRow}>Paid To:</div>
                        <div className={styles.valueRow}>
                            <p><strong>{supplierName}</strong></p>
                            <p>Contact No: {data.phone || "8333007678"}</p>
                        </div>
                    </div>
                    <div className={styles.infoCol}>
                        <div className={styles.labelRow}>Receipt Details:</div>
                        <div className={styles.valueRow}>
                            <p>No: {data.suppliersTransactionId}</p>
                            <p>Date: {new Date(data.userTransactionDate).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.amountRow}>
                <span>Paid</span>
                <span>:</span>
                <span className={styles.amountValue}>₹ {Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className={styles.wordsBox}>
                <div className={styles.labelRow}>Amount in Words:</div>
                <div className={styles.valueRow}>
                    {numberToWords(data.amount)}
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

export default PrintReceipt;
