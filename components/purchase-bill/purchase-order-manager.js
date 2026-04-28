import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-order-manager.module.css";
import PurchaseOrderForm from "./purchase-order-form";
import PurchaseOrderDetails from "./purchase-order-details";
import ReceiveOrderForm from "./receive-order-form";

const IconMinimize = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const IconSplit = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
);
const IconMaximize = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
    </svg>
);
const IconX = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const PurchaseOrderManager = ({ onClose, onSave, mode = "Add", initialId, initialData }) => {
    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const [tabs, setTabs] = useState([
        { 
            id: initialId || '1', 
            title: mode === "View" ? `Order Details #${initialId}` : 'New Order', 
            isMinimized: false, 
            data: initialData || {}, 
            mode: mode 
        }
    ]);

    const [activeTabId, setActiveTabId] = useState(initialId || '1');
    const [splitMode, setSplitMode] = useState(false);
    const [splitTabIds, setSplitTabIds] = useState(['1', null]);

    const addTab = () => {
        const newId = String(Date.now());
        const newTab = { id: newId, title: `Purchase Order #${tabs.length + 1}`, isMinimized: false, data: {}, mode: "Add" };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        if (splitMode && !splitTabIds[1]) {
            setSplitTabIds([splitTabIds[0], newId]);
        }
    };

    const closeTab = (id, e) => {
        if (e) e.stopPropagation();
        console.log("Closing tab:", id, "Existing tabs:", tabs);
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) {
            console.log("No tabs left, calling onClose");
            onClose();
            return;
        }
        setTabs(newTabs);
        if (activeTabId === id) setActiveTabId(newTabs[0].id);
        if (splitTabIds.includes(id)) {
            setSplitTabIds(splitTabIds.map(sid => sid === id ? null : sid));
        }
    };

    const toggleMinimize = (id) => {
        setActiveTabId(id);
        setTabs(prev => prev.map(t => t.id === id ? { ...t, isMinimized: !t.isMinimized } : t));
    };

    const toggleSplit = () => {
        if (!splitMode && tabs.length > 1) {
            const visible = tabs.filter(t => !t.isMinimized);
            setSplitTabIds([visible[0].id, visible[1]?.id || null]);
        }
        setSplitMode(!splitMode);
    };

    const activeTab = tabs.find(t => t.id === activeTabId);
    const visibleTabs = tabs.filter(t => !t.isMinimized);
    const isAnyVisible = visibleTabs.length > 0;
    const minimizedTabs = tabs.filter(t => t.isMinimized);

    const renderForm = (tab, onBack) => {
        if (!tab) return null;
        if (tab.mode === "View") {
            return (
                <PurchaseOrderDetails 
                    requestId={tab.id}
                    onSave={onSave}
                    onClose={onBack}
                    onReceive={() => {
                        setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, mode: 'Receive' } : t));
                    }}
                />
            );
        }
        if (tab.mode === "Receive") {
            return (
                <ReceiveOrderForm 
                    requestId={tab.id}
                    onSave={() => {
                        if (onSave) onSave();
                        closeTab(tab.id);
                    }}
                    onClose={onBack}
                />
            );
        }
        return (
            <PurchaseOrderForm 
                initialData={tab.data}
                onSave={() => {
                    if (onSave) onSave();
                    closeTab(tab.id);
                }}
                onBack={onBack}
            />
        );
    };

    return (
        <div className={styles.taskManager}>
            <div className={styles.tabBar}>
                {visibleTabs.map(tab => (
                    <div 
                        key={tab.id} 
                        className={`${styles.tab} ${activeTabId === tab.id ? styles.tabActive : ""}`}
                        onClick={() => setActiveTabId(tab.id)}
                    >
                        <span>{tab.title}</span>
                        <span className={styles.tabClose} onClick={(e) => closeTab(tab.id, e)}><IconX /></span>
                    </div>
                ))}
                {mode === "Add" && <button className={styles.addTabBtn} onClick={addTab}>+</button>}

                <div className={styles.windowActions}>
                    <span className={styles.windowActionIcon} onClick={() => toggleMinimize(activeTabId)} title="Minimize"><IconMinimize /></span>
                    <span className={styles.windowActionIcon} onClick={toggleSplit} title="Split View"><IconSplit /></span>
                    <span className={styles.windowActionIcon} onClick={onClose} title="Close All"><IconX /></span>
                </div>
            </div>

            {isAnyVisible && activeTab && !activeTab.isMinimized && (
                <>
                    <div className={styles.managerHeader}>Purchase Order Details</div>
                    <div className={`${styles.formContent} ${splitMode ? styles.splitMode : ""}`}>
                        {!splitMode ? (
                            <div className={styles.formWrapper}>
                                {activeTab ? renderForm(activeTab, () => closeTab(activeTabId)) : <div style={{padding: '40px', textAlign: 'center'}}>Select a task to continue</div>}
                            </div>
                        ) : (
                            <>
                                <div className={styles.formWrapper}>
                                    {splitTabIds[0] ? renderForm(tabs.find(t => t.id === splitTabIds[0]), () => setSplitTabIds([null, splitTabIds[1]])) : <div className={styles.placeholder}>Select PO</div>}
                                </div>
                                <div className={styles.formWrapper}>
                                    {splitTabIds[1] ? renderForm(tabs.find(t => t.id === splitTabIds[1]), () => setSplitTabIds([splitTabIds[0], null])) : <div className={styles.placeholder}>Select PO</div>}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            <div className={styles.minimizedBar}>
                {minimizedTabs.map(tab => (
                    <div key={tab.id} className={styles.minimizedItem} onClick={() => toggleMinimize(tab.id)}>
                        <span className={styles.minimizedTitle}>{tab.title}</span>
                        <div className={styles.minimizedActions}>
                            <button className={styles.minimizedActionBtn} onClick={(e) => { e.stopPropagation(); toggleMinimize(tab.id); }}><IconMaximize /></button>
                            <button className={styles.minimizedActionBtn} onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}><IconX /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PurchaseOrderManager;
