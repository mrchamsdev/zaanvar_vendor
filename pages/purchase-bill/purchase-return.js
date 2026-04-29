import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PurchaseReturnList from "../../components/purchase-bill/PurchaseReturnList";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { FiPlus, FiSettings } from "react-icons/fi";
import { useRouter } from "next/router";

const PurchaseReturnPage = () => {
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

    const handleBranchChange = (e) => {
        router.push({
            pathname: router.pathname,
            query: { ...router.query, branchId: e.target.value }
        }, undefined, { shallow: true });
    };

    const customLeft = (
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
            <select 
                style={{ 
                    border: '1px solid #eee', 
                    background: '#f8f9fa', 
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#666',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '200px'
                }}
                value={currentBranchId}
                onChange={handleBranchChange}
            >
                {branches?.length > 1 && <option value="">All Firms</option>}
                {branches?.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
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
                <FiPlus /> Add Purchase Return
            </button>
            <FiSettings style={{ fontSize: '20px', color: '#666', cursor: 'pointer' }} />
        </div>
    );

    return (
        <DashboardLayout 
            customTopbarLeft={customLeft}
            customTopbarRight={customRight}
        >
            <PurchaseReturnList />
        </DashboardLayout>
    );
};

export default PurchaseReturnPage;
