import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/inventory/product-form-manager.module.css";
import CustomerForm from "./CustomerForm";
import CustomerView from "./CustomerView";

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

const CustomerFormManager = ({ onClose, mode = "Add", initialData, trigger }) => {
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
    if (!initialData && mode !== "Add") return;
    
    const firstCustomerId = Array.isArray(initialData) 
      ? initialData.map(c => c.vendorCustomerId).join(",") 
      : (initialData?.vendorCustomerId || "new");
    const propKey = `${mode}-${firstCustomerId}-${trigger || 0}`;
    
    if (lastProcessedPropRef.current === propKey) {
      return;
    }
    lastProcessedPropRef.current = propKey;

    if (Array.isArray(initialData) && initialData.length > 0) {
      const newTabs = [...tabs];
      let lastTabId = activeTabId;
      
      initialData.forEach((c, idx) => {
        const tabId = c.vendorCustomerId ? `customer_${c.vendorCustomerId}` : `new_${Date.now()}_${idx}`;
        const existingTab = newTabs.find(t => t.id === tabId);
        
        if (existingTab) {
          existingTab.isMinimized = false;
          existingTab.mode = mode;
          existingTab.data = c;
          lastTabId = tabId;
        } else {
          const defaultTitle = (c.firstName || c.lastName) ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : `Customer ${newTabs.length + 1}`;
          newTabs.push({
            id: tabId,
            title: defaultTitle,
            defaultTitle: defaultTitle,
            isMinimized: false,
            data: c,
            mode: mode
          });
          lastTabId = tabId;
        }
      });
      
      setTabs(newTabs);
      setActiveTabId(lastTabId);
    } else {
      if (mode === "Add") {
        const existingAddTab = tabs.find(t => t.mode === "Add" && !t.data?.vendorCustomerId);
        if (existingAddTab) {
          setActiveTabId(existingAddTab.id);
          setTabs(prev => prev.map(t => t.id === existingAddTab.id ? { ...t, isMinimized: false } : t));
        } else {
          const newId = `new_${Date.now()}`;
          const defaultTitle = `Customer ${tabs.length + 1}`;
          const newTab = {
            id: newId,
            title: defaultTitle,
            defaultTitle: defaultTitle,
            isMinimized: false,
            data: {},
            mode: "Add"
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(newId);
          if (splitMode && !splitTabIds[1]) {
            setSplitTabIds([splitTabIds[0], newId]);
          }
        }
      } else if ((mode === "Edit" || mode === "View") && initialData?.vendorCustomerId) {
        const customerId = initialData.vendorCustomerId;
        const tabId = `customer_${customerId}`;
        const existingTab = tabs.find(t => t.id === tabId);
        if (existingTab) {
          setActiveTabId(tabId);
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isMinimized: false, mode: mode, data: initialData } : t));
        } else {
          const defaultTitle = (initialData.firstName || initialData.lastName) ? `${initialData.firstName || ''} ${initialData.lastName || ''}`.trim() : `${mode} Customer`;
          const newTab = {
            id: tabId,
            title: defaultTitle,
            defaultTitle: defaultTitle,
            isMinimized: false,
            data: initialData,
            mode: mode
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(tabId);
          if (splitMode && !splitTabIds[1]) {
            setSplitTabIds([splitTabIds[0], tabId]);
          }
        }
      }
    }
  }, [mode, initialData, trigger]);

  const addTab = () => {
    const newId = String(Date.now());
    const defaultTitle = `Customer ${tabs.length + 1}`;
    const newTab = { 
      id: newId, 
      title: defaultTitle, 
      defaultTitle: defaultTitle,
      isMinimized: false, 
      data: {}, 
      mode: "Add" 
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    if (splitMode && !splitTabIds[1]) setSplitTabIds([splitTabIds[0], newId]);
  };

  const updateTabData = (id, newData) => {
    setTabs(prev => prev.map(t => {
      if (t.id === id) {
        const fullName = (newData.firstName || newData.lastName) ? `${newData.firstName || ''} ${newData.lastName || ''}`.trim() : t.defaultTitle;
        return {
          ...t,
          title: fullName,
          data: newData
        };
      }
      return t;
    }));
  };

  const closeTab = (id, e) => {
    e?.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      lastProcessedPropRef.current = null;
      onClose();
      return;
    }
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
    if (splitTabIds.includes(id)) setSplitTabIds(splitTabIds.map(sid => sid === id ? null : sid));
  };

  const toggleMinimize = (id) => {
    setTabs(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, isMinimized: !t.isMinimized } : t);
      const target = updated.find(t => t.id === id);
      if (target && !target.isMinimized) {
        setActiveTabId(id);
      } else if (target?.isMinimized && activeTabId === id) {
        const next = updated.find(t => !t.isMinimized);
        if (next) setActiveTabId(next.id);
      }
      return updated;
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

  return (
    <div className={`${styles.taskManager} ${isAnyVisible ? styles.managerActive : ""} ${(!isAnyVisible && minimizedTabs.length > 0) ? `${styles.minimizedMode} task-manager-minimized` : ""}`} style={{ paddingBottom: minimizedTabs.length > 0 ? '60px' : '0' }}>
      {isAnyVisible && (
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
            {tabs.length > 1 && (
              <span className={styles.windowActionIcon} onClick={toggleSplit} title="Split View"><IconSplit /></span>
            )}
            <span className={styles.windowActionIcon} onClick={onClose} title="Close All"><IconX /></span>
          </div>
        </div>
      )}

      <div style={{ display: (isAnyVisible && activeTab && !activeTab.isMinimized) ? 'contents' : 'none' }}>
        <div className={styles.managerHeader} style={{ background: '#F9FAFB', padding: '16px 48px', borderBottom: '1px solid #eee', fontSize: '15px', fontWeight: '500', color: '#111' }}>
          {(activeTab || {}).mode || mode} Customer
        </div>
        <div className={`${styles.formContent} ${splitMode ? styles.splitMode : ""}`}>
          <div className={styles.formWrapper} style={{ display: (!splitMode || splitTabIds[0]) ? 'flex' : 'none' }}>
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                style={{ display: tab.id === (splitMode ? splitTabIds[0] : activeTabId) && !tab.isMinimized ? 'contents' : 'none' }}
              >
                {splitMode && <div className={styles.formLabel}>{tab.title}</div>}
                {tab.mode === "View" ? (
                  <CustomerView 
                    key={`view-${tab.id}`} 
                    data={tab.data} 
                    onBack={() => {
                      if (splitMode) {
                        setSplitTabIds([null, splitTabIds[1]]);
                      } else {
                        closeTab(tab.id);
                      }
                    }} 
                    isSplit={splitMode} 
                    onEdit={() => {
                      const existingTab = tabs.find(t => t.id === tab.id);
                      if (existingTab) {
                         setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, mode: "Edit" } : t));
                      }
                    }}
                  />
                ) : (
                  <CustomerForm 
                    key={`form-${tab.id}`} 
                    initialData={tab.data} 
                    mode={tab.mode}
                    onChange={(newData) => updateTabData(tab.id, newData)}
                    onSave={() => closeTab(tab.id)} 
                    onBack={() => {
                      if (splitMode) {
                        setSplitTabIds([null, splitTabIds[1]]);
                      } else {
                        closeTab(tab.id);
                      }
                    }} 
                  />
                )}
              </div>
            ))}
            {splitMode && !splitTabIds[0] && <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>Select customer</div>}
          </div>

          <div className={styles.formWrapper} style={{ display: splitMode ? 'flex' : 'none' }}>
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                style={{ display: tab.id === splitTabIds[1] && !tab.isMinimized ? 'contents' : 'none' }}
              >
                <div className={styles.formLabel}>{tab.title}</div>
                {tab.mode === "View" ? (
                  <CustomerView 
                    key={`view-${tab.id}`} 
                    data={tab.data} 
                    onBack={() => setSplitTabIds([splitTabIds[0], null])} 
                    isSplit={splitMode} 
                    onEdit={() => {
                      const existingTab = tabs.find(t => t.id === tab.id);
                      if (existingTab) {
                         setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, mode: "Edit" } : t));
                      }
                    }}
                  />
                ) : (
                  <CustomerForm 
                    key={`form-${tab.id}`} 
                    initialData={tab.data} 
                    mode={tab.mode}
                    onChange={(newData) => updateTabData(tab.id, newData)}
                    onSave={() => closeTab(tab.id)} 
                    onBack={() => setSplitTabIds([splitTabIds[0], null])} 
                  />
                )}
              </div>
            ))}
            {!splitTabIds[1] && <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>Select customer</div>}
          </div>
        </div>
      </div>

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

export default CustomerFormManager;
