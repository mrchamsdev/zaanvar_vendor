import React from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PaymentInList from "../../components/sale/PaymentInList";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { FiPlus, FiSettings } from "react-icons/fi";
import { useRouter } from "next/router";
import AddPaymentIn from "../../components/sale/AddPaymentIn";

const PaymentInPage = () => {
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
                <FiPlus /> Add Payment In
            </button>
            <FiSettings style={{ fontSize: '20px', color: '#666', cursor: 'pointer' }} />
        </div>
    );

    return (
        <DashboardLayout 
            customTopbarRight={customRight}
        >
            <PaymentInList 
                onAddClick={() => router.push({ pathname: router.pathname, query: { ...router.query, add: 'true' } }, undefined, { shallow: true })}
            />
            
            <AddPaymentIn 
                isOpen={router.query.add === 'true' || router.query.view === 'true' || router.query.edit === 'true'}
                mode={router.query.add === 'true' ? 'add' : (router.query.view === 'true' ? 'view' : 'edit')}
                paymentId={router.query.id}
                onClose={() => {
                    const { add, view, edit, id, print, ...restQuery } = router.query;
                    router.push({ 
                        pathname: router.pathname, 
                        query: restQuery 
                    }, undefined, { shallow: true });
                }}
                onRefresh={() => {
                    const event = new CustomEvent('refreshPaymentList');
                    window.dispatchEvent(event);
                }}
            />
        </DashboardLayout>
    );
};

export default PaymentInPage;
