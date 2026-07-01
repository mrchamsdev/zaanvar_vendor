import React, { useState, useEffect } from "react";
import useDashboardData from "./useDashboardData";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useStore from "../state/useStore";
import styles from "../../styles/dashboard/dashboard.module.css";
import NotificationBell from "./NotificationBell";

const LOGO_URL =
  "https://zaanvarprods3.b-cdn.net/media/1773901732776-zaanvarbusinesslogo.svg";

/* ── Inline SVG icons ─────────────────────────────────────── */
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconScissors = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
  </svg>
);
const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconShop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const IconActivity = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconDog = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h8" />
    <path d="M16 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
  </svg>
);
const IconPackage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
const IconReviews = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconProducts = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

/* ── Service → Sidebar config (all flat routes) ─────────── */
const SERVICE_MAP = {
  Grooming: { label: "Grooming", path: "/grooming", icon: <IconScissors /> },
  Clinic: { label: "Clinic", path: "/clinic", icon: <IconActivity /> },
  "Pet Shop": { label: "Pet Shop", path: "/pet-shop", icon: <IconShop /> },
  Training: { label: "Training", path: "/training", icon: <IconActivity /> },
  "Day Care": { label: "Day care", path: "/daycare", icon: <IconHeart /> },
  "Pet Day Care": { label: "Day care", path: "/daycare", icon: <IconHeart /> },
  Daycare: { label: "Day care", path: "/daycare", icon: <IconHeart /> },
  "Pet Sales": {
    label: "Pet Sale",
    path: "/pet-sales",
    icon: <IconDog />,
    subItems: [
      { label: "Pet", path: "/pet-sales?tab=Pets" },
      { label: "Puppy", path: "/pet-sales?tab=Puppies" }
    ]
  },
  "Pet Training": { label: "Training", path: "/training", icon: <IconActivity /> },
  Inventory: {
    label: "Inventory",
    path: "/inventory",
    icon: <IconPackage />,
    subItems: [
      { label: "Products", path: "/inventory/products" },
      { label: "Stock Updates", path: "/inventory/stock-updates" },
      { label: "Stock Status", path: "/inventory/stock-status" }
    ]
  },
  "Purchase Bills": {
    label: "Purchase Bills",
    path: "/purchase-bill",
    icon: <IconPackage />,
    subItems: [
      { label: "Purchase Orders", path: "/purchase-bill/purchase-orders" },
      { label: "Payment Out", path: "/purchase-bill/purchase-out" },
      { label: "Purchase Return", path: "/purchase-bill/purchase-return" }
    ]
  },
  Supplier: { label: "Supplier", path: "/suppliers", icon: <IconGrid /> },
  Sale: {
    label: "Sale",
    path: "/sale",
    icon: <IconShop />,
    subItems: [
      { label: "Sales Invoice", path: "/sale/sales-invoice" },
      { label: "Payment In", path: "/sale/payment-in" },
      { label: "Sales Return", path: "/sale/sales-return" }
    ]
  }
};

const BRANCH_SERVICE_MAP = {
  clinicDetails: "Clinic",
  groomingServices: "Grooming",
  daycares: "Day Care",
  petShops: "Pet Shop",
  petSales: "Pet Sales",
  inventory: "Inventory",
  purchaseBills: "Purchase Bills",
  sale: "Sale",
};

