
import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import SalesInvoiceList from "../../components/sale/SalesInvoiceList";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { FiPlus, FiSettings } from "react-icons/fi";
import { useRouter } from "next/router";
import SaleInvoiceManager from "../../components/sale/SaleInvoiceManager";

const SalesInvoicePage = () => {
    const router = useRouter();
    const { branches, branchId } = useDashboardData();

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
                <FiPlus /> Add Sale Invoice
            </button>
            <FiSettings style={{ fontSize: '20px', color: '#666', cursor: 'pointer' }} />
        </div>
    );

    return (
        <DashboardLayout
            customTopbarRight={customRight}
        >
            <SalesInvoiceList
                onAddClick={() => router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true })}
            />

            <SaleInvoiceManager
                isOpen={router.query.add === 'true' || router.query.view === 'true' || router.query.edit === 'true'}
                mode={router.query.add === 'true' ? 'add' : (router.query.view === 'true' ? 'view' : 'edit')}
                saleId={router.query.id}
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
