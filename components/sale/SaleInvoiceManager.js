import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../../styles/sale/sale-invoice-manager.module.css";
import SaleInvoiceForm from "./SaleInvoiceForm";
import useStore from "../../components/state/useStore";
import { saleService } from "../../services/saleService";
import { toast } from "sonner";

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

const SaleInvoiceManager = ({ isOpen, mode = "add", saleId, onClose, onRefresh }) => {
  const { jwtToken } = useStore();
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitTabIds, setSplitTabIds] = useState([null, null]);

  const lastProcessedPropRef = useRef(null);
  const visibleTabs = tabs.filter(t => !t.isMinimized);
  const isAnyVisible = visibleTabs.length > 0;
  const minimizedTabs = tabs.filter(t => t.isMinimized);

  // Lock body scroll when popup is open and tab is visible
  useEffect(() => {
    if (!isOpen) return;
    if (isAnyVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, isAnyVisible]);

  const fetchInvoiceDetails = async (sid, tabId) => {
    try {
      const res = await saleService.getSaleInvoiceById(jwtToken, sid);
      if (res.status === "success" && res.data) {
        const customerName = res.data.customer 
          ? `${res.data.customer.firstName} ${res.data.customer.lastName}`.trim() 
          : (res.data.partyName || "Walk-in Customer");
        
        setTabs(prev => prev.map(t => t.id === tabId ? {
          ...t,
          title: res.data.userOrderId || customerName || `Sale ${sid}`,
          shortTitle: String(res.data.userOrderId || sid || "").slice(-6),
          data: res.data,
          loading: false
        } : t));
      } else {
        toast.error("Failed to load invoice details");
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, loading: false } : t));
      }
    } catch (e) {
      console.error("Error fetching invoice details:", e);
      toast.error("Error loading invoice details");
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, loading: false } : t));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (tabs.length > 0) {
        setTabs([]);
        setActiveTabId(null);
        setSplitMode(false);
        setSplitTabIds([null, null]);
      }
      lastProcessedPropRef.current = null;
      return;
    }

    const propKey = `${mode}-${saleId || "new"}`;
    if (lastProcessedPropRef.current === propKey) {
      return;
    }
    lastProcessedPropRef.current = propKey;

    if (mode === "add") {
      // Check if there is already a blank tab being edited, otherwise create a new one
      const existingAddTab = tabs.find(t => t.mode === "add" && !t.saleId);
      if (existingAddTab) {
        setActiveTabId(existingAddTab.id);
        setTabs(prev => prev.map(t => t.id === existingAddTab.id ? { ...t, isMinimized: false } : t));
      } else {
        const newId = `new_${Date.now()}`;
        const nextNum = tabs.filter(t => t.mode === "add").length + 1;
        const newTab = {
          id: newId,
          title: `New Sale ${nextNum}`,
          shortTitle: `Sale ${nextNum}`,
          isMinimized: false,
          mode: "add",
          saleId: null,
          data: {},
          loading: false
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newId);
        if (splitMode && !splitTabIds[1]) {
          setSplitTabIds([splitTabIds[0], newId]);
        }
      }
    } else if ((mode === "view" || mode === "edit") && saleId) {
      const tabId = `sale_${saleId}`;
      const existingTab = tabs.find(t => t.id === tabId);
      if (existingTab) {
        setActiveTabId(tabId);
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isMinimized: false, mode: mode } : t));
      } else {
        const newTab = {
          id: tabId,
          title: `Loading ${saleId}...`,
          shortTitle: String(saleId).slice(-6),
          isMinimized: false,
          mode: mode,
          saleId: saleId,
          data: null,
          loading: true
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(tabId);
        if (splitMode && !splitTabIds[1]) {
          setSplitTabIds([splitTabIds[0], tabId]);
        }
        fetchInvoiceDetails(saleId, tabId);
      }
    }
  }, [isOpen, mode, saleId]);

  const addTab = () => {
    const newId = `new_${Date.now()}`;
    const nextNum = tabs.filter(t => t.mode === "add").length + 1;
    const newTab = {
      id: newId,
      title: `New Sale ${nextNum}`,
      shortTitle: `Sale ${nextNum}`,
      isMinimized: false,
      mode: "add",
      saleId: null,
      data: {},
      loading: false
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
      setTabs([]);
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

      // If we no longer have 2 tabs in split, exit split mode
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
      if (activeTabId === id) {
        const nextVisible = tabs.find(t => t.id !== id && !t.isMinimized);
        if (nextVisible) setActiveTabId(nextVisible.id);
      }

      if (splitMode && splitTabIds.includes(id)) {
        const nextSplitIds = splitTabIds.map(sid => sid === id ? null : sid);
        setSplitTabIds(nextSplitIds);

        if (nextSplitIds.filter(sid => sid !== null).length < 2) {
          setSplitMode(false);
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

  const handleTitleChange = useCallback((id, title, shortTitle) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, title, shortTitle } : t));
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!isOpen) return null;

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
        {mode === "add" && <button className={styles.addTabBtn} onClick={addTab}>+</button>}

        <div className={styles.windowActions}>
          <span className={styles.windowActionIcon} onClick={() => toggleMinimize(activeTabId)} title="Minimize"><IconMinimize /></span>
          <span className={styles.windowActionIcon} onClick={toggleSplit} title="Split View"><IconSplit /></span>
          <span className={styles.windowActionIcon} onClick={onClose} title="Close All"><IconX /></span>
        </div>
      </div>

      <div className={`${styles.managerHeader} ${(!isAnyVisible && minimizedTabs.length > 0) ? styles.hidden : ""}`}>
        Sale Invoice Details
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
              <SaleInvoiceForm 
                mode={tab.mode}
                saleId={tab.saleId}
                tabId={tab.id}
                initialData={tab.data}
                onSave={() => {
                  onRefresh();
                  closeTab(tab.id);
                }}
                onCancel={() => closeTab(tab.id)}
                onTitleChange={handleTitleChange}
              />
            </div>
          );
        })}
        {splitMode && splitTabIds.some(id => id === null) && (
          <div className={styles.formWrapper}>
            <div className={styles.placeholder}>Select Sale Invoice from Tabs</div>
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

export default SaleInvoiceManager;
