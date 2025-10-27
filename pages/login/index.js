import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
// import { ClosedEyeIcon, EyeIcon } from "@/public/images/SVG";
import styles from "../../styles/login/signin.module.css"
import { RoundIcon, RoundIcon2, Roundsmall2Icon, RoundsmallIcon } from "@/public/SVG";
const Login = () => {
  const route = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [details, setDetails] = useState({ email: "", passWord: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", passWord: "" });

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setDetails((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: value.trim() === "" ? "" : validateEmail(value) ? "" : "Invalid email format",
      }));
    }
    if (name === "passWord") setErrors((prev) => ({ ...prev, passWord: "" }));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    if (!details.email || !validateEmail(details.email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }

    if (!details.passWord || !validatePassword(details.passWord)) {
      setErrors((prev) => ({ ...prev, passWord: "Please enter a valid password" }));
      return;
    }

    // Save email if Remember Me is checked
    if (rememberMe) localStorage.setItem("savedEmail", details.email);
    else localStorage.removeItem("savedEmail");

    toast.success("Logged in (Static Mode)!");
  };

  const forgotpassword = () => route.push("/forgotpassword");

  return (
    <>
      {/* <ToastContainer /> */}
      <div className={`${styles.signInContainer} ${isLoaded ? styles.loaded : ""}`}>
        <div className={styles.leftSection}>
          <div className={styles.mobileZaanvar}>
            <Image src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png" alt="Zaanvar Logo" width={120} height={60} priority />
          </div>
          <h1 className={styles.text}>
            Welcome <span style={{ color: "#F5790C" }}>Back!</span>
          </h1>
          <p className={styles.text}>
            We’ve missed you and your furry friend! Log in to explore pet events, services, and new matches waiting just for you.
          </p>
          <div className={styles.dogImageContainer}>
            <div className={styles.roundBigIcon}>
                <RoundIcon />
                </div>
            <div className={styles.roundBigIcon2}>
                <RoundIcon2 />
            </div>
            <div className={styles.roundsmallIcon}>
                <RoundsmallIcon />
                </div>
            <div className={styles.roundsmall2Icon}>
                <Roundsmall2Icon />
            </div>
            <div className={styles.DogImg}>
              <img src="https://zaanvar-care.b-cdn.net/media/1761368987866-Dog.png" className={styles.dogImg} />
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.logoContainer}>
            <Image src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png" alt="Zaanvar Logo" width={180} height={80} priority />
          </div>

          <form onSubmit={handleLoginSubmit} className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={details.email}
                onChange={handleLoginChange}
                required
              />
              {errors.email && <span className={styles.error1}>{errors.email}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="passWord"
                placeholder="Enter your password"
                value={details.passWord}
                onChange={handleLoginChange}
                required
              />
              <span onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
                {/* {showPassword ? <EyeIcon /> : <ClosedEyeIcon />} */}
              </span>
            </div>
            {errors.passWord && <span className={styles.error}>{errors.passWord}</span>}

            <div className={styles.formOptions}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a onClick={forgotpassword} className={styles.forgotPassword}>
                Forgot Password
              </a>
            </div>

            <button type="submit" className={styles.signInButton}>
              LOG IN
            </button>

            <p className={styles.signUpPrompt}>
              Don't have an account?
              <button type="button" className={styles.signUpLink} onClick={() => route.push("/sign-up")}>
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
