import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "../../styles/login/signin.module.css";
import { toast } from "sonner";
import { WebApimanager } from "../utilities/WebApiManager";
import useStore from "../state/useStore";
import { useRouter } from "next/router";
import { ClosedEyeIcon, EyeIcon } from "../svg/SVG";
import SearchableCountryCode from "../utilities/searchablecountrycode";
import { getPhoneLength, isValid } from "../utilities/countryUtils";

// ─── Brand Assets ─────────────────────────────────────────────────────────────
const LOGO_URL =
  "https://zaanvarprods3.b-cdn.net/media/1773901732776-zaanvarbusinesslogo.svg";

const SLIDES = [
  { title: "Pet Sales",    img: "https://zaanvarprods3.b-cdn.net/media/1773904975247-petsales.jpeg" },
  { title: "Pet Day Care", img: "https://zaanvarprods3.b-cdn.net/media/1773904967711-daycare.jpeg" },
  { title: "Pet Grooming", img: "https://zaanvarprods3.b-cdn.net/media/1773904959532-grooming.jpeg" },
  { title: "Pet Clinic",   img: "https://zaanvarprods3.b-cdn.net/media/1773904953568-clinic.jpeg" },
  { title: "Pet Shops",    img: "https://zaanvarprods3.b-cdn.net/media/1773904947760-petshops.jpeg" },
  { title: "Pet Training", img: "https://zaanvarprods3.b-cdn.net/media/1773904939833-pettaining.jpeg" },
];

const OTP_RESEND_SECONDS = 82;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.3598 9.87166C12.927 9.53298 12.2321 9.08064 11.9444 8.93269C11.3321 8.61423 10.4796 8.6573 9.91706 9.03552L9.91062 9.03992C9.5541 9.28837 9.2237 9.57235 8.92448 9.88748L8.91657 9.89568C8.85819 9.95771 8.77962 9.99691 8.69495 10.0063C8.61028 10.0156 8.52506 9.99447 8.45456 9.94666C7.80755 9.50582 7.20386 9.00455 6.65162 8.44958C6.09668 7.8975 5.5955 7.2939 5.15483 6.64694C5.10702 6.57664 5.08582 6.4916 5.09506 6.40708C5.10429 6.32257 5.14335 6.24411 5.20523 6.1858L5.21401 6.17701C5.52917 5.87782 5.81314 5.54741 6.06158 5.19088L6.06597 5.18443C6.4442 4.62193 6.48726 3.76939 6.16939 3.15854C6.01998 2.86967 5.56851 2.17475 5.22983 1.74203C4.8979 1.30258 4.34858 0.695544 4.1145 0.48607C3.59565 0.01849 2.75043 -0.0869792 2.14808 0.240854L2.14076 0.244956C1.76791 0.45736 1.41835 0.708243 1.09779 0.993494L1.06497 1.02279C0.44124 1.56361 0.0917269 2.38188 0.0542267 3.39057C0.012918 4.50064 0.343681 5.80553 1.01282 7.16403C1.69779 8.55622 2.70853 9.93992 3.93579 11.1651C5.16304 12.3903 6.54527 13.4037 7.93746 14.0887C9.22067 14.72 10.4558 15.0508 11.5246 15.0508C11.5873 15.0508 11.6494 15.0496 11.7109 15.0473C12.7196 15.0098 13.5379 14.6605 14.0781 14.0365L14.1074 14.0037C14.3927 13.6832 14.6436 13.3336 14.856 12.9607L14.8601 12.9534C15.1876 12.3516 15.0827 11.507 14.616 10.9882C14.4062 10.7529 13.7995 10.2036 13.3598 9.87166Z" fill="black" stroke="white" strokeWidth="0.1" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 384 512" fill="none">
    <path d="M373.333 192H341.333V149.333C341.333 66.99 274.344 0 192 0C109.656 0 42.667 66.99 42.667 149.333V192H10.667C4.771 192 0 196.771 0 202.667V469.334C0 492.865 19.135 512 42.667 512H341.334C364.865 512 384 492.865 384 469.333V202.667C384 196.771 379.229 192 373.333 192ZM223.938 414.823C224.271 417.833 223.303 420.854 221.282 423.115C219.261 425.375 216.365 426.667 213.334 426.667H170.667C167.636 426.667 164.74 425.375 162.719 423.115C160.698 420.855 159.729 417.834 160.063 414.823L166.792 354.313C155.865 346.365 149.334 333.792 149.334 320C149.334 296.469 168.469 277.333 192.001 277.333C215.533 277.333 234.668 296.468 234.668 320C234.668 333.792 228.137 346.365 217.21 354.313L223.938 414.823ZM277.333 192H106.667V149.333C106.667 102.281 144.948 64 192 64C239.052 64 277.333 102.281 277.333 149.333V192Z" fill="black" />
  </svg>
);

