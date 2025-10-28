// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import Image from "next/image";
// // import { ClosedEyeIcon, EyeIcon } from "@/public/images/SVG";
// import styles from "../../styles/login/signin.module.css"
// import { RoundIcon, RoundIcon2, Roundsmall2Icon, RoundsmallIcon } from "@/public/SVG";
// const Login = () => {
//   const route = useRouter();
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [details, setDetails] = useState({ email: "", passWord: "" });
//   const [rememberMe, setRememberMe] = useState(false);
//   const [errors, setErrors] = useState({ email: "", passWord: "" });

//   useEffect(() => {
//     const savedEmail = localStorage.getItem("savedEmail");
//     if (savedEmail) {
//       setDetails((prev) => ({ ...prev, email: savedEmail }));
//       setRememberMe(true);
//     }
//   }, []);

//   useEffect(() => {
//     setTimeout(() => setIsLoaded(true), 100);
//   }, []);

//   const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

//   const handleLoginChange = (e) => {
//     const { name, value } = e.target;
//     setDetails((prev) => ({ ...prev, [name]: value }));

//     if (name === "email") {
//       setErrors((prev) => ({
//         ...prev,
//         email: value.trim() === "" ? "" : validateEmail(value) ? "" : "Invalid email format",
//       }));
//     }
//     if (name === "passWord") setErrors((prev) => ({ ...prev, passWord: "" }));
//   };

//   const handleLoginSubmit = (e) => {
//     e.preventDefault();

//     if (!details.email || !validateEmail(details.email)) {
//       setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
//       return;
//     }

//     if (!details.passWord || !validatePassword(details.passWord)) {
//       setErrors((prev) => ({ ...prev, passWord: "Please enter a valid password" }));
//       return;
//     }

//     // Save email if Remember Me is checked
//     if (rememberMe) localStorage.setItem("savedEmail", details.email);
//     else localStorage.removeItem("savedEmail");

//     toast.success("Logged in (Static Mode)!");
//   };

//   const forgotpassword = () => route.push("/forgotpassword");

//   return (
//     <>
//       {/* <ToastContainer /> */}
//       <div className={`${styles.signInContainer} ${isLoaded ? styles.loaded : ""}`}>
//         <div className={styles.leftSection}>
//           <div className={styles.mobileZaanvar}>
//             <Image src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png" alt="Zaanvar Logo" width={120} height={60} priority />
//           </div>
//           <h1 className={styles.text}>
//             Welcome <span style={{ color: "#F5790C" }}>Back!</span>
//           </h1>
//           <p className={styles.text}>
//             We’ve missed you and your furry friend! Log in to explore pet events, services, and new matches waiting just for you.
//           </p>
//           <div className={styles.dogImageContainer}>
//             <div className={styles.roundBigIcon}>
//                 <RoundIcon />
//                 </div>
//             <div className={styles.roundBigIcon2}>
//                 <RoundIcon2 />
//             </div>
//             <div className={styles.roundsmallIcon}>
//                 <RoundsmallIcon />
//                 </div>
//             <div className={styles.roundsmall2Icon}>
//                 <Roundsmall2Icon />
//             </div>
//             <div className={styles.DogImg}>
//               <img src="https://zaanvar-care.b-cdn.net/media/1761368987866-Dog.png" className={styles.dogImg} />
//             </div>
//           </div>
//         </div>

//         <div className={styles.rightSection}>
//           <div className={styles.logoContainer}>
//             <Image src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png" alt="Zaanvar Logo" width={180} height={80} priority />
//           </div>

//           <form onSubmit={handleLoginSubmit} className={styles.formContainer}>
//             <div className={styles.inputGroup}>
//               <label>Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 placeholder="Enter your email"
//                 value={details.email}
//                 onChange={handleLoginChange}
//                 required
//               />
//               {errors.email && <span className={styles.error1}>{errors.email}</span>}
//             </div>

