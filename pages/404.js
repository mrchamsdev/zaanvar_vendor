import React from "react";
import Link from "next/link";
import styles from "../styles/vender/custom404.module.css"
import Image from "next/image";
// import Image from "next/image";

function Custom404() {
  return (
    <div className={styles["container"]}>
      <div className={styles["full-screen-wrapper"]}>
        <Image
          src="https://zaanvar-care.b-cdn.net/media/1760185561303-404_space.svg"
          alt="404 Illustration"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
      
      <div className={styles["full-screen-wrapper2"]}>
        <Image
          src="https://zaanvar-care.b-cdn.net/media/1760185515117-404Mob.jpg"
          alt="Image Not Found"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>


      <div className={styles["link-container"]}>
        <Link href="/" className={styles["link"]}>
          <button>← Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

export default Custom404;
