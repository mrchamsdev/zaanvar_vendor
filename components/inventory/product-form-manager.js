import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/inventory/product-form-manager.module.css";
import ProductForm from "./product-form";
import ProductView from "./product-view";

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

const ProductFormManager = ({ onClose, mode = "Add", initialData, trigger }) => {
  const [tabs, setTabs] = useState([]);

  const [activeTabId, setActiveTabId] = useState(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitTabIds, setSplitTabIds] = useState([null, null]);

  const lastProcessedPropRef = useRef(null);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const visibleTabs = tabs.filter(t => !t.isMinimized);
  const isAnyVisible = visibleTabs.length > 0;
  const minimizedTabs = tabs.filter(t => t.isMinimized);

  // Lock body scroll when active, unlock when minimized
  useEffect(() => {
    if (isAnyVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAnyVisible]);

  // React to prop changes (dynamically add/edit/view tabs when list buttons are clicked)
  useEffect(() => {
    const firstProductId = Array.isArray(initialData)
      ? initialData.map(p => p.productId).join(",")
      : (initialData?.productId || "new");
    const propKey = `${mode}-${firstProductId}-${trigger || 0}`;

    if (lastProcessedPropRef.current === propKey) {
      return;
    }
    lastProcessedPropRef.current = propKey;

    if (Array.isArray(initialData) && initialData.length > 0) {
      const newTabs = [...tabs];
      let lastTabId = activeTabId;

      initialData.forEach((p, idx) => {
        const tabId = p.productId ? `product_${p.productId}` : `new_${Date.now()}_${idx}`;
        const existingTab = newTabs.find(t => t.id === tabId);

        if (existingTab) {
          existingTab.isMinimized = false;
          existingTab.mode = mode;
          existingTab.data = p;
          lastTabId = tabId;
        } else {
          const defaultTitle = p.productName || `Product ${newTabs.length + 1}`;
          newTabs.push({
            id: tabId,
            title: defaultTitle,
            shortTitle: defaultTitle.substring(0, 3),
            isMinimized: false,
            data: p,
            mode: mode
          });
          lastTabId = tabId;
        }
      });

      setTabs(newTabs);
      setActiveTabId(lastTabId);
    } else {
      if (mode === "Add") {
        const existingAddTab = tabs.find(t => t.mode === "Add" && !t.data?.productId);
        if (existingAddTab) {
          setActiveTabId(existingAddTab.id);
          setTabs(prev => prev.map(t => t.id === existingAddTab.id ? { ...t, isMinimized: false } : t));
        } else {
          const newId = String(Date.now());
          const nextNum = tabs.length + 1;
          const newTab = {
            id: newId,
            title: `Product ${nextNum}`,
            shortTitle: `P${nextNum}`,
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
      } else if ((mode === "Edit" || mode === "View") && initialData?.productId) {
        const productId = initialData.productId;
        const tabId = `product_${productId}`;
        const existingTab = tabs.find(t => t.id === tabId);
        if (existingTab) {
          setActiveTabId(tabId);
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isMinimized: false, mode: mode, data: initialData } : t));
        } else {
          const defaultTitle = initialData.productName || `${mode} Product`;
          const newTab = {
            id: tabId,
            title: defaultTitle,
            shortTitle: defaultTitle.substring(0, 3),
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
    const nextNum = tabs.length + 1;
    const newTab = { 
        id: newId, 
        title: `Product ${nextNum}`, 
        shortTitle: `P${nextNum}`,
        isMinimized: false, 
        data: {}, 
        mode: "Add" 
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    if (splitMode && !splitTabIds[1]) {
        setSplitTabIds([splitTabIds[0], newId]);
    }
  };

  const closeTab = (id, e) => {
    e?.stopPropagation();
    const tabToClose = tabs.find(t => t.id === id);
    if (!tabToClose) return;

    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
        onClose();
        return;
    }
    
    setTabs(newTabs);

    // If closing active tab, pick a new one
    if (activeTabId === id) {
        const nextVisible = newTabs.find(t => !t.isMinimized);
        setActiveTabId(nextVisible ? nextVisible.id : newTabs[0].id);
    }

    // Handle split mode cleanup
    if (splitTabIds.includes(id)) {
        const nextSplitIds = splitTabIds.map(sid => sid === id ? null : sid);
        setSplitTabIds(nextSplitIds);
        
        // If we no longer have 2 tabs in split, exit split mode to show the remaining one as full
        if (nextSplitIds.filter(sid => sid !== null).length < 2) {
            setSplitMode(false);
        }
    }
  };

  const toggleMinimize = (id) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    
    const isNowMinimized = !tab.isMinimized;
    
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isMinimized: isNowMinimized } : t));
    
    if (isNowMinimized) {
        // If minimizing, find a new active tab if this was the one
        if (activeTabId === id) {
            const nextVisible = tabs.find(t => t.id !== id && !t.isMinimized);
            if (nextVisible) setActiveTabId(nextVisible.id);
        }

        // If in split mode and this tab was one of the split views
        if (splitMode && splitTabIds.includes(id)) {
            const nextSplitIds = splitTabIds.map(sid => sid === id ? null : sid);
            setSplitTabIds(nextSplitIds);
            
            // If only one non-minimized tab left in split, go back to full screen
            if (nextSplitIds.filter(sid => sid !== null).length < 2) {
                setSplitMode(false);
            }
        }
    } else {
        // If maximizing, make it active
        setActiveTabId(id);
    }
  };

  const toggleSplit = () => {
    if (!splitMode && tabs.length > 1) {
        // Try to pick two visible tabs
        const visible = tabs.filter(t => !t.isMinimized);
        setSplitTabIds([visible[0].id, visible[1]?.id || null]);
    }
    setSplitMode(!splitMode);
  };

  return (
    <div className={`${styles.taskManager} ${isAnyVisible ? styles.managerActive : ""} ${(!isAnyVisible && minimizedTabs.length > 0) ? `${styles.minimizedMode} task-manager-minimized` : ""}`} style={{ paddingBottom: minimizedTabs.length > 0 ? '60px' : '0' }}>
      {/* Tab Bar - Only show when a tab is actively being worked on */}
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
        <div className={styles.managerHeader}>
          {(activeTab || {}).mode || mode} Product Details
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
                  <ProductView 
                    data={tab.data}
                    onBack={() => {
                      if (splitMode) {
                        setSplitTabIds([null, splitTabIds[1]]);
                      } else {
                        closeTab(tab.id);
                      }
                    }}
                    isSplit={splitMode}
                  />
                ) : (
                  <ProductForm 
                    initialData={tab.data} 
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
            {splitMode && !splitTabIds[0] && <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>Select product</div>}
          </div>

          <div className={styles.formWrapper} style={{ display: splitMode ? 'flex' : 'none' }}>
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                style={{ display: tab.id === splitTabIds[1] && !tab.isMinimized ? 'contents' : 'none' }}
              >
                <div className={styles.formLabel}>{tab.title}</div>
                {tab.mode === "View" ? (
                  <ProductView 
                    data={tab.data}
                    onBack={() => setSplitTabIds([splitTabIds[0], null])}
                    isSplit={splitMode}
                  />
                ) : (
                  <ProductForm 
                    initialData={tab.data}
                    onSave={() => closeTab(tab.id)}
                    onBack={() => setSplitTabIds([splitTabIds[0], null])}
                  />
                )}
              </div>
            ))}
            {!splitTabIds[1] && <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>Select product</div>}
          </div>
        </div>
      </div>

      {/* Minimized Bar */}
      <div className={styles.minimizedBar}>
        {minimizedTabs.map(tab => (
          <div key={tab.id} className={styles.minimizedItem} onClick={() => toggleMinimize(tab.id)}>
            <span className={styles.minimizedTitle}>{tab.title}</span>
            <div className={styles.minimizedActions}>
              <button 
                className={styles.minimizedActionBtn} 
                onClick={(e) => { e.stopPropagation(); toggleMinimize(tab.id); }}
                title="Maximize"
              >
                <IconMaximize />
              </button>
              <button 
                className={styles.minimizedActionBtn} 
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                title="Close"
              >
                <IconX />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductFormManager;
