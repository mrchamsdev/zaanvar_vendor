import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/notifications/notifications.module.css";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import { parseApiToLocal } from "../../utilities/date-time-utils";
import { useRouter } from "next/router";

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const IconBellCategory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default function NotificationsPage() {
  const { userInfo, jwtToken } = useStore();
  const { branchId: selectedBranchId } = useDashboardData();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Alerts");
  const [dateFilter, setDateFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = React.useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = userInfo?.id || userInfo?._id || userInfo?.userId || userInfo?.vendorId;
      if (!jwtToken || !userId || !selectedBranchId) return;
      try {
        setLoading(true);
        const webApi = new WebApimanager(jwtToken);
        const res = await webApi.get(`vendor/notifications?userId=${userId}&branchId=${selectedBranchId}`);
        const payload = res.data || res;
        
        if (payload && payload.status === "success") {
          if (Array.isArray(payload.data)) {
            setNotifications(payload.data);
          } else if (payload.data && typeof payload.data === "object") {
            setNotifications([payload.data]);
          }
        } else if (Array.isArray(payload)) {
           setNotifications(payload);
        } else if (payload && typeof payload === "object") {
           setNotifications([payload]);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [jwtToken, userInfo, selectedBranchId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isNotifUnread = (notif) => {
    return !notif.isRead || notif.isRead === "false" || notif.isRead === "0";
  };

  const handleNotificationClick = (notif) => {
    if (isNotifUnread(notif)) {
      try {
        const webApi = new WebApimanager(jwtToken);
        setNotifications(prev => 
          prev.map(n => n.notificationId === notif.notificationId ? { ...n, isRead: true } : n)
        );
        webApi.put(`vendor/notifications/${notif.notificationId}/read`).catch(err => console.error("Failed to mark as read", err));
      } catch (err) {
        console.error("Failed to initiate mark as read", err);
      }
    }

    const subj = (notif.subject || "").toLowerCase();
    let tab = "";
    if (subj.includes("out of stock") || subj.includes("out stock")) {
        tab = "outOfStock";
    } else if (subj.includes("low stock") || subj.includes("low quantity")) {
        tab = "lowStock";
    } else if (subj.includes("short expiry") || subj.includes("short expire")) {
        tab = "shortExpiry";
    } else if (subj.includes("expire") || subj.includes("expired")) {
        tab = "expired";
    } else if (subj.includes("damage")) {
        tab = "damaged";
    } else if (subj.includes("payment") || subj.includes("due")) {
        // Assume payments route to purchase-out or somewhere relevant based on subject
        router.push(`/purchase-bill/purchase-out`);
        return;
    }

    if (tab) {
        router.push(`/inventory/stock-status?tab=${tab}`);
    }
  };

  const isAlert = (notif) => {
    const subj = (notif.subject || "").toLowerCase();
    return !subj.includes("payment");
  };

  const isPayment = (notif) => {
    const subj = (notif.subject || "").toLowerCase();
    return subj.includes("payment") || subj.includes("due");
  };

  const alertsCount = notifications.filter(isAlert).length;
  const paymentsCount = notifications.filter(isPayment).length;
  const allCount = notifications.length;

  const hasUnreadAlerts = notifications.filter(isAlert).some(isNotifUnread);
  const hasUnreadPayments = notifications.filter(isPayment).some(isNotifUnread);
  const hasUnreadAll = notifications.some(isNotifUnread);

  const isWithinDateFilter = (isoString) => {
    if (dateFilter === "All") return true;
    const d = new Date(isoString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateFilter === "Today") {
      return d >= today;
    } else if (dateFilter === "Yesterday") {
      return d >= yesterday && d < today;
    } else if (dateFilter === "Last Week") {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return d >= lastWeek && d < today;
    } else if (dateFilter === "This Month") {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    } else if (dateFilter === "Last Month") {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }
    return true;
  };

  const getFilteredNotifications = () => {
    let list = notifications;
    if (activeTab === "Alerts") list = list.filter(isAlert);
    if (activeTab === "Payments") list = list.filter(isPayment);
    return list.filter(n => isWithinDateFilter(n.createdAt));
  };

  const filteredNotifs = getFilteredNotifications();

  const formatTime = (isoString) => {
    const d = parseApiToLocal(isoString);
    if (!d) return { time: "", date: "" };
    const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(d);
    
    // Check if it's today
    const today = new Date();
    if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
      return { time, date: "Today" };
    }
    
    const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
    return { time, date: dateStr };
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Stay updated with important alerts and reminders.</p>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <div 
              className={`${styles.tab} ${activeTab === "All" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("All")}
            >
              All ({allCount})
              {hasUnreadAll && <span className={styles.unreadDot} />}
            </div>
            <div 
              className={`${styles.tab} ${activeTab === "Alerts" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("Alerts")}
            >
              Alerts ({alertsCount})
              {hasUnreadAlerts && <span className={styles.unreadDot} />}
            </div>
            <div 
              className={`${styles.tab} ${activeTab === "Payments" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("Payments")}
            >
              Payments ({paymentsCount})
              {hasUnreadPayments && <span className={styles.unreadDot} />}
            </div>
          </div>
          <div className={styles.filterWrapper} ref={filterRef}>
            <button className={styles.filterBtn} onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <IconFilter /> {dateFilter === "All" ? "Filter" : dateFilter} <IconChevronDown />
            </button>
            {isFilterOpen && (
              <div className={styles.filterDropdown}>
                {["All", "Today", "Yesterday", "Last Week", "This Month", "Last Month"].map(opt => (
                  <div 
                    key={opt}
                    className={styles.filterOption}
                    onClick={() => {
                      setDateFilter(opt);
                      setIsFilterOpen(false);
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.tableHeader}>
          <div className={styles.colAlert}>ALERT</div>
          <div className={styles.colCategory}>CATEGORY</div>
          <div className={styles.colTime}>TIME</div>
        </div>

        <div className={styles.notifList}>
          {loading ? (
            <div className={styles.emptyState}>Loading notifications...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className={styles.emptyState}>No notifications are there</div>
          ) : (
            filteredNotifs.map(notif => {
              const unread = isNotifUnread(notif);
              const { time, date } = formatTime(notif.createdAt);
              
              return (
                <div 
                  key={notif.notificationId} 
                  className={`${styles.notifCard} ${!unread ? styles.notifCardRead : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={styles.iconWrapper}>
                    <IconAlert />
                    {unread && <div className={styles.unreadIconDot} />}
                  </div>
                  
                  <div className={styles.notifContent}>
                    <div className={styles.notifTitle}>{notif.subject || notif.department}</div>
                    <div className={styles.notifDesc}>
                      {notif.message || "Stay updated with important alerts and reminders."}
                    </div>
                  </div>
                  
                  <div className={styles.categoryTag}>
                    <div className={styles.categoryBadge}>
                      {activeTab === "Payments" || isPayment(notif) ? "Finance" : "Inventory"}
                    </div>
                  </div>
                  
                  <div className={styles.timeInfo}>
                    <span className={styles.timeMain}>{time}</span>
                    <span>{date}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