function buildMenuFromVendor(userInfo) {
  const base = [
    { label: "Dashboard", path: "/dashboard", icon: <IconGrid /> },
    { label: "Timing Slots", path: "/timing-slots", icon: <IconClock /> },
    { label: "Reviews", path: "/reviews", icon: <IconStar /> },
    { label: "Profile", path: "/profile", icon: <IconUser /> },
    {
      label: "Inventory",
      path: "/inventory",
      icon: <IconPackage />,
      subItems: SERVICE_MAP["Inventory"].subItems
    },
    {
      label: "Purchase Bills",
      path: "/purchase-bill",
      icon: <IconPackage />,
      subItems: SERVICE_MAP["Purchase Bills"].subItems
    },
    {
      label: "Sale",
      path: "/sale",
      icon: <IconShop />,
      subItems: SERVICE_MAP["Sale"].subItems
    },
    { label: "Customers", path: "/customers", icon: <IconUser /> },
    { label: "Supplier", path: "/suppliers", icon: <IconGrid /> },
    {
      label: "Settings",
      path: "/vendor-settings",
      icon: <IconSettings />,
      subItems: [
        { label: "General Settings", path: "/vendor-settings?tab=General" },
        { label: "Transactions", path: "/vendor-settings?tab=Transactions" },
        { label: "Taxes & GST", path: "/vendor-settings?tab=TaxesGST" },
        { label: "Transaction Message", path: "/vendor-settings?tab=TransactionMessage" },
        { label: "Supplier & Customer", path: "/vendor-settings?tab=SupplierCustomer" },
        { label: "Item Settings", path: "/vendor-settings?tab=ItemSettings" },
        { label: "Profile Settings", path: "/vendor-settings?tab=ProfileSettings" },
      ],
    },
  ];

  const serviceSet = new Set();

  (userInfo?.vendorCompanies || []).forEach((co) => {
    (co.servicesProvided || []).forEach((s) => serviceSet.add(s));
    (co.branches || []).forEach((br) => {
      Object.entries(BRANCH_SERVICE_MAP).forEach(([key, svc]) => {
        const val = br[key];
        if (val && (Array.isArray(val) ? val.length > 0 : true)) {
          serviceSet.add(svc);
        }
      });
    });
  });

  const seen = new Set();
  base.forEach(b => seen.add(b.path));

  const svcItems = [];
  serviceSet.forEach((s) => {
    const cfg = SERVICE_MAP[s];
    if (cfg && !seen.has(cfg.path)) {
      seen.add(cfg.path);
      svcItems.push({ label: cfg.label, path: cfg.path, icon: cfg.icon, subItems: cfg.subItems });
    }
  });

  return [...base, ...svcItems, { label: "Notifications", path: "/notifications", icon: <IconBell /> }];
}

/* ─── Loading skeleton ──────────────────────────────────── */
function Skeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        background: "#f5f6fa",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #f5790c",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: "#888", fontSize: 14 }}>Loading…</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * DashboardLayout
 * ═══════════════════════════════════════════════════════════ */
