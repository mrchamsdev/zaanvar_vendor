/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import styles from "../../styles/footer/footerCom.module.css";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";
import useStore from "../state/useStore";
import { toast } from "sonner";
import { WebApimanager } from "../utilities/WebApiManager";
import MobileFooter from "./MobileFooter";
import zaanvarlogo from "../../public/images/ZAANVAR_FINAL.svg";
import GirlDog from "../../public/images/Homepage/image 292.png";
import Cat from "../../public/images/Homepage/freepik__talk__11364 1.png";

/* ── Inline SVG social icons (no CDN dependency) ───────────── */
const WhatsAppIcon  = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12a11.93 11.93 0 0 0 1.65 6.07L0 24l6.1-1.6A12 12 0 0 0 12 24c6.63 0 12-5.37 12-12a11.93 11.93 0 0 0-3.48-8.52ZM12 22a9.93 9.93 0 0 1-5.08-1.4l-.36-.22-3.73.98.99-3.63-.24-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Zm5.47-7.4c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.65.07a8.17 8.17 0 0 1-2.4-1.48 9.07 9.07 0 0 1-1.66-2.07c-.17-.3 0-.46.13-.6s.3-.35.44-.52.2-.3.3-.5.05-.37-.02-.52-.67-1.6-.91-2.2c-.24-.57-.49-.5-.67-.51H7.2c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34Z" fill="#25D366"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2"/>
    <path d="M7 9h2.5v8H7V9zm1.25-1a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zM11 9h2.4v1.1h.03C13.77 9.5 14.7 9 16 9c2.5 0 3 1.65 3 3.8V17h-2.5v-3.7c0-.88-.02-2-1.22-2-1.23 0-1.42.96-1.42 1.95V17H11V9z" fill="#fff"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#000"/>
    <path d="M17.5 4h2.4L14.8 9.6 21 20h-4.9l-3.7-4.9L8 20H5.6l5.5-6.3L4 4h5l3.4 4.4L17.5 4Zm-.8 14.4h1.3L7.4 5.4H6l10.7 13Z" fill="#fff"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f09433"/>
        <stop offset="25%" stopColor="#e6683c"/>
        <stop offset="50%" stopColor="#dc2743"/>
        <stop offset="75%" stopColor="#cc2366"/>
        <stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
    <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8"/>
    <circle cx="17.5" cy="6.5" r="1" fill="#fff"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#1877F2"/>
    <path d="M13 21v-7.5h2.5l.5-3H13V8.5c0-.83.4-1.5 1.5-1.5H16V4.1A18.1 18.1 0 0 0 13.6 4C11.1 4 9.5 5.5 9.5 8.2v2.3H7v3H9.5V21H13z" fill="#fff"/>
  </svg>
);

/* ── Footer link sections (mirrors ServicesWeOffer.js) ─────── */
const allServices = [
  {
    title: "Company",
    items: ["About Us", "Contact Us"],
    Links: ["/about", "/register"],
  },
  {
    title: "Our Services",
    items: [
      "Mating",
      "Clinic",   "Grooming",
      "Day Care",  ,
    ],
    Links: [
  
      "/coming-soon/mating",     "/coming-soon/clinic",
      "/coming-soon/grooming",
      "/coming-soon/day-care", 
    ],
  },
  {
    title: "Features",
    items: ["Location", "Events" , "Breeders"],
    Links: [  "/coming-soon/location", "/coming-soon/events" ,    "/coming-soon/breeders",],
  },
  {
    title: "Social",
    items: ["Blood Bank", "Training",],
    Links: ["/coming-soon/blood-bank" , "/coming-soon/training"],
  },
];

/* ── Social link config ──────────────────────────────────────── */
const SOCIAL_LINKS = [
  { href: "https://whatsapp.com/channel/0029Vavid5j0lwglQMeyO51u", label: "WhatsApp",  Icon: WhatsAppIcon,  track: "WhatsApp" },
  { href: "https://www.linkedin.com/company/zaanvar/",             label: "LinkedIn",  Icon: LinkedInIcon,  track: "Linkedin" },
  { href: "https://x.com/Zaanvar142085",                           label: "Twitter",   Icon: TwitterIcon,   track: "Twitter" },
  { href: "#",                                                      label: "Instagram", Icon: InstagramIcon, track: "Instagram", isInstagram: true },
  { href: "https://www.facebook.com/profile.php?id=61567070092046",label: "Facebook",  Icon: FacebookIcon,  track: "Facebook" },
];

