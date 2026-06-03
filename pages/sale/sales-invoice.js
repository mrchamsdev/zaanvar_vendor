
import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import SalesInvoiceList from "../../components/sale/SalesInvoiceList";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { FiPlus, FiSettings } from "react-icons/fi";
import { useRouter } from "next/router";
import SaleInvoiceManager from "../../components/sale/SaleInvoiceManager";
import dashboardStyles from "../../styles/dashboard/dashboard.module.css";

const SalesInvoicePage = () => {
    const router = useRouter();
    const { branches, branchId: defaultBranchId, setSelectedBranchId } = useDashboardData();
    const currentBranchId = router.query.branchId || "";

    const [isReady, setIsReady] = React.useState(false);
    const [isPdf, setIsPdf] = React.useState(false);
    const [managerTrigger, setManagerTrigger] = React.useState(0);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('pdf') === 'true') {
                setIsPdf(true);
            }
            setIsReady(true);
        }
    }, []);

    React.useEffect(() => {
        if (isPdf) return; // skip for pdf view
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
    }, [router.isReady, currentBranchId, branches, defaultBranchId, isPdf, setSelectedBranchId]);

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

    if (!isReady) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff', fontSize: '16px', color: '#666' }}>
                Loading...
            </div>
        );
    }

    if (isPdf) {
        const pdfId = router.query.id || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : '');
        return (
            <SaleInvoiceManager
                isOpen={true}
                mode="view"
                saleId={pdfId}
                onClose={() => window.close()}
                onRefresh={() => {}}
            />
        );
    }

    const customRight = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: '20px' }}>
            <button
                onClick={() => {
                    setManagerTrigger(prev => prev + 1);
                    router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true });
                }}
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
                <FiPlus /> Add Sale Invoice
            </button>
            <FiSettings style={{ fontSize: '20px', color: '#666', cursor: 'pointer' }} />
        </div>
    );

    return (
        <DashboardLayout
            customTopbarLeft={customLeft}
            customTopbarRight={customRight}
        >
            <SalesInvoiceList
                onAddClick={() => {
                    setManagerTrigger(prev => prev + 1);
                    router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true });
                }}
            />

            <SaleInvoiceManager
                isOpen={router.query.add === 'true' || router.query.view === 'true' || router.query.edit === 'true'}
                mode={router.query.add === 'true' ? 'add' : (router.query.view === 'true' ? 'view' : 'edit')}
                saleId={router.query.id}
                trigger={managerTrigger}
                onClose={() => {
                    const { add, view, edit, id, ...restQuery } = router.query;
                    router.push({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
                }}
                onRefresh={() => {
                    // Logic to refresh list
                    const event = new CustomEvent('refreshSalesList');
                    window.dispatchEvent(event);
                }}
            />
        </DashboardLayout>
    );
};

export default SalesInvoicePage;
