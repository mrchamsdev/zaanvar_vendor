import React, { useState, useEffect, useRef } from "react";
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

const PurchaseOrderManager = ({ onClose, onSave, mode = "Add", initialId, initialData, totalOrders = 0, trigger }) => {
    const [tabs, setTabs] = useState([]);

    const [activeTabId, setActiveTabId] = useState(null);
    const [splitMode, setSplitMode] = useState(false);
    const [splitTabIds, setSplitTabIds] = useState([null, null]);

    const lastProcessedPropRef = useRef(null);
    const visibleTabs = tabs.filter(t => !t.isMinimized);
    const isAnyVisible = visibleTabs.length > 0;
    const minimizedTabs = tabs.filter(t => t.isMinimized);

    // Lock body scroll only when at least one tab is visible
    useEffect(() => {
        if (isAnyVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isAnyVisible]);

    // Handle updates to props dynamically (reactive tab addition/activation)
    useEffect(() => {
        const propKey = `${mode}-${initialId || "new"}-${trigger || 0}`;
        if (lastProcessedPropRef.current === propKey) {
            return;
        }
        lastProcessedPropRef.current = propKey;

        if (mode === "Add") {
            const existingAddTab = tabs.find(t => t.mode === "Add" && !t.data?.productsPurchaseRqstID);
            if (existingAddTab) {
                setActiveTabId(existingAddTab.id);
                setTabs(prev => prev.map(t => t.id === existingAddTab.id ? { ...t, isMinimized: false } : t));
            } else {
                const newId = String(Date.now());
                const nextNum = totalOrders + tabs.length + 1;
                const newTab = {
                    id: newId,
                    title: `Purchase Order ${nextNum}`,
                    orderNumber: nextNum,
                    isMinimized: false,
                    data: initialData || {},
                    mode: "Add"
                };
                setTabs(prev => [...prev, newTab]);
                setActiveTabId(newId);
                if (splitMode && !splitTabIds[1]) {
                    setSplitTabIds([splitTabIds[0], newId]);
                }
            }
        } else if ((mode === "View" || mode === "Receive") && initialId) {
            const tabId = String(initialId);
            const existingTab = tabs.find(t => String(t.id) === String(tabId));
            if (existingTab) {
                setActiveTabId(tabId);
                setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isMinimized: false, mode: mode, data: initialData } : t));
            } else {
                const newTab = {
                    id: tabId,
                    title: mode === "View" ? `Order Details ${String(initialId).padStart(6, '0')}` : `Receive Order ${String(initialId).padStart(6, '0')}`,
                    orderNumber: initialId,
                    isMinimized: false,
                    data: initialData || {},
                    mode: mode
                };
                setTabs(prev => [...prev, newTab]);
                setActiveTabId(tabId);
                if (splitMode && !splitTabIds[1]) {
                    setSplitTabIds([splitTabIds[0], tabId]);
                }
            }
        }
    }, [mode, initialId, initialData, trigger]);

    const addTab = () => {
        const newId = String(Date.now());
        const nextNum = totalOrders + tabs.length + 1;
        const newTab = { id: newId, title: `Purchase Order ${nextNum}`, orderNumber: nextNum, isMinimized: false, data: {}, mode: "Add" };
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
        if (activeTabId === id) {
            const closedIndex = tabs.findIndex(t => t.id === id);
            // Try previous tab first, then fallback to next (now at same index), else first
            const nextActive = newTabs[closedIndex - 1] || newTabs[closedIndex] || newTabs[0];
            setActiveTabId(nextActive.id);
        }
        if (splitTabIds.includes(id)) {
            setSplitTabIds(splitTabIds.map(sid => sid === id ? null : sid));
        }
    };

    const toggleMinimize = (id) => {
        const targetTab = tabs.find(t => t.id === id);
        if (!targetTab) return;

        const isNowMinimizing = !targetTab.isMinimized;

        setTabs(prev => prev.map(t => t.id === id ? { ...t, isMinimized: isNowMinimizing } : t));

        if (isNowMinimizing) {
            // If minimizing the current active tab, switch to another visible one
            if (id === activeTabId) {
                const otherVisible = tabs.find(t => t.id !== id && !t.isMinimized);
                if (otherVisible) {
                    setActiveTabId(otherVisible.id);
                }
            }
        } else {
            // If maximizing, make it active
            setActiveTabId(id);
        }
    };

    const toggleSplit = () => {
        if (!splitMode && tabs.length > 1) {
            const visible = tabs.filter(t => !t.isMinimized);
            setSplitTabIds([visible[0].id, visible[1]?.id || null]);
        }
        setSplitMode(!splitMode);
    };

    const activeTab = tabs.find(t => t.id === activeTabId);

    const renderForm = (tab, onBack) => {
        if (!tab) return null;
        if (tab.mode === "View") {
            return (
                <PurchaseOrderDetails
                    key={tab.id}
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
                    key={tab.id}
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
                key={tab.id}
                initialData={tab.data}
                orderNumber={tab.orderNumber}
                onSave={() => {
                    if (onSave) onSave();
                    closeTab(tab.id);
                }}
                onBack={onBack}
            />
        );
    };

    return (
        <div className={`${styles.taskManager} ${(!isAnyVisible && minimizedTabs.length > 0) ? `${styles.minimizedMode} task-manager-minimized` : ""}`}>
            <div className={`${styles.tabBar} ${(!isAnyVisible && minimizedTabs.length > 0) ? styles.hidden : ""}`}>
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
                    {tabs.length > 1 && (
                        <span className={styles.windowActionIcon} onClick={toggleSplit} title="Split View"><IconSplit /></span>
                    )}
                    <span className={styles.windowActionIcon} onClick={onClose} title="Close All"><IconX /></span>
                </div>
            </div>

            <div className={`${styles.managerHeader} ${(!isAnyVisible && minimizedTabs.length > 0) ? styles.hidden : ""}`}>
                Purchase Order Details
            </div>

            <div className={`${styles.formContent} ${splitMode ? styles.splitMode : ""} ${(!isAnyVisible && minimizedTabs.length > 0) ? styles.hidden : ""}`}>
                {tabs.map(tab => {
                    const isVisible = splitMode ? splitTabIds.includes(tab.id) : activeTabId === tab.id;
                    const isMinimized = tab.isMinimized;

                    return (
                        <div
                            key={tab.id}
                            className={styles.formWrapper}
                            style={{ display: (isVisible && !isMinimized) ? 'flex' : 'none' }}
                        >
                            {renderForm(tab, () => closeTab(tab.id))}
                        </div>
                    );
                })}
                {splitMode && splitTabIds.some(id => id === null) && (
                    <div className={styles.formWrapper}>
                        <div className={styles.placeholder}>Select PO from Tabs</div>
                    </div>
                )}
            </div>

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
