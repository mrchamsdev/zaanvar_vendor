import React, { useEffect, useState } from "react";
import styles from "../../styles/forgotpassword/forgotpassword.module.css";
import { useRouter } from "next/router";
import Image from "next/image";

const Forgotpassword = () => {
  const route = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [details, setDetails] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Page animation load
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      const isValidEmail = validateEmail(value);

      setErrors((prev) => ({
        ...prev,
        email:
          value.trim() === ""
            ? ""
            : isValidEmail
            ? ""
            : "Enter a valid email address",
      }));
    }
  };

  // Static form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!details.email) {
      setError("Please enter your email.");
      return;
    }

    if (errors.email) return;

    setLoading(true);
    setError("");

    // ✅ Instead of API — just simulate redirect
    setTimeout(() => {
      route.push({
        pathname: "/forgotpassword/otp",
        query: { email: details.email },
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <div className={`${styles.signInContainer} ${isLoaded ? styles.loaded : ""}`}>
        {/* ------------ Left Section ------------ */}
        <div className={styles.leftSection}>
          <div className={styles.mobileZaanvar}>
            <Image
              src="https://zaanvar-care.b-cdn.net/media/1761368987866-Dog.png"
              alt="Zaanvar Logo"
              width={120}
              height={60}
              priority
              style={{ marginTop: "40px" }}
            />
          </div>
          <h1 className={styles.text}>
            No Worries, <span style={{ color: "#F5790C" }}>It Happens!</span>
          </h1>
          <p className={styles.text}>
            We’ll send you a verification code to help you reset your password.
          </p>
        </div>

        {/* ------------ Right Section ------------ */}
        <div className={styles.rightSection}>
          <div className={styles.logoContainer}>
            <Image
              src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png"
              alt="Zaanvar Logo"
              width={180}
              height={80}
              priority
            />
          </div>

          <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div>
              <h1 className={styles.Forgotpassword}>Forgot your password</h1>
              <p className={styles.contentp}>Don’t worry, happens to all of us.</p>
              <p className={styles.contentp2}>
                Enter your email ID below to recover your password
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Enter your email</label>
              <input
                type="text"
                name="email"
                placeholder="Enter your email"
                value={details.email}
                onChange={handleLoginChange}
                required
              />
              {errors.email && <span className={styles.error1}>{errors.email}</span>}
            </div>

            <button type="submit" className={styles.signInButton} disabled={loading}>
              {loading ? "Please wait..." : "CONTINUE"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Forgotpassword;