/* ═══════════════════════════════════════════════════════════════ */
const Footer = ({ customStyle = {} }) => {
  const router   = useRouter();
  const { getJwtToken } = useStore();
  const jwt      = getJwtToken();

  const [isMobile,      setIsMobile]      = useState(false);
  const [email,         setEmail]         = useState("");
  const [error,         setError]         = useState("");
  const [isSubscribed,  setIsSubscribed]  = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [footerContent, setFooterContent] = useState([]);
  const [activeFooterTab, setActiveFooterTab] = useState("Home");
  const [loadedImages,  setLoadedImages]  = useState({});

  const webApi   = new WebApimanager();

  const markLoaded = React.useCallback((key) => {
    setLoadedImages((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  /* ── Responsive check ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);



  /* ── Social click tracker ── */
  const handleSocialClick = (platform) => {
    if (typeof window !== "undefined" && window.gtag)
      window.gtag("event", "click", { event_category: "Social Media", event_label: platform });
  };

  const handleInstagramClick = (e) => {
    e.preventDefault();
    handleSocialClick("Instagram");
    const webUrl = "https://www.instagram.com/zaanvar_tailtalks/";
    const mob = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (mob) {
      let appOpened = false;
      const onBlur = () => { appOpened = true; window.removeEventListener("blur", onBlur); };
      window.addEventListener("blur", onBlur);
      window.location.href = `instagram://user?username=zaanvar_tailtalks`;
      setTimeout(() => { window.removeEventListener("blur", onBlur); if (!appOpened) window.location.href = webUrl; }, 1500);
    } else {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  /* ── Nav helpers ── */
  const handleLogo  = () => router.push("/");
  const handleClick = (index, sIdx) => {
    const link = allServices[sIdx]?.Links?.[index];
    if (link) router.push(link);
  };

  /* ── Subscribe ── */
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const handleSubmit  = async (e) => {
    e.preventDefault();
    if (isSubscribed || isSubmitting) return;
    if (!email) { setError("Email is required!"); return; }
    if (!validateEmail(email)) { setError("Please enter a valid email address!"); return; }
    setError("");
    setIsSubmitting(true);
    try {
      const res = await webApi.postwithouttoken("subscribe", { email });
      if (res.success) { toast.success("Subscribed Successfully!"); setEmail(""); setIsSubscribed(true); }
      else { toast.error(res.message || "Subscription failed"); setIsSubmitting(false); }
    } catch { toast.error("Email is already subscribed"); setIsSubmitting(false); }
  };

  /* ── Social icons row ── */
  const renderSocials = () =>
    SOCIAL_LINKS.map(({ href, label, Icon, track, isInstagram }) => (
      <a
        key={label}
        href={href}
        aria-label={label}
        target={href === "#" ? undefined : "_blank"}
        rel="noopener noreferrer"
        onClick={isInstagram ? handleInstagramClick : () => handleSocialClick(track)}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        <Icon />
      </a>
    ));

  /* ─────────────────────────────────────────────────────────── */
  const hiddenPaths = ["/social-media", "/settings"];
  if (hiddenPaths.some((p) => router.pathname.includes(p))) return null;

  /* ── Logged-in + mobile → bottom nav ── */
  if (jwt && isMobile) {
    return (
      <MobileFooter
        footerContent={footerContent}
        activeFooterTab={activeFooterTab}
        setActiveFooterTab={setActiveFooterTab}
        handleFooterTabChange={(item) => {
          if (!item.to) return;
          setActiveFooterTab(item.text);
          router.push(item.to);
        }}
      />
    );
  }

  /* ── Logged-in + desktop → slim footer (no bottom bar) ── */
  if (jwt) {
    return (
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.logoWrapper}>
            <Image src={zaanvarlogo} alt="Zaanvar" width={80} height={30} priority
              className={styles.footerLogo} style={{ cursor: "pointer" }} onClick={handleLogo} />
          </div>
          <div className={styles.centerContent}>
            <p className={styles.footerCopyright}>
              <Link href="/privacy-policy" className={styles.footerlink} prefetch={false}>Privacy Policy</Link>
              {" "}| © 2024 zaanvar.com | All Rights Reserved | mrchams Pvt Ltd @2024
            </p>
          </div>
          <div className={styles.socialLinks}>{renderSocials()}</div>
        </div>
      </footer>
    );
  }

  /* ── Guest → full footer (no bottom bar) ── */
  return (
    <footer className={styles.footerWrapper}>
      {/* ── Subscribe card (home page only) ── */}
      {router.pathname === "/" && (
        <div className={styles.subscribeWrapper}>
          <div className={styles.orangeCard}>
            <div className={styles.girlWrapper}>
              {!loadedImages["girlDog"] && (
                <div className={styles.imageShimmer} aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 8, zIndex: 1 }} />
              )}
              <Image src={GirlDog} alt="Happy girl playing with a dog" className={styles.girlImage}
                sizes="(max-width: 768px) 240px, 200px" loading="lazy" placeholder="blur"
                onLoad={() => markLoaded("girlDog")} />
            </div>
            <div className={styles.catWrapper}>
              {!loadedImages["catIcon"] && (
                <div className={styles.imageShimmer} aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 8, zIndex: 1 }} />
              )}
              <Image src={Cat} alt="Cute cartoon cat" className={styles.catImage}
                loading="lazy" sizes="(max-width: 768px) 100px, 130px" placeholder="blur"
                onLoad={() => markLoaded("catIcon")} />
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>
                <span className={styles.cardLabelIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 115 102" fill="none">
                    <path d="M75.1256 69.8858C76.235 68.9429 61.1353 41.9723 38.3318 30.6897C22.9087 23.0852 5.896 35.2018 17.336 47.5798C22.5804 53.3258 34.8358 55.8888 43.4671 57.2418C61.2677 59.9232 73.7843 71.0438 75.1256 69.8858Z" fill="#1FBFC2" />
                    <path d="M72.3788 81.2383C72.5531 80.1708 52.0242 71.4798 33.9393 75.1873C21.8054 77.7307 17.4619 92.1124 29.4695 94.1291C35.0306 95.009 43.234 91.065 48.6728 88.0468C60.0553 81.6712 72.0637 82.4796 72.3788 81.2383Z" fill="white" />
                    <path d="M85.5277 66.9195C84.4434 67.1921 75.0929 46.8371 78.1882 28.7388C80.2546 16.5988 94.533 11.7638 96.9523 23.6245C98.0422 29.17 94.3307 37.4444 91.4812 43.0212C85.6329 54.5718 86.7031 66.6056 85.5277 66.9195Z" fill="white" />
                  </svg>
                </span>
                SUBSCRIBE
              </p>
              <h2 className={styles.cardHeading}>Stay Updated With Pet Industry</h2>
              <form className={styles.form} onSubmit={handleSubmit}>
                <input type="email" placeholder="Enter Your Email" className={styles.emailInput}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribed || isSubmitting} />
                <button type="submit" className={styles.subscribeBtn} disabled={isSubscribed || isSubmitting}>
                  SUBSCRIBE
                </button>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Main footer body ── */}
      <div className={styles.footerContainer}>
        {/* Left – logo + social icons */}
        <div className={styles.leftContainer}>
          <Image
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/78f832d72f9f367efc0ff0882e19b65026091938beafa18c8686f7b4126d4b25?apiKey=3e99c58a56f84e4cb0d84873c390b13e&"
            alt="Zaanvar Logo" width={100} height={50} priority
            className={styles.footerLogo} style={{ cursor: "pointer" }} onClick={handleLogo}
          />
          <div className={styles.footerNav}>
            <p>For your daily dose of happiness, follow us on</p>
            <div className={styles.links} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              {renderSocials()}
            </div>
          </div>
        </div>

        {/* Right – link columns */}
        <div className={styles.rightContainer}>
          {allServices.map((val, sIdx) => (
            <div className={styles.companyContainer} key={sIdx}>
              <h5>{val.title}</h5>
              <div className={styles.border} />
              {val.items.map((item, idx) => (
                <p key={idx} onClick={() => handleClick(idx, sIdx)} className={styles.linkpara}>
                  {item}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* ── Bottom bar removed as requested ── */}
    </footer>
  );
};

export default Footer;