//             <div className={styles.inputGroup}>
//               <label>Password</label>
//               <input
//                 type={showPassword ? "text" : "password"}
//                 name="passWord"
//                 placeholder="Enter your password"
//                 value={details.passWord}
//                 onChange={handleLoginChange}
//                 required
//               />
//               <span onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
//                 {/* {showPassword ? <EyeIcon /> : <ClosedEyeIcon />} */}
//               </span>
//             </div>
//             {errors.passWord && <span className={styles.error}>{errors.passWord}</span>}

//             <div className={styles.formOptions}>
//               <label className={styles.rememberMe}>
//                 <input
//                   type="checkbox"
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                 />
//                 Remember me
//               </label>
//               <a onClick={forgotpassword} className={styles.forgotPassword}>
//                 Forgot Password
//               </a>
//             </div>

//             <button type="submit" className={styles.signInButton}>
//               LOG IN
//             </button>

//             <p className={styles.signUpPrompt}>
//               Don't have an account?
//               <button type="button" className={styles.signUpLink} onClick={() => route.push("/sign-up")}>
//                 Sign Up
//               </button>
//             </p>
//           </form>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Login;

import React, { useEffect, useState } from "react";
import styles from "../../styles/login/signin.module.css";

import { WebApimanager } from "../../components/utilities/WebApiManager"
import useStore from "../../components/state/useStore";
// import * as Icon from "react-bootstrap-icons";
import { useRouter } from "next/router";
import Image from "next/image";
import { RoundIcon, RoundIcon2, Roundsmall2Icon, RoundsmallIcon } from "@/public/SVG";
import { signIn , useSession} from "next-auth/react";
import { ClosedEyeIcon, EyeIcon } from "@/public/SVG";

