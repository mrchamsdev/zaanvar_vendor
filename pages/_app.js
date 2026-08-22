// import "@/styles/globals.css";
// import Head from "next/head";

// export default function App({ Component, pageProps }) {
//   <Head>
//     <link rel="icon" href="/images/favicon.ico" type="image/x-icon" />
//     <meta name="robots" content={"noindex,nofollow"}/>
//     <meta name="language" content="en" />

//   </Head>
//   return <Component {...pageProps} />;
// }
import "@/styles/globals.css";
import "../styles/invoice/invoice.css";
import Head from "next/head";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Axios from "axios";
import useStore from "../components/state/useStore";
import { Toaster } from "sonner";
import { userTimeZone } from "../utilities/date-time-utils";
import Chatbot from "../components/shared/Chatbot";
import FalseClaimModal from "../components/shared/FalseClaimModal";

/* Routes that authenticated users should NOT access (redirect → /dashboard) */
const AUTH_REDIRECT_ROUTES = [
  "/",
  "/login",
  "/about",
  "/about-us",
  "/sign-up",
  "/book-demo",
  "/contact-us"
];

/* Routes that require a valid login (redirect → /login) */
const PROTECTED_PREFIXES = [
  "/home",
  "/dashboard",
  "/profile",
  "/timing-slots",
  "/reviews",
  "/clinic",
  "/pet-shop",
  "/daycare",
  "/training",
  "/grooming",
  "/pet-sales",
  "/onboarding",
  "/claim-business",
];

function AuthGuard({ children }) {
  const router = useRouter();
  const { jwtToken, userInfo, _hasHydrated } = useStore();

  useEffect(() => {
    if (!_hasHydrated) return; // wait until Zustand rehydrates from localStorage

    const path = router.pathname;

    if (jwtToken) {
      // If user has no business, redirect from dashboard/services to /onboarding
      const savedBackendBranchId = typeof window !== "undefined" ? localStorage.getItem("zaanvar_claim_backend_branch_id") : null;
      const hasNoBusiness = (!userInfo?.vendorCompanies || userInfo.vendorCompanies.length === 0) && !savedBackendBranchId;
      const hasActiveSubscription =
        userInfo?.isSubscribed ||
        userInfo?.subscriptionActive ||
        userInfo?.subscriptionPlan ||
        (userInfo?.vendorCompanies && userInfo.vendorCompanies[0]?.isSubscribed) ||
        (userInfo?.vendorCompanies && userInfo.vendorCompanies[0]?.subscriptionPlan) ||
        false;

      const isDashboardOrService = [
        "/home",
        "/dashboard",
        "/timing-slots",
        "/reviews",
        "/clinic",
        "/pet-shop",
        "/daycare",
        "/training",
        "/grooming",
        "/pet-sales"
      ].some((prefix) => path.startsWith(prefix));

      // Users with no business at all → onboarding
      if (hasNoBusiness && isDashboardOrService) {
        router.replace("/onboarding");
        return;
      }

      // Premium paths (inventory, sales, etc.) require active subscription, but /home is accessible for vendors with a business

      // Check if trying to access premium dashboard/management services without subscription
      const isPremiumPath = [
        "/dashboard",
        "/timing-slots",
        "/clinic",
        "/pet-shop",
        "/daycare",
        "/training",
        "/grooming",
        "/pet-sales",
        "/inventory",
        "/purchase-bill",
        "/sale",
        "/customers",
        "/staff-management",
        "/suppliers",
        "/settings",
        "/vendor-settings"
      ].some((prefix) => path.startsWith(prefix));

      if (!hasNoBusiness && !hasActiveSubscription && isPremiumPath) {
        router.replace("/claim-business");
        return;
      }

      // Logged-in user tries to access a public-only route → send to appropriate page
      if (AUTH_REDIRECT_ROUTES.includes(path)) {
        if (hasNoBusiness) {
          router.replace("/onboarding");
        } else {
          router.replace("/home");
        }
      }
    } else {
      // Guest tries to access a protected route → send to login
      const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
      if (isProtected) {
        router.replace("/login");
      }
    }
  }, [_hasHydrated, jwtToken, userInfo, router.pathname]);

  return children;
}

