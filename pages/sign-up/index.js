// import React, { useEffect, useState } from "react";
// import styles from "../../styles/login/signup.module.css"
// import { Router, useRouter } from "next/router";
// import Image from "next/image";
// import { RoundIcon, RoundIcon2, Roundsmall2Icon, RoundsmallIcon } from "@/public/SVG";


// const Signup = () => {
//   const router = useRouter();
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [step, setStep] = useState(1);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showPassword2, setShowPassword2] = useState(false);

//   const [loginDetails, setLoginDetails] = useState({
//     name: "",
//     email: "",
//     passWord: "",
//     confirmPassword: "",
//     otp: "",
//   });

//   const [errors, setErrors] = useState({});
//   const [passwordError, setPasswordError] = useState("");

//   useEffect(() => {
//     setTimeout(() => setIsLoaded(true), 100);
//   }, []);

//   const validateEmail = (email) => {
//     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//     return emailRegex.test(email);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setLoginDetails((prev) => ({ ...prev, [name]: value }));

//     if ((name === "passWord" || name === "confirmPassword") && loginDetails.passWord !== loginDetails.confirmPassword) {
//       setPasswordError("Passwords do not match!");
//     } else {
//       setPasswordError("");
//     }
//   };

//   const handleNext = () => {
//     let newErrors = {};

//     if (!loginDetails.name.trim()) newErrors.name = "Name is required";
//     if (!loginDetails.email.trim()) newErrors.email = "Email is required";
//     else if (!validateEmail(loginDetails.email)) newErrors.email = "Invalid email";

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     setErrors({});
//     setStep(2);
//   };

//   const handleSignUp = () => {
//     let newErrors = {};

//     if (!loginDetails.otp.trim()) newErrors.otp = "OTP is required";
//     if (!loginDetails.confirmPassword.trim()) newErrors.confirmPassword = "Password is required";
//     if (loginDetails.confirmPassword !== loginDetails.passWord) newErrors.confirmPassword = "Passwords do not match";

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     alert("Signup Successful! (Static Mode)");
//     router.push("/log-in");
//   };

//   const handleBack = () => setStep((prev) => prev - 1);

//   return (
//     <div className={`${styles.signInContainer} ${isLoaded ? styles.loaded : ""}`}>
//       {/* Left Section */}
//       <div className={styles.leftSection}>
//         <div className={styles.mobileZaanvar}>
//           <Image src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png" alt="Zaanvar Logo" width={120} height={60} priority style={{ marginTop: "40px" }} />
//         </div>
//         <h1 className={styles.text}>
//           Join the <span style={{ color: "#F5790C" }}>Zaanvar Family!</span>
//         </h1>
//         <p className={styles.text}>Let’s get started on your journey of caring, connecting, and discovering all things pets.</p>
//         <div className={styles.dogImageContainer}>
//           <RoundIcon />
//           <RoundIcon2 />
//           <RoundsmallIcon />
//           <Roundsmall2Icon />
//           <img src="https://zaanvar-care.b-cdn.net/media/1761372075849-view-funny-animal 1.png" className={styles.dogImg} />
//         </div>
//       </div>

//       {/* Right Section */}
//       <div className={styles.rightSection}>
//         <div className={styles.logoContainer}>
//           <Image src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png" alt="Zaanvar Logo" width={180} height={80} priority />
//         </div>

//         <form className={styles.formContainer}>
//           {step === 1 && (
//             <>
//               <div className={styles.inputGroup}>
//                 <label>Name *</label>
//                 <input type="text" name="name" placeholder="Enter your Name" value={loginDetails.name} onChange={handleChange} />
//                 {errors.name && <span className={styles.error1}>{errors.name}</span>}
//               </div>

//               <div className={styles.inputGroup}>
//                 <label>Email *</label>
//                 <input type="email" name="email" placeholder="Enter your Email" value={loginDetails.email} onChange={handleChange} />
//                 {errors.email && <span className={styles.error1}>{errors.email}</span>}
//               </div>

//               <button type="button" className={styles.signInButton} onClick={handleNext}>Next</button>
//             </>
//           )}

//           {step === 2 && (
//             <>
//               <div className={styles.inputGroup}>
//                 <label>OTP *</label>
//                 <input type="text" name="otp" placeholder="Enter OTP" value={loginDetails.otp} onChange={handleChange} />
//                 {errors.otp && <span className={styles.error1}>{errors.otp}</span>}
//               </div>

//               <div className={styles.inputGroup}>
//                 <label>Create Password *</label>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="confirmPassword"
//                   placeholder="Enter Password"
//                   value={loginDetails.confirmPassword}
//                   onChange={handleChange}
//                 />
//                 <span onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
//                   {showPassword ? <EyeIcon /> : <ClosedEyeIcon />}
//                 </span>
//               </div>

//               <div className={styles.inputGroup}>
//                 <label>Confirm Password *</label>
//                 <input
//                   type={showPassword2 ? "text" : "password"}
//                   name="passWord"
//                   placeholder="Re-enter Password"
//                   value={loginDetails.passWord}
//                   onChange={handleChange}
//                 />
//                 {passwordError && <span className={styles.error1}>{passwordError}</span>}
//               </div>

//               <div style={{ display: "flex", gap: "10px" }}>
//                 <button type="button" className={styles.signInButton} onClick={handleBack}>Back</button>
//                 <button type="button" className={styles.signInButton} onClick={handleSignUp}>Sign Up</button>
//               </div>
              
//             </>
//           )}
//         </form>
//         <p className={styles.signUpPrompt}>
//               Don't have an account? 
//               <button 
//   type="button" 
//   className={styles.signUpLink} 
//   onClick={() => router.push("/login")}
// >
//   Log In
// </button>
// </p>
//       </div>
//     </div>
//   );
// };

// export default Signup;
