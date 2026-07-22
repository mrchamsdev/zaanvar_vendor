
import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import SalesInvoiceList from "../../components/sale/SalesInvoiceList";
import useDashboardData from "../../components/dashboard/useDashboardData";
import useStore from "../../components/state/useStore";
import usePermissions from "../../components/utilities/usePermissions";
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

    const { addEdit: hasAddAccess, noAccess } = usePermissions("Sale", "Sale Invoice");

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('pdf') === 'true') {
                setIsPdf(true);
            }
            setIsReady(true);
        }
    }, []);

        // Removed redundant branch effect that caused infinite loops


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
                {branches?.length > 1 && <option value="">Select Branch</option>}
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

    if (noAccess) {
        return (
            <DashboardLayout customTopbarLeft={customLeft}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#fff', fontSize: '18px', color: '#666' }}>
                    You do not have permission to view this page.
                </div>
            </DashboardLayout>
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
            {hasAddAccess && (
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
            )}
            <FiSettings style={{ fontSize: '20px', color: '#666', cursor: 'pointer' }} />
        </div>
    );

    return (
        <DashboardLayout
            customTopbarLeft={customLeft}
            customTopbarRight={customRight}
        >
            <SalesInvoiceList
                hasAddAccess={hasAddAccess}
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
                hasAddAccess={hasAddAccess}
                onClose={() => {
                    if (router.query.returnUrl) {
                        router.push(router.query.returnUrl);
                        return;
                    }
                    const { add, view, edit, id, returnUrl, ...restQuery } = router.query;
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