const DashboardLayout = ({
  children,
  topbarButtons = [],
  onTopbarAction,
  customTopbarLeft,
  customTopbarRight
}) => {
  const router = useRouter();
  const { userInfo, jwtToken, _hasHydrated, clearStore } = useStore();
  const { branches, selectedBranchId, setSelectedBranchId } = useDashboardData({ skipReviews: true });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { expandedMenus, setExpandedMenus } = useStore();

  /* ── auto-expand active menu ── */
  useEffect(() => {
    const parts = router.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const parentPath = "/" + parts[0];
      setExpandedMenus(prev => ({ ...prev, [parentPath]: true }));
    }
  }, [router.pathname]);

  /* ── auth guard ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!jwtToken || !userInfo) {
      router.replace("/login");
    }
  }, [_hasHydrated, jwtToken, userInfo]);

  /* ── close mobile sidebar on navigation ── */
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  /* ── show spinner while Zustand is rehydrating ── */
  if (!_hasHydrated) return <Skeleton />;
  if (!jwtToken || !userInfo) return <Skeleton />;

  const menuItems = buildMenuFromVendor(userInfo);

  /* ── avatar ── */
  const firstName = userInfo?.firstName || "";
  const lastName = userInfo?.lastName || "";
  const avatarInitial =
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "V";
  const avatarImg = userInfo?.profileImage || null;

  /* ── logout ── */
  const handleLogout = () => {
    clearStore();
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    router.replace("/login");
  };

  return (
    <div className={styles.dashWrap}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""
          } ${sidebarCollapsed ? styles.sidebarCollapsed : ""
          }`}
      >
        {/* Logo + collapse toggle */}
        <div className={styles.sidebarLogo}>
          {!sidebarCollapsed && (
            <span className={styles.sidebarLogoText}>Zaanvar</span>
          )}
          <button
            className={styles.sidebarToggleBtn}
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        </div>

        {/* Nav items */}
        <ul className={styles.sidebarNav}>
          {menuItems.map((item) => {
            const isActive = router.pathname === item.path || router.pathname.startsWith(item.path + '/');
            const hasSub = !!item.subItems;
            const isExpanded = expandedMenus[item.path];

            return (
              <li key={item.path} className={isActive ? styles.active : ""}>
                {!hasSub ? (
                  <Link href={item.path} data-label={item.label} title={sidebarCollapsed ? item.label : undefined}>
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span className={styles.navLabel}>{item.label}</span>
                    )}
                  </Link>
                ) : (
                  <>
                    <div
                      onClick={() => {
                        setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
                      }}
                      className={styles.navGroupHeader}
                      title={sidebarCollapsed ? item.label : undefined}
                      data-label={item.label}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      {!sidebarCollapsed && (
                        <>
                          <span className={styles.navLabel}>{item.label}</span>
                          <span style={{ fontSize: "10px", marginLeft: "10px", opacity: 0.6 }}>{isExpanded ? "▲" : "▼"}</span>
                        </>
                      )}
                    </div>

                    {isExpanded && !sidebarCollapsed && (
                      <div style={{ display: "flex", flexDirection: "column", marginTop: "8px", marginLeft: "10px", gap: "6px" }}>
                        {item.subItems.map((sub, i) => {
                          // Match full path including query params (for settings tabs) or just pathname
                          const subPathname = sub.path.split('?')[0];
                          const subQuery = sub.path.includes('?') ? sub.path.split('?')[1] : '';
                          const routerPathname = router.asPath.split('?')[0];
                          const routerQuery = router.asPath.includes('?') ? router.asPath.split('?')[1] : '';
                          const isSubActive =
                            (routerPathname === subPathname && (!subQuery || routerQuery === subQuery)) ||
                            (router.asPath === "/pet-sales" && i === 0);
                          return (
                            <Link
                              key={sub.path}
                              href={sub.path}
                              style={{
                                display: "block",
                                padding: "8px 12px 8px 36px",
                                borderRadius: "8px",
                                color: isSubActive ? "#e9315d" : "#555",
                                background: isSubActive ? "#fdf0f3" : "transparent",
                                fontWeight: isSubActive ? 600 : 400,
                                textDecoration: "none",
                                fontSize: "13px",
                                transition: "background 0.2s"
                              }}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>

        {/* Logout button */}
        <div className={styles.sidebarFooter}>
          <button
            className={styles.sidebarLogoutBtn}
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <IconLogout />
            {!sidebarCollapsed && (
              <span className={styles.sidebarLogoutLabel}>Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className={styles.mainArea}>
        {/* Mobile topbar */}
        <div className={styles.mobTopbar}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <Image
            src={LOGO_URL}
            alt="Zaanvar"
            width={120}
            height={40}
            priority
            style={{ objectFit: "contain" }}
          />
          <div style={{ width: 32 }} />
        </div>

        {/* Desktop topbar */}
        <header className={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            {customTopbarLeft}

            {!customTopbarLeft && branches && branches.length > 0 && (
              <div className={styles.branchSwitcherContainer}>
                <select
                  className={styles.branchSwitcher}
                  value={selectedBranchId || ""}
                  onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : "")}
                >
                  {branches.length > 1 && <option value="">Select Branch</option>}
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.topbarActions}>
            {customTopbarRight}

            {/* Common Buttons if no custom content */}
            {!customTopbarRight && topbarButtons.map((btn, i) => (
              <button
                key={i}
                className={`${styles.topBtn} ${btn.color === "purple"
                    ? styles.topBtnPurple
                    : btn.color === "red"
                      ? styles.topBtnRed
                      : styles.topBtnGray
                  }`}
                onClick={() => onTopbarAction && onTopbarAction(btn.action)}
              >
                {btn.label}
              </button>
            ))}

            <NotificationBell branchId={selectedBranchId} />

            {/* Avatar */}
            <div
              className={styles.topAvatar}
              title={`${firstName} ${lastName}`.trim()}
            >
              {avatarImg ? (
                <img src={avatarImg} alt="avatar" />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#f5790c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push("/profile")}
                >
                  {avatarInitial}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
