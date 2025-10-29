"use client";
import React from "react";
import styles from "../../styles/pet-sales/backHeader.module.css";
import { useRouter } from "next/navigation";
import { LeftArrowIcon } from "@/public/image/SVG";

const BackHeader = ({ text }) => {
  const router = useRouter();

  return (
    <div className={styles.MobHeaderContainer}>
      <div className={styles.textContainer}>
        <span style={{ cursor: "pointer" }} onClick={() => router.back()}>
          <LeftArrowIcon width={10} height={15} />
        </span>
        <h5 className={styles.text}>{text}</h5>
      </div>
    </div>
  );
};

export default BackHeader;
