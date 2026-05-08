import React, { useState, useEffect } from "react";
import styles from "../../styles/inventory/product-form-manager.module.css";
import SupplierForm from "./SupplierForm";
import SupplierView from "./SupplierView";

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

const SupplierFormManager = ({ onClose, mode = "Add", initialData }) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const [tabs, setTabs] = useState(() => {
    if (Array.isArray(initialData) && initialData.length > 0) {
      return initialData.map((s, idx) => ({
        id: String(idx + 1),
        title: s.supplierName || `Edit Supplier ${idx + 1}`,
        isMinimized: false,
        data: s,
        mode: mode
      }));
    }
    return [
      { 
        id: '1', 
        title: initialData?.supplierName || (mode === "Add" ? 'Supplier 1' : 'Edit Supplier'), 
        isMinimized: false, 
        data: initialData || {},
        mode: mode
      }
    ];
  });

  const [activeTabId, setActiveTabId] = useState('1');
  const [splitMode, setSplitMode] = useState(false);
  const [splitTabIds, setSplitTabIds] = useState(['1', null]);

  const addTab = () => {
    const newId = String(Date.now());
    const newTab = { id: newId, title: `Supplier ${tabs.length + 1}`, isMinimized: false, data: {}, mode: "Add" };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    if (splitMode && !splitTabIds[1]) setSplitTabIds([splitTabIds[0], newId]);
  };

  const closeTab = (id, e) => {
    e?.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) { onClose(); return; }
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
    if (splitTabIds.includes(id)) setSplitTabIds(splitTabIds.map(sid => sid === id ? null : sid));
  };

  const toggleMinimize = (id) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isMinimized: !t.isMinimized } : t));
    setTabs(prev => {
        const target = prev.find(t => t.id === id);
        if (target?.isMinimized && activeTabId === id) {
             const next = prev.find(t => !t.isMinimized);
             if (next) setActiveTabId(next.id);
        }
        return prev;
    });
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

  return (
    <div className={styles.taskManager} style={{ paddingBottom: minimizedTabs.length > 0 ? '60px' : '0' }}>
      <div className={styles.tabBar}>
        {visibleTabs.map(tab => (
          <div key={tab.id} className={`${styles.tab} ${activeTabId === tab.id ? styles.tabActive : ""}`} onClick={() => setActiveTabId(tab.id)}>
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
          <div className={styles.managerHeader} style={{ background: '#F9FAFB', padding: '16px 48px', borderBottom: '1px solid #eee', fontSize: '15px', fontWeight: '500', color: '#111' }}>
            {activeTab.mode || mode} Supplier
          </div>
          <div className={`${styles.formContent} ${splitMode ? styles.splitMode : ""}`}>
            {!splitMode ? (
              <div className={styles.formWrapper}>
                {activeTab.mode === "View" ? (
                  <SupplierView key={`view-${activeTab.id}`} data={activeTab.data} onBack={() => closeTab(activeTab.id)} isSplit={splitMode} />
                ) : (
                  <SupplierForm key={`form-${activeTab.id}`} initialData={activeTab.data} onSave={() => closeTab(activeTab.id)} onBack={() => closeTab(activeTab.id)} />
                )}
              </div>
            ) : (
              <>
                {[0, 1].map(idx => (
                  <div key={idx} className={styles.formWrapper}>
                    {splitTabIds[idx] && tabs.find(t => t.id === splitTabIds[idx]) ? (
                      (() => {
                        const tab = tabs.find(t => t.id === splitTabIds[idx]);
                        return (
                          <>
                            <div className={styles.formLabel}>{tab.title}</div>
                            {tab.mode === "View" ? (
                              <SupplierView key={`view-${tab.id}`} data={tab.data} onBack={() => setSplitTabIds(idx === 0 ? [null, splitTabIds[1]] : [splitTabIds[0], null])} isSplit={splitMode} />
                            ) : (
                              <SupplierForm key={`form-${tab.id}`} initialData={tab.data} onSave={() => closeTab(tab.id)} onBack={() => setSplitTabIds(idx === 0 ? [null, splitTabIds[1]] : [splitTabIds[0], null])} />
                            )}
                          </>
                        );
                      })()
                    ) : <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>Select supplier</div>}
                  </div>
                ))}
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
              <button className={styles.minimizedActionBtn} onClick={(e) => { e.stopPropagation(); toggleMinimize(tab.id); }} title="Maximize"><IconMaximize /></button>
              <button className={styles.minimizedActionBtn} onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} title="Close"><IconX /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierFormManager;