const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512" fill="none">
    <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" fill="black" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512" fill="none">
    <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" fill="black" />
  </svg>
);

// ─── Mask mobile: show only last 2 digits ─────────────────────────────────────
const maskMobile = (mobile10) => `(******${mobile10.slice(-2)})`;

// ─── OTP 6-Box Input Component ────────────────────────────────────────────────
const OtpBoxes = ({ otp, setOtp }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (otp[idx]) {
        const next = [...otp];
        next[idx] = "";
        setOtp(next);
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
        const next = [...otp];
        next[idx - 1] = "";
        setOtp(next);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    e.preventDefault();
    const next = Array(6).fill("").map((_, i) => paste[i] || "");
    setOtp(next);
    const focusIdx = Math.min(paste.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className={styles.otpBoxRow}>
      {otp.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className={`${styles.otpBox} ${digit ? styles.otpBoxFilled : ""}`}
          autoComplete="one-time-code"
          aria-label={`OTP digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SignIn = ({ onSignUpClick }) => {
  const webApi = new WebApimanager();
  const router = useRouter();
  const { setJwtToken, setUserInfo } = useStore();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countryCode, setCountryCode] = useState("IN");
  const [showPassword, setShowPassword] = useState(false);
  const [details, setDetails] = useState({ number: "", passWord: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ number: "", passWord: "" });
  const [loginError, setLoginError] = useState("");

  // ── View: 'login' | 'register' | 'otp' ────────────────────────────────────
  const [view, setView] = useState("login");

  // ── Register form ──────────────────────────────────────────────────────────
  const [regDetails, setRegDetails] = useState({ name: "", email: "", mobile: "", password: "" });
  const [regErrors, setRegErrors] = useState({ name: "", email: "", mobile: "", password: "" });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // ── OTP state ──────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(OTP_RESEND_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);
  // Stores the full mobile (+91XXXXXXXXXX) used for OTP
  const [otpMobile, setOtpMobile] = useState("");

  // ── Slideshow ──────────────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showBreederModal, setShowBreederModal] = useState(true);

  const pinRegex = /^[0-9]{6}$/;

  // ── Auto-rotate slideshow ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % SLIDES.length), 3500);
    return () => clearInterval(timer);
  }, []);

  // ── Fetch countries ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/countries")
      .then((r) => r.json())
      .then((data) =>
        setCountries(
          data
            .map((c) => ({
              code: c.isoCode,
              dialCode: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
              name: c.name,
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      )
      .catch((e) => console.error("Failed to fetch countries:", e));
  }, []);

  // ── Load saved login ───────────────────────────────────────────────────────
  useEffect(() => {
    const savedNumber = localStorage.getItem("savedNumber");
    const savedCountryCode = localStorage.getItem("savedCountryCode");
    if (savedNumber && savedCountryCode) {
      const codeDigits = savedCountryCode.replace(/\D/g, "");
      let cleaned = savedNumber.replace(/\s/g, "");
      if (cleaned.startsWith(savedCountryCode)) cleaned = cleaned.slice(savedCountryCode.length);
      else if (cleaned.startsWith(codeDigits)) cleaned = cleaned.slice(codeDigits.length);
      setDetails((p) => ({ ...p, number: cleaned }));
      setCountryCode(savedCountryCode);
      setRememberMe(true);
    }
    setIsInitialized(true);
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // ── Read ?view=register from URL ───────────────────────────────────────────
  useEffect(() => {
    if (router.query.view === "register") setView("register");
  }, [router.query.view]);

  // ── Prefetch routes ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cb = () => {
      try {
        ["/forgotpassword", "/sign-up", "/dashboard", "/"].forEach((p) =>
          router.prefetch(p).catch(() => {})
        );
      } catch {}
    };
    window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 1500);
  }, [router]);

  // ── Phone length validation on country code change ─────────────────────────
  useEffect(() => {
    if (details.number && isInitialized) {
      const maxLen = getPhoneLength(countryCode);
      if (details.number.length > maxLen)
        setDetails((p) => ({ ...p, number: p.number.slice(0, maxLen) }));
      const len = details.number.length;
      setErrors((p) => ({
        ...p,
        number: len > 0 && len < maxLen ? `Enter ${maxLen} digits for this country.` : "",
      }));
    }
  }, [countryCode, countries, isInitialized]);

  // ── OTP resend countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "otp") return;
    setResendTimer(OTP_RESEND_SECONDS);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [view]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPhoneNumberWithDefault = (num, iso) => {
    const trimmed = (num || "").trim().replace(/\s/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    const country = countries.find((c) => c.code === iso);
    return `${country?.dialCode || "+91"}${trimmed}`;
  };

  // ── Login handlers ─────────────────────────────────────────────────────────
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    if (name === "number") {
      const maxPhoneLen = getPhoneLength(countryCode);
      const digits = value.replace(/\D/g, "").slice(0, maxPhoneLen);
      setDetails((p) => ({ ...p, number: digits }));
      setErrors((p) => ({
        ...p,
        number: digits.length === 0 ? "" : digits.length < maxPhoneLen ? `Enter ${maxPhoneLen} digits for this country.` : "",
      }));
      return;
    }
    const next = name === "passWord" ? value.replace(/\D/g, "").slice(0, 6) : value;
    setDetails((p) => ({ ...p, [name]: next }));
    if (name === "passWord")
      setErrors((p) => ({ ...p, passWord: pinRegex.test(next) ? "" : next.length > 0 ? "Enter 6 digit PIN" : "" }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!details.number || !isValid(details.number, countryCode)) {
      setErrors((p) => ({ ...p, number: `Please enter a valid number (${getPhoneLength(countryCode)} digits)` }));
      return;
    }
    if (!pinRegex.test(details.passWord)) {
      setErrors((p) => ({ ...p, passWord: "Please enter valid 6-digit PIN" }));
      return;
    }
    try {
      const response = await webApi.postwithouttoken("vendor/registration/login", {
        phoneNumber: details.number,
        pin: details.passWord,
      });
      const token = response?.token;
      const user = response?.data?.vendor ?? response?.user;
      if (token && user) {
        let onlyBreeder = false, otherServices = false;
        user.vendorCompanies?.forEach((company) =>
          company.servicesProvided?.forEach((s) => s === "Pet Breeder" ? (onlyBreeder = true) : (otherServices = true))
        );
        if (onlyBreeder && !otherServices) { setShowBreederModal(true); return; }
        setJwtToken(token);
        setUserInfo(user);
        if (rememberMe) {
          localStorage.setItem("savedCountryCode", countryCode);
          localStorage.setItem("savedNumber", details.number);
        } else {
          localStorage.removeItem("savedCountryCode");
          localStorage.removeItem("savedNumber");
        }
        toast.success("Logged in Successfully!");
        const hasNoBusiness = !user.vendorCompanies || user.vendorCompanies.length === 0;
        if (hasNoBusiness) {
          setTimeout(() => router.push("/onboarding"), 500);
        } else {
          setTimeout(() => router.push("/dashboard"), 500);
        }
      } else {
        const msg = response?.message || response?.error || "Login failed. Please try again.";
        setLoginError(msg);
        toast.error(msg);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Invalid Credentials!";
      setLoginError(msg);
      toast.error(msg);
    }
  };

  // ── Register handlers ──────────────────────────────────────────────────────
  const handleRegChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setRegDetails((p) => ({ ...p, mobile: digits }));
      setRegErrors((p) => ({ ...p, mobile: digits.length === 0 ? "" : digits.length < 10 ? "Enter 10 digit mobile number" : "" }));
      return;
    }
    if (name === "password") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setRegDetails((p) => ({ ...p, password: digits }));
      setRegErrors((p) => ({ ...p, password: digits.length === 0 ? "" : digits.length < 6 ? "Password must be exactly 6 digits" : "" }));
      return;
    }
    setRegDetails((p) => ({ ...p, [name]: value }));
    if (name === "name") setRegErrors((p) => ({ ...p, name: value.trim() ? "" : "Name is required" }));
    if (name === "email") {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setRegErrors((p) => ({ ...p, email: value.length === 0 ? "" : !emailOk ? "Enter a valid email address" : "" }));
    }
  };

  // Send OTP = call register API first, then show OTP screen
  const handleSendOtp = async (e) => {
    e.preventDefault();
    // Validate
    const newErrors = { name: "", email: "", mobile: "", password: "" };
    let hasError = false;
    if (!regDetails.name.trim()) { newErrors.name = "Name is required"; hasError = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regDetails.email)) { newErrors.email = "Enter a valid email address"; hasError = true; }
    if (regDetails.mobile.length !== 10) { newErrors.mobile = "Enter 10 digit mobile number"; hasError = true; }
    if (!/^[0-9]{6}$/.test(regDetails.password)) { newErrors.password = "Password must be exactly 6 digits"; hasError = true; }
    if (!agreeTerms) { toast.error("Please agree to the Terms of Use and Privacy Policy"); hasError = true; }
    if (hasError) { setRegErrors(newErrors); return; }

    setRegLoading(true);
    try {
      const fullMobile = `+91${regDetails.mobile}`;
      const payload = {
        name: regDetails.name.trim(),
        email: regDetails.email.trim(),
        mobile: fullMobile,
        password: regDetails.password,
      };
      const response = await webApi.postwithouttoken("vendor/registration/register-without-business", payload);
      // Accept any 2xx-ish response as success (API sends OTP)
      if (response) {
        toast.success("OTP sent to your mobile number!");
        setOtpMobile(fullMobile);
        setOtp(Array(6).fill(""));
        setOtpError("");
        setView("otp");
      } else {
        const msg = response?.message || response?.error || "Registration failed. Please try again.";
        toast.error(msg);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  // ── OTP handlers ───────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpError("Please enter all 6 digits of the OTP");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      const payload = { mobile: otpMobile, otp: otpString };
      const response = await webApi.postwithouttoken("vendor/registration/verify-registration-otp", payload);

      if (response) {
        toast.success("Registration successful! Welcome aboard!");
        let hasNoBusiness = true;
        // If the API returns a token, set it
        if (response?.token) {
          setJwtToken(response.token);
          const u = response?.data?.vendor ?? response?.user;
          if (u) {
            setUserInfo(u);
            if (u.vendorCompanies && u.vendorCompanies.length > 0) {
              hasNoBusiness = false;
            }
          }
        }
        if (hasNoBusiness) {
          setTimeout(() => router.push("/onboarding"), 500);
        } else {
          setTimeout(() => router.push("/dashboard"), 500);
        }
      } else {
        const msg = response?.message || response?.error || "OTP verification failed.";
        setOtpError(msg);
        toast.error(msg);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "OTP verification failed.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const payload = {
        name: regDetails.name.trim(),
        email: regDetails.email.trim(),
        mobile: otpMobile,
        password: regDetails.password,
      };
      await webApi.postwithouttoken("vendor/registration/register-without-business", payload);
      toast.success("OTP resent successfully!");
      setOtp(Array(6).fill(""));
      setOtpError("");
      setResendTimer(OTP_RESEND_SECONDS);
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Slideshow helpers ──────────────────────────────────────────────────────
  const renderDots = (dotClass, dotActiveClass) =>
    SLIDES.map((_, i) => (
      <button key={i} type="button"
        className={`${dotClass} ${i === currentSlide ? dotActiveClass : ""}`}
        onClick={() => setCurrentSlide(i)} aria-label={`Go to slide ${i + 1}`} />
    ));

  const renderSlides = (slideClass, slideActiveClass) =>
    SLIDES.map((slide, i) => (
      <div key={i}
        className={`${slideClass} ${i === currentSlide ? slideActiveClass : ""}`}
        style={{ backgroundImage: `url(${slide.img})` }}
        aria-hidden={i !== currentSlide} />
    ));

  // ── Shared form panels (desktop & mobile share logic, differ in CSS) ────────
  // Render LOGIN form
  const renderLoginForm = (s, isMob) => (
    <>
      <h3 className={s.formTitle}>Login Your Account</h3>
      <form className={s.form} onSubmit={handleLoginSubmit}>
        {/* Phone */}
        <div className={s.inputGroup}>
          <span className={s.inputIcon}><PhoneIcon /></span>
          <div className={s.phoneWrapper}>
            <SearchableCountryCode countries={countries} selectedCode={countryCode}
              onSelect={(code) => setCountryCode(code)}
              {...(isMob ? { className: styles.newMobSearchableCountry } : {})} />
            <input type="tel" name="number" value={details.number} onChange={handleLoginChange}
              className={s.input} maxLength={getPhoneLength(countryCode)}
              autoComplete="off" placeholder="Enter Your Mail or Phone Number" inputMode="numeric" />
          </div>
        </div>
        {errors.number && <span className={s.error}>{errors.number}</span>}

        {/* PIN */}
        <div className={s.inputGroup}>
          <span className={s.inputIcon}><LockIcon /></span>
          <input type={showPassword ? "text" : "password"} name="passWord" value={details.passWord}
            onChange={handleLoginChange} className={s.input} maxLength={6}
            placeholder="Enter Your Pin" inputMode="numeric" />
          <span className={s.toggleIcon} onClick={() => setShowPassword((p) => !p)}>
            {showPassword ? <EyeIcon /> : <ClosedEyeIcon />}
          </span>
        </div>
        {errors.passWord && <span className={s.error}>{errors.passWord}</span>}

        {/* Forgot */}
        <div className={s.forgotRow}>
          <a href="#" className={s.forgotLink} onClick={(e) => { e.preventDefault(); router.push("/forgotpassword"); }}>
            Forgot Your Pin?
          </a>
        </div>

        {/* Remember me */}
        <div className={s.rememberRow}>
          <label className={s.rememberLabel}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>
        </div>

        {loginError && <span className={s.error} style={{ textAlign: "center", display: "block" }}>{loginError}</span>}

        <button type="submit" className={s.submitBtn} disabled={!isLoaded}>
          {isLoaded ? "Login" : "Please wait..."}
        </button>
        <p className={s.signUpPrompt}>
          Don&apos;t have an account?
          <button type="button" className={s.signUpLink} onClick={() => setView("register")}>Sign Up</button>
        </p>
      </form>
    </>
  );

  // Render REGISTER form
  const renderRegisterForm = (s) => (
    <>
      <h3 className={s.formTitle}>Create Your Account</h3>
      <form className={s.form} onSubmit={handleSendOtp}>
        {/* Name */}
        <div className={s.inputGroup}>
          <span className={s.inputIcon}><PersonIcon /></span>
          <input type="text" name="name" value={regDetails.name} onChange={handleRegChange}
            className={s.input} placeholder="Enter Your Full Name" autoComplete="off" />
        </div>
        {regErrors.name && <span className={s.error}>{regErrors.name}</span>}

        {/* Mobile fixed +91 */}
        <div className={s.inputGroup}>
          <span className={s.inputIcon}><PhoneIcon /></span>
          <div className={s.phoneWrapper}>
            <span className={styles.newDialCodeFixed}>+91</span>
            <input type="tel" name="mobile" value={regDetails.mobile} onChange={handleRegChange}
              className={s.input} maxLength={10} placeholder="Phone (10 digits)"
              inputMode="numeric" autoComplete="off" />
          </div>
        </div>
        {regErrors.mobile && <span className={s.error}>{regErrors.mobile}</span>}

        {/* Email */}
        <div className={s.inputGroup}>
          <span className={s.inputIcon}><MailIcon /></span>
          <input type="email" name="email" value={regDetails.email} onChange={handleRegChange}
            className={s.input} placeholder="Enter Your Mail Address" autoComplete="off" />
        </div>
        {regErrors.email && <span className={s.error}>{regErrors.email}</span>}

        {/* Password 6-digit */}
        <div className={s.inputGroup}>
          <span className={s.inputIcon}><LockIcon /></span>
          <input type={showRegPassword ? "text" : "password"} name="password"
            value={regDetails.password} onChange={handleRegChange}
            className={s.input} maxLength={6} placeholder="Set Your 6 Digit Password"
            inputMode="numeric" autoComplete="new-password" />
          <span className={s.toggleIcon} onClick={() => setShowRegPassword((p) => !p)}>
            {showRegPassword ? <EyeIcon /> : <ClosedEyeIcon />}
          </span>
        </div>
        {regErrors.password && <span className={s.error}>{regErrors.password}</span>}

        {/* Terms */}
        <div className={styles.termsRow}>
          <label className={styles.termsLabel}>
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noreferrer" className={styles.termsLink}>Terms of Use</a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className={styles.termsLink}>privacy policy</a>.
          </label>
        </div>

        <button type="submit" className={s.submitBtn} disabled={regLoading}>
          {regLoading ? "Sending OTP..." : "Send OTP"}
        </button>

        <p className={s.signUpPrompt}>
          Already have an account?
          <button type="button" className={s.signUpLink} onClick={() => setView("login")}>Log In</button>
        </p>
      </form>
    </>
  );

  // Render OTP verification screen
  const renderOtpForm = (s) => {
    const last2 = otpMobile.slice(-2);
    return (
      <>
        <h3 className={styles.otpTitle}>Verify OTP</h3>
        <p className={styles.otpSubtitle}>
          We&apos;ve sent you a text message containing a verification code to your phone{" "}
          <strong>{maskMobile(otpMobile.replace("+91", ""))}</strong>
        </p>
        <p className={styles.otpLabel}>Enter Your 6 digit code</p>

        <form onSubmit={handleVerifyOtp}>
          <OtpBoxes otp={otp} setOtp={setOtp} />

          {otpError && <span className={styles.otpError}>{otpError}</span>}

          {/* Resend */}
          <div className={styles.otpResendRow}>
            <span className={styles.otpResendText}>Didn&apos;t Receive code?</span>
            <button
              type="button"
              className={`${styles.otpResendBtn} ${resendTimer > 0 ? styles.otpResendBtnDisabled : ""}`}
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || resendLoading}
            >
              {resendLoading ? "Sending..." : resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : "Resend OTP"}
            </button>
          </div>

          <button type="submit" className={s.submitBtn} disabled={otpLoading || otp.join("").length !== 6}>
            {otpLoading ? "Verifying..." : "Verify"}
          </button>

          <p className={styles.otpBackRow}>
            <button type="button" className={styles.otpBackBtn} onClick={() => setView("register")}>
              ← Back to Registration
            </button>
          </p>
        </form>
      </>
    );
  };

  // ── CSS map helpers ─────────────────────────────────────────────────────────
  const desktopS = {
    formTitle: styles.newFormTitle,
    form: styles.newForm,
    inputGroup: styles.newInputGroup,
    inputIcon: styles.newInputIcon,
    phoneWrapper: styles.newPhoneWrapper,
    input: styles.newInput,
    toggleIcon: styles.newToggleIcon,
    error: styles.newError,
    forgotRow: styles.newForgotRow,
    forgotLink: styles.newForgotLink,
    rememberRow: styles.newRememberRow,
    rememberLabel: styles.newRememberLabel,
    submitBtn: styles.newSubmitBtn,
    signUpPrompt: styles.newSignUpPrompt,
    signUpLink: styles.newSignUpLink,
  };

  const mobileS = {
    formTitle: styles.newMobFormTitle,
    form: styles.newMobForm,
    inputGroup: styles.newMobInputGroup,
    inputIcon: styles.newMobInputIcon,
    phoneWrapper: styles.newMobPhoneWrapper,
    input: styles.newMobInput,
    toggleIcon: styles.newMobToggleIcon,
    error: styles.newMobError,
    forgotRow: styles.newMobForgotRow,
    forgotLink: styles.newMobForgotLink,
    rememberRow: styles.newMobRememberRow,
    rememberLabel: styles.newMobRememberLabel,
    submitBtn: styles.newMobSubmitBtn,
    signUpPrompt: styles.newMobSignUpPrompt,
    signUpLink: styles.newMobSignUpLink,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Breeder-only modal */}
      {showBreederModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}>
          <button onClick={() => setShowBreederModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 24 }}>×</button>
          <div style={{ background: "#fff", padding: 40, borderRadius: 12, maxWidth: 500, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", margin: "0 20px" }}>
            <h2 style={{ marginBottom: 16, color: "#333" }}>Mobile App Required</h2>
            <p style={{ marginBottom: 24, color: "#555", lineHeight: 1.5 }}>To access your account, please download our mobile app. Your account currently does not have access to the web application.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="https://apps.apple.com/in/app/zaanvar-business/id6754638999" target="_blank" rel="noreferrer" style={{ padding: "12px 24px", background: "#000", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: "bold" }}>Download iOS App</a>
              <a href="https://play.google.com/store/apps/details?id=com.zaanvar.vender" target="_blank" rel="noreferrer" style={{ padding: "12px 24px", background: "#3ddc84", color: "#000", borderRadius: 8, textDecoration: "none", fontWeight: "bold" }}>Download Android App</a>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP VIEW ≥ 768px ── */}
      <div className={styles.newContainer} style={{ opacity: isInitialized ? 1 : 0, transition: "opacity 0.15s ease-in-out" }}>
        {/* Left: Slideshow */}
        <div className={styles.newSlideshow}>
          {renderSlides(styles.newSlide, styles.newSlideActive)}
          <div className={styles.newSlideshowOverlay} />
          <div className={styles.newSlideshowBottom}>
            <p className={styles.newSlideLabel}>{SLIDES[currentSlide].title}</p>
            <div className={styles.newDots}>{renderDots(styles.newDot, styles.newDotActive)}</div>
          </div>
        </div>

        {/* Right: Form */}
        <div className={styles.newFormSide}>
          <div className={styles.newLogoArea}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Zaanvar Business" className={styles.newLogo} />
          </div>

          {/* Tab row — hide on OTP screen */}
          {view !== "otp" && (
            <div className={styles.newTabRow}>
              <button id="tab-login-desktop" type="button"
                className={`${styles.newTabBtn} ${view === "login" ? styles.newTabBtnActive : ""}`}
                onClick={() => setView("login")}>Login</button>
              <button id="tab-register-desktop" type="button"
                className={`${styles.newTabBtn} ${view === "register" ? styles.newTabBtnActive : ""}`}
                onClick={() => setView("register")}>Register</button>
            </div>
          )}

          <div className={styles.newFormCard}>
            {view === "login" && renderLoginForm(desktopS, false)}
            {view === "register" && renderRegisterForm(desktopS)}
            {view === "otp" && renderOtpForm(desktopS)}
          </div>
        </div>
      </div>

      {/* ── MOBILE VIEW < 768px ── */}
      <div className={styles.newMobContainer} style={{ opacity: isInitialized ? 1 : 0, transition: "opacity 0.15s ease-in-out" }}>
        {/* Top: Slideshow */}
        <div className={styles.newMobSlideshow}>
          {renderSlides(styles.newMobSlide, styles.newMobSlideActive)}
          <div className={styles.newMobSlideshowOverlay} />
          <div className={styles.newMobSlideshowBottom}>
            <p className={styles.newMobSlideLabel}>{SLIDES[currentSlide].title}</p>
            <div className={styles.newMobDots}>{renderDots(styles.newMobDot, styles.newMobDotActive)}</div>
          </div>
        </div>

        {/* Bottom: Form card */}
        <div className={styles.newMobFormCard}>
          {/* Tab row — hide on OTP screen */}
          {view !== "otp" && (
            <div className={styles.newMobTabRow}>
              <button id="tab-login-mobile" type="button"
                className={`${styles.newMobTabBtn} ${view === "login" ? styles.newMobTabBtnActive : ""}`}
                onClick={() => setView("login")}>Login</button>
              <button id="tab-register-mobile" type="button"
                className={`${styles.newMobTabBtn} ${view === "register" ? styles.newMobTabBtnActive : ""}`}
                onClick={() => setView("register")}>Register</button>
            </div>
          )}

          {view === "login" && renderLoginForm(mobileS, true)}
          {view === "register" && renderRegisterForm(mobileS)}
          {view === "otp" && renderOtpForm(mobileS)}
        </div>
      </div>
    </>
  );
};

export default SignIn;
