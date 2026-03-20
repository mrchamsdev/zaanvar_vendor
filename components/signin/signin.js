import React, { useEffect, useState } from "react";
import styles from "../../styles/login/signin.module.css";
import { toast } from "sonner";
import { WebApimanager } from "../utilities/WebApiManager";
import useStore from "../state/useStore";
import { useRouter } from "next/router";
import Image from "next/image";
// import zaanvarlogo from "../../public/images/ZAANVAR_FINAL.png"; // OLD LOGO - commented out
import { CircleMobBackIcon, ClosedEyeIcon, EyeIcon } from "../svg/SVG";
import SearchableCountryCode from "../utilities/searchablecountrycode";
import { getPhoneLength, isValid } from "../utilities/countryUtils";

// ─── New Brand Assets ────────────────────────────────────────────────────────
const LOGO_URL =
  "https://zaanvarprods3.b-cdn.net/media/1773901732776-zaanvarbusinesslogo.svg";

const SLIDES = [
  {
    title: "Pet Sales",
    img: "https://zaanvarprods3.b-cdn.net/media/1773904975247-petsales.jpeg",
  },
  {
    title: "Pet Day Care",
    img: "https://zaanvarprods3.b-cdn.net/media/1773904967711-daycare.jpeg",
  },
  {
    title: "Pet Grooming",
    img: "https://zaanvarprods3.b-cdn.net/media/1773904959532-grooming.jpeg",
  },
  {
    title: "Pet Clinic",
    img: "https://zaanvarprods3.b-cdn.net/media/1773904953568-clinic.jpeg",
  },
  {
    title: "Pet Shops",
    img: "https://zaanvarprods3.b-cdn.net/media/1773904947760-petshops.jpeg",
  },
  {
    title: "Pet Training",
    img: "https://zaanvarprods3.b-cdn.net/media/1773904939833-pettaining.jpeg",
  },
];

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M13.3598 9.87166C12.927 9.53298 12.2321 9.08064 11.9444 8.93269C11.3321 8.61423 10.4796 8.6573 9.91706 9.03552L9.91062 9.03992C9.5541 9.28837 9.2237 9.57235 8.92448 9.88748L8.91657 9.89568C8.85819 9.95771 8.77962 9.99691 8.69495 10.0063C8.61028 10.0156 8.52506 9.99447 8.45456 9.94666C7.80755 9.50582 7.20386 9.00455 6.65162 8.44958C6.09668 7.8975 5.5955 7.2939 5.15483 6.64694C5.10702 6.57664 5.08582 6.4916 5.09506 6.40708C5.10429 6.32257 5.14335 6.24411 5.20523 6.1858L5.21401 6.17701C5.52917 5.87782 5.81314 5.54741 6.06158 5.19088L6.06597 5.18443C6.4442 4.62193 6.48726 3.76939 6.16939 3.15854C6.01998 2.86967 5.56851 2.17475 5.22983 1.74203C4.8979 1.30258 4.34858 0.695544 4.1145 0.48607C3.59565 0.01849 2.75043 -0.0869792 2.14808 0.240854L2.14076 0.244956C1.76791 0.45736 1.41835 0.708243 1.09779 0.993494L1.06497 1.02279C0.44124 1.56361 0.0917269 2.38188 0.0542267 3.39057C0.012918 4.50064 0.343681 5.80553 1.01282 7.16403C1.69779 8.55622 2.70853 9.93992 3.93579 11.1651C5.16304 12.3903 6.54527 13.4037 7.93746 14.0887C9.22067 14.72 10.4558 15.0508 11.5246 15.0508C11.5873 15.0508 11.6494 15.0496 11.7109 15.0473C12.7196 15.0098 13.5379 14.6605 14.0781 14.0365L14.1074 14.0037C14.3927 13.6832 14.6436 13.3336 14.856 12.9607L14.8601 12.9534C15.1876 12.3516 15.0827 11.507 14.616 10.9882C14.4062 10.7529 13.7995 10.2036 13.3598 9.87166Z"
      fill="black"
      stroke="white"
      strokeWidth="0.1"
    />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg"  width="16"
  height="16" viewBox="0 0 384 512" fill="none">
  <path d="M373.333 192H341.333V149.333C341.333 66.99 274.344 0 192 0C109.656 0 42.667 66.99 42.667 149.333V192H10.667C4.771 192 0 196.771 0 202.667V469.334C0 492.865 19.135 512 42.667 512H341.334C364.865 512 384 492.865 384 469.333V202.667C384 196.771 379.229 192 373.333 192ZM223.938 414.823C224.271 417.833 223.303 420.854 221.282 423.115C219.261 425.375 216.365 426.667 213.334 426.667H170.667C167.636 426.667 164.74 425.375 162.719 423.115C160.698 420.855 159.729 417.834 160.063 414.823L166.792 354.313C155.865 346.365 149.334 333.792 149.334 320C149.334 296.469 168.469 277.333 192.001 277.333C215.533 277.333 234.668 296.468 234.668 320C234.668 333.792 228.137 346.365 217.21 354.313L223.938 414.823ZM277.333 192H106.667V149.333C106.667 102.281 144.948 64 192 64C239.052 64 277.333 102.281 277.333 149.333V192Z" fill="black"/>