export default function App({ Component, pageProps }) {
  const [showMobileRedirectModal, setShowMobileRedirectModal] = useState(false);
  const router = useRouter();

  const getDeviceInfo = () => {
    if (typeof window === "undefined") return { os: "Unknown", screen: "N/A" };
    const ua = navigator.userAgent;
    let os = "Unknown Device";
    if (/iphone|ipad|ipod/i.test(ua)) os = "iOS Device";
    else if (/android/i.test(ua)) os = "Android Device";
    else if (/windows/i.test(ua)) os = "Windows PC";
    else if (/mac/i.test(ua)) os = "Mac / macOS";
    else if (/linux/i.test(ua)) os = "Linux PC";

    return {
      os,
      screen: `${window.innerWidth} × ${window.innerHeight}px`
    };
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const uaLower = userAgent.toLowerCase();

      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(uaLower);
      const isIPadDesktop = /macintosh/i.test(uaLower) && navigator.maxTouchPoints > 1;

      const isMobileOrTabletUA = isMobileUA || isIPadDesktop;

      let isMobileDevice = false;

      if (isMobileOrTabletUA) {
        // Mobile or tablet device: show redirect popup if screen width < 1024 OR height < 768
        if (window.innerWidth < 1024 || window.innerHeight < 768) {
          isMobileDevice = true;
        }
      } else {
        // Desktop PC (Windows/Mac/Linux): only show if width is shrunk below 600px (emulation)
        if (window.innerWidth < 600) {
          isMobileDevice = true;
        }
      }

      // Only show if mobile device and not on the home landing page "/" or invoice pages
      const isInvoicePage = router.pathname.startsWith('/invoice');
      if (isMobileDevice && router.pathname !== '/' && !isInvoicePage) {
        setShowMobileRedirectModal(true);
      } else {
        setShowMobileRedirectModal(false);
      }
    }
  }, [router.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tz = userTimeZone();
    if (!tz) return;

    Axios.defaults.headers.common["X-Client-Timezone"] = tz;

    if (window.__zaanvarVendorFetchTzPatched__) return;
    const originalFetch = window.fetch;
    window.fetch = function patchedFetch(input, init = {}) {
      try {
        const nextInit = { ...(init || {}) };
        const existing = nextInit.headers;
        if (existing instanceof Headers) {
          const merged = new Headers(existing);
          if (!merged.has("X-Client-Timezone")) merged.set("X-Client-Timezone", tz);
          nextInit.headers = merged;
        } else if (Array.isArray(existing)) {
          const hasTz = existing.some(
            (pair) => Array.isArray(pair) && pair[0]?.toLowerCase?.() === "x-client-timezone",
          );
          nextInit.headers = hasTz ? existing : [...existing, ["X-Client-Timezone", tz]];
        } else {
          const obj = { ...(existing || {}) };
          const hasTz = Object.keys(obj).some((k) => k.toLowerCase() === "x-client-timezone");
          if (!hasTz) obj["X-Client-Timezone"] = tz;
          nextInit.headers = obj;
        }
        return originalFetch.call(this, input, nextInit);
      } catch {
        return originalFetch.call(this, input, init);
      }
    };
    window.__zaanvarVendorFetchTzPatched__ = true;
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="robots" content="noindex,nofollow" />
        <meta name="language" content="en" />
        <title>Zaanvar | Pet Business Portal</title>
      </Head>

      <Script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBgYCTEby06dsd0hwEgMlijh4kBfbYeYTo&libraries=places"
        strategy="beforeInteractive"
      />

      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>

      <Toaster richColors position="top-right" closeButton />
      <FalseClaimModal />
      {/* <Chatbot /> */}

      {showMobileRedirectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#fff', padding: '40px', borderRadius: '12px',
            maxWidth: '500px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', margin: '0 20px',
            position: 'relative', fontFamily: 'sans-serif'
          }}>
            <button
              onClick={() => setShowMobileRedirectModal(false)}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: 'none', border: 'none',
                color: '#333', cursor: 'pointer', fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
            <h2 style={{ marginBottom: '16px', color: '#333', fontWeight: 'bold' }}>Desktop Web Browser Required</h2>

            <div style={{
              background: '#f3f4f6',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#4b5563',
              textAlign: 'left'
            }}>
              <strong>Device Detected:</strong> {getDeviceInfo().os}<br />
              <strong>Screen Resolution:</strong> {getDeviceInfo().screen}
            </div>

            <p style={{ marginBottom: '24px', color: '#555', lineHeight: '1.6', fontSize: '15px' }}>
              We detected that you are opening Zaanvar Vendor on a mobile device. For the best layout and full functional experience, please open it in a <strong>desktop web browser</strong>. Alternatively, you can download our mobile app for on-the-go access.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://apps.apple.com/in/app/zaanvar-business/id6754638999"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '12px 24px', background: '#000', color: '#fff',
                  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold',
                  fontSize: '14px', transition: 'background 0.2s', display: 'inline-block'
                }}
              >
                Download iOS App
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.zaanvar.vender"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '12px 24px', background: '#3ddc84', color: '#000',
                  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold',
                  fontSize: '14px', transition: 'background 0.2s', display: 'inline-block'
                }}
              >
                Download Android App
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}