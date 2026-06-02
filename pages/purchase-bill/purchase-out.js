import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PaymentOutList from "../../components/purchase-bill/PaymentOutList";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { FiChevronDown, FiPlus, FiSettings } from "react-icons/fi";
import { useRouter } from "next/router";
import dashboardStyles from "../../styles/dashboard/dashboard.module.css";

const PurchaseOutPage = () => {
    const router = useRouter();
    const { branches, branchId: defaultBranchId, setSelectedBranchId } = useDashboardData();
    const currentBranchId = router.query.branchId || "";

    React.useEffect(() => {
        if (!router.isReady) return;
        if (!currentBranchId && branches && branches.length > 0) {
            const targetId = defaultBranchId || branches[0].id;
            router.replace({
                pathname: router.pathname,
                query: { ...router.query, branchId: targetId }
            }, undefined, { shallow: true });
        } else if (currentBranchId) {
            setSelectedBranchId(currentBranchId);
        }
    }, [router.isReady, currentBranchId, branches, defaultBranchId, setSelectedBranchId]);

    const handleBranchChange = (e) => {
        router.push({
            pathname: router.pathname,
            query: { ...router.query, branchId: e.target.value }
        }, undefined, { shallow: true });
    };

    const customLeft = (
        <div className={dashboardStyles.branchSwitcherContainer}>
            <select 
                className={dashboardStyles.branchSwitcher}
                value={currentBranchId}
                onChange={handleBranchChange}
            >
                {branches?.length > 1 && <option value="">All Firms</option>}
                {branches?.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
                ))}
            </select>
        </div>
    );

    const customRight = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: '20px' }}>
            <button 
                onClick={() => router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true })}
                style={{
                    background: '#E93E64',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}
            >
                <FiPlus /> Add Payment Out
            </button>
            <FiSettings style={{ fontSize: '20px', color: '#666', cursor: 'pointer' }} />
        </div>
    );

    return (
        <DashboardLayout 
            customTopbarLeft={customLeft}
            customTopbarRight={customRight}
        >
            <PaymentOutList 
                onAddClick={() => router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true })}
            />
        </DashboardLayout>
    );
};

export default PurchaseOutPage;