</svg>
);

const SignIn = ({ onSignUpClick }) => {
  const webApi = new WebApimanager();
  const router = useRouter();
  const { getPreviousPath, setJwtToken, setUserInfo } = useStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [countries, setCountries] = useState([]); // List of unique phone codes
  const [countryCode, setCountryCode] = useState("IN");
  const [showPassword, setShowPassword] = useState(false);
  const [details, setDetails] = useState({
    number: "",
    passWord: "", // 6-digit PIN
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({
    number: "",
    passWord: "",
  });
  const [loginError, setLoginError] = useState("");

  // ─── Slideshow State ───────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0);

  const pinRegex = /^[0-9]{6}$/;

  // ─── Auto-rotate slideshow ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Load saved number from localStorage
  // useEffect(() => {
  //   const savedNumber = localStorage.getItem("savedNumber");
  //   if (savedNumber) {
  //     setDetails((prev) => ({ ...prev, number: savedNumber }));
  //     setRememberMe(true);
  //   }
  //   setIsInitialized(true);
  //   setTimeout(() => {
  //     setIsLoaded(true);
  //   }, 100);
  // }, []);

  // Fetch countries for dial codes
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/countries");
        const data = await response.json();
        const allCountriesList = data
          .map((c) => ({
            code: c.isoCode,
            dialCode: c.phonecode.startsWith("+")
              ? c.phonecode
              : `+${c.phonecode}`,
            name: c.name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(allCountriesList);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const savedNumber = localStorage.getItem("savedNumber");
    const savedCountryCode = localStorage.getItem("savedCountryCode");

    if (savedNumber && savedCountryCode) {
      const codeDigits = savedCountryCode.replace(/\D/g, "");
      let cleanedNumber = savedNumber.replace(/\s/g, "");

      if (cleanedNumber.startsWith(savedCountryCode)) {
        cleanedNumber = cleanedNumber.slice(savedCountryCode.length);
      } else if (cleanedNumber.startsWith(codeDigits)) {
        cleanedNumber = cleanedNumber.slice(codeDigits.length);
      }

      setDetails((prev) => ({ ...prev, number: cleanedNumber }));
      setCountryCode(savedCountryCode);
      setRememberMe(true);
    }

    setIsInitialized(true);
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);
  }, []);

  // Prefetch routes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefetchRoutes = () => {
      const schedulePrefetch = (callback) => {
        if (typeof window !== "undefined" && window.requestIdleCallback) {
          window.requestIdleCallback(callback, { timeout: 1500 });
        } else {
          setTimeout(callback, 1500);
        }
      };

      schedulePrefetch(async () => {
        try {
          const routesToPrefetch = ["/forgotpassword", "/sign-up", "/tinder", "/"];
          if (router.query?.from && typeof router.query.from === "string") {
            const fromRoute = router.query.from.startsWith("/")
              ? router.query.from
              : `/${router.query.from}`;
            routesToPrefetch.push(fromRoute);
          }
          const uniqueRoutes = [...new Set(routesToPrefetch)];
          await Promise.all(
            uniqueRoutes.map((routePath) =>
              router.prefetch(routePath).catch(() => {})
            )
          );
        } catch (error) {
          // Silently fail
        }
      });
    };

    prefetchRoutes();
  }, [router]);

  // Handle truncation and validation when country code changes
  useEffect(() => {
    if (details.number && isInitialized) {
      const maxLen = getPhoneLength(countryCode);
      if (details.number.length > maxLen) {
        const truncated = details.number.slice(0, maxLen);
        setDetails((prev) => ({ ...prev, number: truncated }));
      }

      const currentLen = details.number.length;
      if (currentLen > 0 && currentLen < maxLen) {
        setErrors((prev) => ({
          ...prev,
          number: `Enter ${maxLen} digits for this country.`,
        }));
      } else if (currentLen === maxLen) {
        setErrors((prev) => ({ ...prev, number: "" }));
      }
    }
  }, [countryCode, countries, isInitialized]);

  const validateNumber = (number, code) => {
    return isValid(number, code || countryCode);
  };

  const getPhoneNumberWithDefault = (num, iso) => {
    const trimmed = (num || "").trim().replace(/\s/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    const country = countries.find((c) => c.code === iso);
    const dialCode = country?.dialCode || "+91";
    return `${dialCode}${trimmed}`;
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    const isPin = name === "passWord";

    if (name === "number") {
      const maxPhoneLen = getPhoneLength(countryCode);
      const phoneDigits = value.replace(/\D/g, "").slice(0, maxPhoneLen);

      setDetails((prev) => ({ ...prev, number: phoneDigits }));
      setErrors((prev) => ({
        ...prev,
        number:
          phoneDigits.length === 0
            ? ""
            : phoneDigits.length < maxPhoneLen
            ? `Enter ${maxPhoneLen} digits for this country.`
            : "",
      }));
      return;
    }

    const nextValue = isPin ? value.replace(/\D/g, "").slice(0, 6) : value;
    setDetails((prev) => ({ ...prev, [name]: nextValue }));

    if (name === "passWord") {
      setErrors((prev) => ({
        ...prev,
        passWord: pinRegex.test(nextValue)
          ? ""
          : nextValue.length > 0
            ? "Enter 6 digit PIN"
            : "",
      }));
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(""); // clear previous error on every attempt

    if (!details.number || !validateNumber(details.number, countryCode)) {
      const len = getPhoneLength(countryCode);
      setErrors((prev) => ({
        ...prev,
        number: `Please enter a valid number (${len} digits)`,
      }));
      return;
    }

    if (!details.passWord || !pinRegex.test(details.passWord)) {
      setErrors((prev) => ({
        ...prev,
        passWord: "Please enter valid 6-digit PIN",
      }));
      return;
    }

    const loginPayload = {
      // phoneNumber: getPhoneNumberWithDefault(details.number, countryCode),
      phoneNumber:details.number,
      pin: details.passWord,
    };

    try {
      const response = await webApi.postwithouttoken(
        "vendor/registration/login",
        loginPayload
      );

      // Support both response shapes:
      //   { status:"success", token, data:{ vendor } }   ← new API
      //   { token, user }                                 ← old API
      const token = response?.token;
      const user  = response?.data?.vendor ?? response?.user;

      if (token && user) {
        setJwtToken(token);
        setUserInfo(user);

        const loggedOutDevices =
          JSON.parse(localStorage.getItem("loggedOutDevices")) || [];
        if (loggedOutDevices.length > 0) {
          const updatedLoggedOutDevices = loggedOutDevices.filter(
            (d) =>
              d.phoneNumber &&
              d.phoneNumber !==
                getPhoneNumberWithDefault(details.number, countryCode)
          );
          localStorage.setItem(
            "loggedOutDevices",
            JSON.stringify(updatedLoggedOutDevices)
          );
        }
        toast.success("Logged in Successfully!");

        if (rememberMe) {
          localStorage.setItem("savedCountryCode", countryCode);
          localStorage.setItem("savedNumber", details.number);
        } else {
          localStorage.removeItem("savedCountryCode");
          localStorage.removeItem("savedNumber");
        }

        // Always navigate to the vendor dashboard after login
        setTimeout(() => router.push("/dashboard"), 500);
      } else {
        // API returned a body but no token — e.g. {"status":"fail","message":"..."}
        const errorMsg =
          response?.message ||
          response?.error ||
          "Login failed. Please try again.";
        setLoginError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Invalid Credentials!";
      setLoginError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const forgotpassword = () => {
    router.push("/forgotpassword");
  };

  // ─── Shared: Slideshow dots ────────────────────────────────────────────────
  const renderDots = (dotClass, dotActiveClass) =>
    SLIDES.map((_, i) => (
      <button
        key={i}
        type="button"
        className={`${dotClass} ${i === currentSlide ? dotActiveClass : ""}`}
        onClick={() => setCurrentSlide(i)}
        aria-label={`Go to slide ${i + 1}`}
      />
    ));

  // ─── Shared: Slideshow panels ─────────────────────────────────────────────
  const renderSlides = (slideClass, slideActiveClass) =>
    SLIDES.map((slide, i) => (
      <div
        key={i}
        className={`${slideClass} ${i === currentSlide ? slideActiveClass : ""}`}
        style={{ backgroundImage: `url(${slide.img})` }}
        aria-hidden={i !== currentSlide}
      />
    ));

  /* =========================================================
   * OLD JSX — COMMENTED OUT
   * =========================================================
  return (
    <>
      <div className={styles.Container} style={{ opacity: isInitialized ? 1 : 0, transition: "opacity 0.1s ease-in-out" }}>
        {/* Desktop View *\/}
        <div className={styles.DesktopContent}>
          {/* Left Side - Branding *\/}
          <div className={styles.DesktopLeft}>
            <div className={styles.BrandingWrapper}>
              <Image src={zaanvarlogo} alt="Zaanvar Logo" className={styles.DesktopLogo} priority />
              <h2 className={styles.DesktopTagline}>Loving your Furry Family</h2>
            </div>
          </div>

          {/* Right Side - Form *\/}
          <div className={styles.DesktopRight}>
            <div className={styles.FormCardWrapper}>
              <div className={styles.DesktopDogWrapper}>
                <Image src="https://zaanvarprods3.b-cdn.net/media/1770639675396-dogimage (1).png" alt="Peeking Dog" width={150} height={150} className={styles.PeekingDog} />
              </div>
              <div className={styles.DesktopFormCard}>
                <h3 className={styles.FormTitle}>Login Your Account</h3>
                <form className={styles.DesktopForm} onSubmit={handleLoginSubmit}>
                  ...
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View *\/}
      <div className={styles.mobContainer} style={{ opacity: isInitialized ? 1 : 0, transition: "opacity 0.1s ease-in-out" }}>
        ...
      </div>
    </>
  );
  * ========================================================= */

  // ─── NEW JSX ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ================================================================
          DESKTOP VIEW  ≥ 768 px  — two-column layout
          ================================================================ */}
      <div
        className={styles.newContainer}
        style={{
          opacity: isInitialized ? 1 : 0,
          transition: "opacity 0.15s ease-in-out",
        }}
      >
        {/* ── Left: Slideshow ── */}
        <div className={styles.newSlideshow}>
          {renderSlides(styles.newSlide, styles.newSlideActive)}
          <div className={styles.newSlideshowOverlay} />
          <div className={styles.newSlideshowBottom}>
            <p className={styles.newSlideLabel}>{SLIDES[currentSlide].title}</p>
            <div className={styles.newDots}>
              {renderDots(styles.newDot, styles.newDotActive)}
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className={styles.newFormSide}>
          {/* Logo */}
          <div className={styles.newLogoArea}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Zaanvar Business" className={styles.newLogo} />
          </div>

          {/* Form Card */}
          <div className={styles.newFormCard}>
            <h3 className={styles.newFormTitle}>Login Your Account</h3>

            <form className={styles.newForm} onSubmit={handleLoginSubmit}>
              {/* Phone / Mail */}
              <div className={styles.newInputGroup}>
                <span className={styles.newInputIcon}>
                  <PhoneIcon />
                    </span>
                <div className={styles.newPhoneWrapper}>
                      <SearchableCountryCode
                        countries={countries}
                        selectedCode={countryCode}
                        onSelect={(code) => setCountryCode(code)}
                      />
                      <input
                        type="tel"
                        name="number"
                        value={details.number}
                        onChange={handleLoginChange}
                    className={styles.newInput}
                        maxLength={getPhoneLength(countryCode)}
                        autoComplete="off"
                    placeholder="Enter Your Mail or Phone Number"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
              {errors.number && (
                <span className={styles.newError}>{errors.number}</span>
              )}

              {/* PIN */}
              <div className={styles.newInputGroup}>
                <span className={styles.newInputIcon}>
                  <LockIcon />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="passWord"
                      value={details.passWord}
                      onChange={handleLoginChange}
                  className={styles.newInput}
                      maxLength={6}
                  placeholder="Enter Your Pin"
                    />
                    <span
                  className={styles.newToggleIcon}
                  onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeIcon /> : <ClosedEyeIcon />}
                    </span>
                  </div>
              {errors.passWord && (
                <span className={styles.newError}>{errors.passWord}</span>
              )}

              {/* Forgot PIN */}
              <div className={styles.newForgotRow}>
                <a
                  href="#"
                  className={styles.newForgotLink}
                  onClick={(e) => {
                    e.preventDefault();
                    forgotpassword();
                  }}
                >
                  Forgot Your Pin?
                </a>
              </div>

              {/* Remember Me */}
              <div className={styles.newRememberRow}>
                <label className={styles.newRememberLabel}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Remember me
                    </label>
                  </div>

              {/* API / Login error */}
              {loginError && (
                <span className={styles.newError} style={{ textAlign: "center", display: "block" }}>
                  {loginError}
                </span>
              )}

              {/* Submit */}
              <button
                type="submit"
                className={styles.newSubmitBtn}
                disabled={!isLoaded}
              >
                    {isLoaded ? "Login" : "Please wait..."}
                  </button>

                </form>
          </div>
        </div>
      </div>

      {/* ================================================================
          MOBILE VIEW  < 768 px  — stacked layout
          ================================================================ */}
      <div
        className={styles.newMobContainer}
        style={{
          opacity: isInitialized ? 1 : 0,
          transition: "opacity 0.15s ease-in-out",
        }}
      >
        {/* ── Top: Slideshow ── */}
        <div className={styles.newMobSlideshow}>
          {renderSlides(styles.newMobSlide, styles.newMobSlideActive)}
          <div className={styles.newMobSlideshowOverlay} />
          <div className={styles.newMobSlideshowBottom}>
            <p className={styles.newMobSlideLabel}>
              {SLIDES[currentSlide].title}
            </p>
            <div className={styles.newMobDots}>
              {renderDots(styles.newMobDot, styles.newMobDotActive)}
            </div>
          </div>
        </div>

        {/* ── Bottom: Form Card ── */}
        <div className={styles.newMobFormCard}>
          <h3 className={styles.newMobFormTitle}>Login Your Account</h3>

          <form className={styles.newMobForm} onSubmit={handleLoginSubmit}>
            {/* Phone / Mail */}
            <div className={styles.newMobInputGroup}>
              <span className={styles.newMobInputIcon}>
                <PhoneIcon />
                  </span>
              <div className={styles.newMobPhoneWrapper}>
                    <SearchableCountryCode
                      countries={countries}
                      selectedCode={countryCode}
                      onSelect={(code) => setCountryCode(code)}
                  className={styles.newMobSearchableCountry}
                    />
                    <input
                      type="tel"
                      name="number"
                      value={details.number}
                      onChange={handleLoginChange}
                  className={styles.newMobInput}
                  maxLength={getPhoneLength(countryCode)}
                  autoComplete="off"
                  placeholder="Enter Your Mail or Phone Number"
                      inputMode="numeric"
                    />
                  </div>
                </div>
            {errors.number && (
              <span className={styles.newMobError}>{errors.number}</span>
            )}

            {/* PIN */}
            <div className={styles.newMobInputGroup}>
              <span className={styles.newMobInputIcon}>
                <LockIcon />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="passWord"
                    value={details.passWord}
                    onChange={handleLoginChange}
                className={styles.newMobInput}
                    maxLength={6}
                placeholder="Enter Your Pin"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <span
                className={styles.newMobToggleIcon}
                onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeIcon /> : <ClosedEyeIcon />}
                  </span>
                </div>
            {errors.passWord && (
              <span className={styles.newMobError}>{errors.passWord}</span>
            )}

            {/* Forgot PIN */}
            <div className={styles.newMobForgotRow}>
              <a
                href="#"
                className={styles.newMobForgotLink}
                onClick={(e) => {
                  e.preventDefault();
                  forgotpassword();
                }}
              >
                Forgot Your Pin?
              </a>
            </div>

            {/* Remember Me */}
            <div className={styles.newMobRememberRow}>
              <label className={styles.newMobRememberLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                </div>

            {/* API / Login error */}
            {loginError && (
              <span className={styles.newMobError} style={{ textAlign: "center", display: "block" }}>
                {loginError}
              </span>
            )}

            {/* Submit */}
                <button
                  type="submit"
              className={styles.newMobSubmitBtn}
                  disabled={!isLoaded}
                >
              {isLoaded ? "LOG IN" : "Please wait..."}
                  </button>
              </form>
        </div>
      </div>
    </>
  );
};

export default SignIn;
