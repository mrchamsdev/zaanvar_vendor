import React, { useState, useEffect } from "react";
import styles from "../../styles/inventory/productManager.module.css";
import ProductForm from "./ProductForm";
import ProductView from "./ProductView";

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
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ProductFormManager = ({ onClose, mode = "Add", initialData }) => {
  // Lock body scroll when popup is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [tabs, setTabs] = useState(() => {
    if (Array.isArray(initialData) && initialData.length > 0) {
      return initialData.map((prod, idx) => ({
        id: String(idx + 1),
        title: prod.productName || `Edit Product ${idx + 1}`,
        isMinimized: false,
        data: prod,
        mode: mode // Standardize to the manager's mode
      }));
    }
    // Default single tab for Add mode or fallback
    return [
      { 
        id: '1', 
        title: initialData?.productName || (mode === "Add" ? 'Product 1' : 'Edit Product'), 
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
    const newTab = { id: newId, title: `Product #${tabs.length + 1}`, isMinimized: false, data: {}, mode: "Add" };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    if (splitMode && !splitTabIds[1]) {
        setSplitTabIds([splitTabIds[0], newId]);
    }
  };

  const closeTab = (id, e) => {
    e?.stopPropagation();
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
    setTabs(tabs.map(t => t.id === id ? { ...t, isMinimized: !t.isMinimized } : t));
    if (activeTabId === id) {
        const next = tabs.find(t => t.id !== id && !t.isMinimized);
        if (next) setActiveTabId(next.id);
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

  const visibleTabs = tabs.filter(t => !t.isMinimized);
  const minimizedTabs = tabs.filter(t => t.isMinimized);

  return (
    <div className={styles.taskManager}>
      {/* Tab Bar */}
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

      <div className={styles.managerHeader}>
        {mode} Product Details
      </div>

      {/* Main Content Area */}
      <div className={`${styles.formContent} ${splitMode ? styles.splitMode : ""}`}>
        {!splitMode ? (
          <div className={styles.formWrapper}>
            {tabs.find(t => t.id === activeTabId) && (
              tabs.find(t => t.id === activeTabId).mode === "View" ? (
                <ProductView 
                  data={tabs.find(t => t.id === activeTabId).data}
                  onBack={() => closeTab(activeTabId)}
                  isSplit={splitMode}
                />
              ) : (
                <ProductForm 
                  initialData={tabs.find(t => t.id === activeTabId).data} 
                  onSave={onClose}
                  onBack={() => closeTab(activeTabId)}
                />
              )
            )}
          </div>
        ) : (
          <>
            <div className={styles.formWrapper}>
              {splitTabIds[0] && tabs.find(t => t.id === splitTabIds[0]) ? (
                (() => {
                  const tab = tabs.find(t => t.id === splitTabIds[0]);
                  return (
                    <>
                      <div className={styles.formLabel}>{tab.title}</div>
                      {tab.mode === "View" ? (
                        <ProductView 
                          data={tab.data}
                          onBack={() => setSplitTabIds([null, splitTabIds[1]])}
                          isSplit={splitMode}
                        />
                      ) : (
                        <ProductForm 
                          initialData={tab.data}
                          onSave={onClose}
                          onBack={() => setSplitTabIds([null, splitTabIds[1]])}
                        />
                      )}
                    </>
                  );
                })()
              ) : <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>Select product</div>}
            </div>
            <div className={styles.formWrapper}>
               {splitTabIds[1] && tabs.find(t => t.id === splitTabIds[1]) ? (
                (() => {
                  const tab = tabs.find(t => t.id === splitTabIds[1]);
                  return (
                    <>
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
                          onSave={onClose}
                          onBack={() => setSplitTabIds([splitTabIds[0], null])}
                        />
                      )}
                    </>
                  );
                })()
              ) : <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#888'}}>Select product</div>}
            </div>
          </>
        )}
      </div>

      {/* Minimized Bar */}
      <div className={styles.minimizedBar}>
        {minimizedTabs.map(tab => (
          <div key={tab.id} className={styles.minimizedItem} onClick={() => toggleMinimize(tab.id)}>
            {tab.title}
            <span style={{fontSize: 10}}>⬜</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductFormManager;
