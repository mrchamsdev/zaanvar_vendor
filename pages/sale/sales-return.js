
import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import SalesReturnList from "../../components/sale/SalesReturnList";
import AddSalesReturn from "../../components/sale/AddSalesReturn";
import { FiPlus, FiSettings } from "react-icons/fi";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { useRouter } from "next/router";

const SalesReturnPage = () => {
    const router = useRouter();
    const { branches, branchId: defaultBranchId } = useDashboardData();
    const currentBranchId = router.query.branchId || "";

    React.useEffect(() => {
        if (!router.isReady) return;
        if (!currentBranchId && branches && branches.length > 0) {
            const targetId = defaultBranchId || branches[0].id;
            router.replace({
                pathname: router.pathname,
                query: { ...router.query, branchId: targetId }
            }, undefined, { shallow: true });
        }
    }, [router.isReady, currentBranchId, branches, defaultBranchId]);

    const customRight = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: '20px' }}>
            <button 
                onClick={() => router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true })}
                style={{
                    background: '#E93E64',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}
            >
                <FiPlus /> Add Sale Return
            </button>
            <FiSettings style={{ fontSize: '20px', color: '#666', cursor: 'pointer' }} />
        </div>
    );

    return (
        <DashboardLayout 
            customTopbarRight={customRight}
        >
            <SalesReturnList 
                onAddClick={() => router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true })}
            />

            <AddSalesReturn 
                isOpen={router.query.add === 'true' || router.query.view === 'true' || router.query.edit === 'true'}
                mode={router.query.add === 'true' ? 'add' : (router.query.view === 'true' ? 'view' : 'edit')}
                returnId={router.query.id}
                onClose={() => router.push({ pathname: router.pathname, query: { branchId: currentBranchId } }, undefined, { shallow: true })}
                onRefresh={() => {
                    const event = new CustomEvent('refreshSalesReturnList');
                    window.dispatchEvent(event);
                }}
            />
        </DashboardLayout>
    );
};

export default SalesReturnPage;
