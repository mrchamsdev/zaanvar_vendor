import React, { useState } from "react";
import { FiArrowLeft, FiMoreVertical, FiEdit2, FiInfo } from "react-icons/fi";
import styles from "../../styles/purchase-bill/purchase-out.module.css";

const CustomerView = ({ data, onBack, isSplit, onEdit }) => {
    const [activeTab, setActiveTab] = useState("Sales");

    const sidebarNavs = ["Bookings", "Pets", "Reminders", "Wallet", "Sales", "Reviews"];
    const rightTabs = ["Clinic", "Boarding", "Daycare", "Grooming", "Ordered", "Return"];

    const [activeRightTab, setActiveRightTab] = useState("Ordered");

    const renderRightContent = () => {
        if (activeRightTab === "Ordered") {
            return (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Recent Orders</h4>
                        <div style={{ display: 'flex', gap: '4px', background: '#f5f5f5', padding: '4px', borderRadius: '8px' }}>
                            {rightTabs.map(t => (
                                <button key={t} onClick={() => setActiveRightTab(t)} style={{
                                    border: 'none', background: activeRightTab === t ? '#fff' : 'transparent',
                                    color: activeRightTab === t ? '#E9315D' : '#555',
                                    fontWeight: activeRightTab === t ? '600' : '500',
                                    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                                    boxShadow: activeRightTab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', textTransform: 'uppercase', fontSize: '12px' }}>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Invoice</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Payment Type</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Amount</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Balance</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4].map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                    <td style={{ padding: '16px 24px' }}>20 Apr 2026</td>
                                    <td style={{ padding: '16px 24px' }}>0{item}</td>
                                    <td style={{ padding: '16px 24px' }}>Cash</td>
                                    <td style={{ padding: '16px 24px' }}>₹ 0000</td>
                                    <td style={{ padding: '16px 24px' }}>₹ 0000</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}><button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiMoreVertical /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } else if (activeRightTab === "Return") {
            return (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Recent Returns</h4>
                        <div style={{ display: 'flex', gap: '4px', background: '#f5f5f5', padding: '4px', borderRadius: '8px' }}>
                            {rightTabs.map(t => (
                                <button key={t} onClick={() => setActiveRightTab(t)} style={{
                                    border: 'none', background: activeRightTab === t ? '#fff' : 'transparent',
                                    color: activeRightTab === t ? '#E9315D' : '#555',
                                    fontWeight: activeRightTab === t ? '600' : '500',
                                    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                                    boxShadow: activeRightTab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', textTransform: 'uppercase', fontSize: '12px' }}>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Ref No</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Received</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600' }}>Balance</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4].map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                    <td style={{ padding: '16px 24px' }}>20 Apr 2026</td>
                                    <td style={{ padding: '16px 24px' }}>0{item}</td>
                                    <td style={{ padding: '16px 24px' }}>₹ 0000</td>
                                    <td style={{ padding: '16px 24px' }}>₹ 0000</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}><button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiMoreVertical /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        } else {
             return (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Recent {activeRightTab}</h4>
                        <div style={{ display: 'flex', gap: '4px', background: '#f5f5f5', padding: '4px', borderRadius: '8px' }}>
                            {rightTabs.map(t => (
                                <button key={t} onClick={() => setActiveRightTab(t)} style={{
                                    border: 'none', background: activeRightTab === t ? '#fff' : 'transparent',
                                    color: activeRightTab === t ? '#E9315D' : '#555',
                                    fontWeight: activeRightTab === t ? '600' : '500',
                                    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                                    boxShadow: activeRightTab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Data under development</div>
                </div>
             );
        }
    };

    return (
        <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E9315D', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginBottom: '24px' }} onClick={onBack}>
                <button style={{ background: '#fcecf0', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E9315D', cursor: 'pointer' }}><span style={{fontSize: '18px', lineHeight: '18px', marginTop: '-2px'}}>←</span></button>
                Back
            </div>

            <div style={{ display: 'flex', gap: '24px', flexDirection: isSplit ? 'column' : 'row' }}>
                {/* Left Sidebar */}
                <div style={{ width: isSplit ? '100%' : '300px', flexShrink: 0, background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>{`${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown'}</h2>
                        <div style={{ color: '#6B7280', fontSize: '14px' }}>({data.phoneNumber || 'N/A'})</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
                        {sidebarNavs.map(nav => (
                            <button key={nav} onClick={() => setActiveTab(nav)} style={{
                                background: activeTab === nav ? '#fcecf0' : 'transparent',
                                border: 'none', textAlign: 'left', padding: '16px 24px', fontSize: '14px',
                                color: activeTab === nav ? '#E9315D' : '#4B5563',
                                fontWeight: activeTab === nav ? '600' : '500',
                                cursor: 'pointer', transition: 'background 0.2s'
                            }}>
                                {nav}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: '24px', borderTop: '1px solid #E5E7EB', marginTop: 'auto' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 16px 0', color: '#111' }}>Personal Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Alternate Phone No</div>
                                <div style={{ fontSize: '13px', fontWeight: '500' }}>{data.alternatePhoneNumber || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>E-mail Id</div>
                                <div style={{ fontSize: '13px', fontWeight: '500', wordBreak: 'break-all' }}>{data.email || '-'}</div>
                            </div>
                        </div>
                        <button onClick={onEdit} style={{
                            width: '100%', padding: '12px', background: 'transparent', border: '1px solid #E9315D',
                            color: '#E9315D', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            <span style={{transform: 'scale(1.2)'}}>✎</span> Edit Customer Details
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isSplit ? '1fr' : '1fr 1fr', gap: '24px' }}>
                        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Grooming Overview</h4>
                                <span style={{ color: '#9CA3AF', cursor: 'help' }}>ⓘ</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>₹900</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Revenue</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>1</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Appointments</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Boarding and Daycare Overview</h4>
                                <span style={{ color: '#9CA3AF', cursor: 'help' }}>ⓘ</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>₹900</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Revenue</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>1</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Appointments</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderRightContent()}

                </div>
            </div>
        </div>
    );
};

export default CustomerView;
