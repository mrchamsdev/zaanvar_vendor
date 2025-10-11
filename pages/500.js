
import Link from "next/link";
import styles from "../styles/vender/custom500.module.css" 
import Image from "next/image";

export default function Custom500() {
  return (
    <div className={styles["container"]}>
    <div className={styles["full-screen-wrapper"]}>
      <Image
        src="https://zaanvar-care.b-cdn.net/media/1760186429840-500_error.png"
        alt="Image Not Found"
        fill
        style={{ objectFit: "cover" }}
        priority
      />
    </div>
    
    <div className={styles["full-screen-wrapper2"]}>
      <Image
        src="https://zaanvar-care.b-cdn.net/media/1760186749058-WhatsApp Image 2025-10-11 at 6.14.25 PM.jpeg"
        alt="Image Not Found"
        fill
        style={{ objectFit: "cover" }}
        priority
      />
    </div>


    <div className={styles["link-container"]}>
      <Link href="/" className={styles["link"]}>
        <button> ← Back to Home</button>
      </Link>
    </div>
  </div>
  );
}
