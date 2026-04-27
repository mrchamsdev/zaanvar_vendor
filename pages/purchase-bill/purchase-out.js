import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/purchase-bill/purchase-bill.module.css";

const PurchaseOutPage = () => {
    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.underDevelopment}>
                    <div className={styles.devIcon}>🛠️</div>
                    <h3>Purchase Out</h3>
                    <p>This module is currently under development. Stay tuned for updates!</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PurchaseOutPage;
