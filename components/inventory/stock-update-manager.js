import React, { useState, useEffect } from "react";
import styles from "../../styles/inventory/stock-update-manager.module.css";
import StockUpdateForm from "./stock-update-form";

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

const StockUpdateManager = ({ onClose, onSave, mode = "Add", initialId, initialData, triggerNewTab }) => {
    const [tabs, setTabs] = useState(() => {
        if (mode === "View" && initialId) {
            return [{ 
                id: initialId, 
                title: `Stock Details #${initialId}`, 
                isMinimized: false, 
                data: initialData || {}, 
                mode: mode 
            }];
        }
        return []; 
    });

    const [activeTabId, setActiveTabId] = useState(mode === "View" && initialId ? initialId : null);
    const [splitMode, setSplitMode] = useState(false);
    const [splitTabIds, setSplitTabIds] = useState([mode === "View" && initialId ? initialId : null, null]);
    const lastProcessedTrigger = React.useRef(0);

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

    // Handle external triggers for new tabs (Add mode)
    useEffect(() => {
        if (triggerNewTab > lastProcessedTrigger.current && mode === "Add") {
            addTab();
            lastProcessedTrigger.current = triggerNewTab;
        }
    }, [triggerNewTab, mode]);

    // Handle external triggers for View mode (opening multiple details)
    useEffect(() => {
        if (mode === "View" && initialId) {
            const exists = tabs.find(t => t.id === initialId);
            if (!exists) {
                const newTab = { 
                    id: initialId, 
                    title: `Stock Details #${initialId}`, 
                    isMinimized: false, 
                    data: initialData || {}, 
                    mode: "View" 
                };
                setTabs(prev => [...prev, newTab]);
                setActiveTabId(initialId);
            } else {
                setActiveTabId(initialId);
                // If it was minimized, maximize it
                if (exists.isMinimized) {
                    toggleMinimize(initialId);
                }
            }
        }
    }, [initialId, mode]);

    const addTab = () => {
        const newId = String(Date.now());
        const nextNum = tabs.length + 1;
        const newTab = { id: newId, title: `Update Stock #${nextNum}`, isMinimized: false, data: {}, mode: "Add" };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        if (splitMode && !splitTabIds[1]) {
            setSplitTabIds([splitTabIds[0], newId]);
        }
    };

    const closeTab = (id, e) => {
        if (e) e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) {
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
        const targetTab = tabs.find(t => t.id === id);
        if (!targetTab) return;

        const isNowMinimizing = !targetTab.isMinimized;
        
        setTabs(prev => prev.map(t => t.id === id ? { ...t, isMinimized: isNowMinimizing } : t));

        if (isNowMinimizing) {
            if (id === activeTabId) {
                const otherVisible = tabs.find(t => t.id !== id && !t.isMinimized);
                if (otherVisible) {
                    setActiveTabId(otherVisible.id);
                }
            }
        } else {
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

    return (
        <div className={`${styles.taskManager} ${(!isAnyVisible && minimizedTabs.length > 0) ? `${styles.minimizedMode} task-manager-minimized` : ""}`}>
            {isAnyVisible && (
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
                    <button className={styles.addTabBtn} onClick={addTab}>+</button>

                    <div className={styles.windowActions}>
                        <span className={styles.windowActionIcon} onClick={() => toggleMinimize(activeTabId)} title="Minimize"><IconMinimize /></span>
                        <span className={styles.windowActionIcon} onClick={toggleSplit} title="Split View"><IconSplit /></span>
                        <span className={styles.windowActionIcon} onClick={onClose} title="Close All"><IconX /></span>
                    </div>
                </div>
            )}

            <div className={`${styles.managerHeader} ${(!isAnyVisible && minimizedTabs.length > 0) ? styles.hidden : ""}`}>
                Update Stock Multi-Tasking
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
                            <StockUpdateForm 
                                key={tab.id}
                                isEmbedded={true}
                                mode={tab.mode}
                                initialId={tab.mode === "View" ? tab.id : null}
                                initialData={tab.data}
                                onSave={() => {
                                    if (onSave) onSave();
                                    closeTab(tab.id);
                                }}
                                onClose={() => closeTab(tab.id)}
                            />
                        </div>
                    );
                })}
                {splitMode && splitTabIds.some(id => id === null) && (
                    <div className={styles.formWrapper}>
                        <div className={styles.placeholder}>Select Stock Update from Tabs</div>
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

export default StockUpdateManager;