const SignIn = ({ onSignUpClick }) => {
    // const { data: session } = useSession();
    const webApi = new WebApimanager();
    const route = useRouter();
    const { getPreviousPath, setJwtToken, setUserInfo } = useStore();
    const [isLoaded, setIsLoaded] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [details, setDetails] = useState({
      email: "",
      passWord: "",
    });
    const [rememberMe, setRememberMe] = useState(false);

useEffect(() => {
  const savedEmail = localStorage.getItem("savedEmail");

  if (savedEmail) {
    setDetails((prev) => ({ ...prev, email: savedEmail }));
    setRememberMe(true);
  }
}, []);
    const [errors, setErrors] = useState({
      email: "",
      passWord: "",
    });
  
    useEffect(() => {
      setTimeout(() => {
        setIsLoaded(true);
      }, 100);
    }, []);
  
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
  
    const validatePassword = (password) => {
      // Must contain at least one lowercase, one uppercase, one number, and be at least 8 chars
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      return passwordRegex.test(password);
    };
    
  
 const handleLoginChange = (e) => {
  const { name, value } = e.target;
  setDetails((prev) => ({ ...prev, [name]: value }));

  if (name === "email") {
    setErrors((prev) => ({
      ...prev,
      email: value.trim() === "" ? "" : validateEmail(value) ? "" : "Invalid email format",
    }));
  }

  // Do not validate password on change — clear error only
  if (name === "passWord") {
    setErrors((prev) => ({
      ...prev,
      passWord: "", // Clear any previous password error
    }));
  }
};

  
    const handleLoginSubmit = async (e) => {
      e.preventDefault();
  
      if (!details.email || !validateEmail(details.email)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
        return;
      }
  
      if (!details.passWord || !validatePassword(details.passWord)) {
  setErrors((prev) => ({
    ...prev,
    passWord: "Please enter valid password",
  }));
  return;
}

  
      try {
        const response = await webApi.postwithouttoken("users/login", details);
        const { token, user } = response;
  
        if (token && user) {
          setJwtToken(token);
          setUserInfo(user);
    console.log(response,"response")
            // Save only the email for security reasons
      if (rememberMe) {
        localStorage.setItem("savedEmail", details.email);
      } else {
        localStorage.removeItem("savedEmail");
      }

          
         if(response.user.type==="vendor"){
          route.push("/")
         }
        } else {
          toast.error("Login failed: Missing token or user information.");
        }
      } catch (error) {
        console.error("Login error:", error);
      
      }
    };
 const handleGoogleLogin = async () => {
    // Step 1: open Google login popup
    // await signIn("google", { redirect: false });
      const result = await signIn("google", { 
      redirect: false, 
      prompt: "select_account" 
    });
  };

  // useEffect(() => {
  //   // Step 2: Trigger after user selects an email
  //   if (session?.user?.email) {
  //     verifyGoogleEmail(session.user.email);
  //   }
  // }, [session]);

  const verifyGoogleEmail = async (email) => {
    try {
      // Step 3: Check if the email exists in your backend
      const response = await webApi.postwithouttoken("users/check-email", { email });

      if (response.exists) {
        // If user exists → login with Google
        const loginRes = await webApi.postwithouttoken("users/login", {
          email,
          passWord: "",
          isGoogleLogin: true,
        });
console.log(loginRes, "loginRes")
        const { token, user } = loginRes;
        if (token && user) {
          setJwtToken(token);
          setUserInfo(user);
          // toast.success("Logged in Successfully!");
          // route.push("/"); // redirect
        }
      } else {
        // If user does not exist → show error
        // toast.error("This account doesn’t exist. Please create an account or try another email.");
      }
    } catch (error) {
      console.error(error);
      // toast.error("Something went wrong with Google login.");
    }
  };

    const forgotpassword = () => {
      route.push("/forgotpassword");
    };

    const handleLogin = async () => {
  const res = await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();

  if (data.success) {
    useStore.getState().setUser({
      name: data.user.name,
      email: data.user.email,
    });

    localStorage.setItem("user", JSON.stringify(data.user));
  }
};
  return (
    <>
  
      <div className={`${styles.signInContainer} ${isLoaded ? styles.loaded : ""}`}>

       
        <div className={styles.leftSection}>
        <div className={styles.mobileZaanvar}>
     
            <Image
              src="https://zaanvar-care.b-cdn.net/media/1761368604038-ZAANVAR_FINAL.png"
              alt="Zaanvar Logo"
              width={120}
              height={60}
              priority
             style={{marginTop:"40px"}}
            />
          </div>
          <h1 className={styles.text}>Welcome <span style={{color:"#F5790C"}}>Back!</span></h1>
          <p className={styles.text}>We’ve missed you and your furry friend! Log in to explore pet events, services, and new matches waiting just for you.</p>
          <div className={styles.dogImageContainer}>
          <div className={styles.roundBigIcon}>
          <RoundIcon/>
          </div>
          <div className={styles.roundBigIcon2}>
          <RoundIcon2/>
          </div>
          <div className={styles.roundsmallIcon}>
          <RoundsmallIcon/>
          </div>
          <div className={styles.roundsmall2Icon}>
            <Roundsmall2Icon/>
          </div>
          <div className={styles.DogImg}>
            <img src="https://zaanvar-care.b-cdn.net/media/1761368987866-Dog.png"  className={styles.dogImg}></img>
          </div>
          
          </div>
        </div>
     
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
          <div className={styles.mobilewelcome}>
          <h1>Welcome <span style={{color:"#F5790C"}}>Back!</span></h1>
          <p>We’ve missed you and your furry friend! Log in to explore pet events, services, and new matches waiting just for you.</p>

          </div>
          
          <form onSubmit={handleLoginSubmit} className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
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
              <label htmlFor="password">Password</label>
              <input
               type={showPassword ? "text" : "password"}
               name="passWord"
               placeholder="Enter your password here"
               value={details.passWord}
               onChange={handleLoginChange}
                required
              />
               <span onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
                  {showPassword ? <EyeIcon /> : <ClosedEyeIcon />}
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
              <a href="#" className={styles.forgotPassword} onClick={forgotpassword}>Forgot Password</a>
            </div>

            <button type="submit" className={styles.signInButton}  >
              LOG IN
            </button>

 {/* <button
  type="button"
   onClick={handleGoogleLogin}
     // onClick={() => signIn("google")}
  className={styles.googleButton}
>
  <FcGoogle className={styles.googleIcon} />
  <span className={styles.googleText}>Log in with Google</span>
</button> */}
            <p className={styles.signUpPrompt}>
              Don't have an account? 
              <button 
  type="button" 
  className={styles.signUpLink} 
  onClick={() => route.push("/sign-up")}
>
  Sign Up
</button>

            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignIn;