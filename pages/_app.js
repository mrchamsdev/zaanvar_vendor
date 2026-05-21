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
import Head from "next/head";
import Script from "next/script";
import { useEffect } from "react";
import { useRouter } from "next/router";
import useStore from "../components/state/useStore";
import { Toaster } from "sonner";

/* Routes that authenticated users should NOT access (redirect → /dashboard) */
const AUTH_REDIRECT_ROUTES = [
  "/",
  "/login",
  "/about",
  "/about-us",
  "/register",
  "/sign-up",
  "/book-demo",
  "/contact-us"
];

/* Routes that require a valid login (redirect → /login) */
const PROTECTED_PREFIXES = [
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
];

function AuthGuard({ children }) {
  const router = useRouter();
  const { jwtToken, _hasHydrated } = useStore();

  useEffect(() => {
    if (!_hasHydrated) return; // wait until Zustand rehydrates from localStorage

    const path = router.pathname;

    if (jwtToken) {
      // Logged-in user tries to access a public-only route → send to dashboard
      if (AUTH_REDIRECT_ROUTES.includes(path)) {
        router.replace("/dashboard");
      }
    } else {
      // Guest tries to access a protected route → send to login
      const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
      if (isProtected) {
        router.replace("/login");
      }
    }
  }, [_hasHydrated, jwtToken, router.pathname]);

  return children;
}

export default function App({ Component, pageProps }) {
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
    </>
  );
}