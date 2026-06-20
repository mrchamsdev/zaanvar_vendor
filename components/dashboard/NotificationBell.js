import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/dashboard/dashboard.module.css";
import { WebApimanager } from "../utilities/WebApiManager";
import useStore from "../state/useStore";
import { parseApiToLocal } from "../../utilities/date-time-utils";
import { useRouter } from "next/router";

// Inline Bell SVG
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const NotificationBell = ({ branchId }) => {
  const { userInfo, jwtToken } = useStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = userInfo?.id || userInfo?._id || userInfo?.userId || userInfo?.vendorId;
      if (!jwtToken || !userId || !branchId) return;
      try {
        setLoading(true);
        const webApi = new WebApimanager(jwtToken);
        const res = await webApi.get(`vendor/notifications?userId=${userId}&branchId=${branchId}`);
        const payload = res.data || res;
        // Assume payload.data is the array of notifications based on user example
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
  }, [jwtToken, userInfo, branchId]);

  const isNotifUnread = (notif) => {
    return notif.isRead === false || notif.isRead === "false" || notif.isRead === 0 || notif.isRead === "0" || !("isRead" in notif);
  };

  const unreadCount = notifications.filter(n => isNotifUnread(n)).length;

  return (
    <div className={styles.notificationWrapper}>
      <button 
        className={styles.bellBtn} 
        onClick={() => router.push("/notifications")}
        aria-label="Notifications"
      >
        <IconBell />
        {unreadCount > 0 && <span className={styles.bellBadge} />}
      </button>
    </div>
  );
};

export default NotificationBell;
