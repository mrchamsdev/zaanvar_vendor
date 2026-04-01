import React from "react";
import styles from "../../styles/pet-sales/backHeader.module.css";
import { useRouter } from "next/navigation";
import { LeftArrowIcon } from "@/public/images/SVG";

const BackHeader = ({ text }) => {
  const router = useRouter();

  return (
    <div className={styles.MobHeaderContainer}>
      <div className={styles.textContainer}>
        <span
          className={styles.backIcon}
          onClick={() => router.back()}
        >
          <LeftArrowIcon />
        </span>
        <h5 className={styles.text}>{text}</h5>
      </div>
    </div>
  );
};

export default BackHeader;