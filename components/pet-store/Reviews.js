"use client";

import React from "react";
import Image from "next/image";
import styles from "../../styles/pet-store/petStore.module.css";
import { petStoreReviews } from "./data";

const Reviews = ({ reviews = petStoreReviews, hideHeader = false }) => {
  return (
    <div className={styles.reviewList}>
      {!hideHeader && (
        <div className={styles.cardHeader}>
          <h3>User Reviews</h3>
        </div>
      )}

      {reviews.map((review) => (
        <div key={review.id} className={styles.reviewCard}>
          <div className={styles.reviewerAvatar}>
            <span>{review.name?.charAt(0) || "U"}</span>
          </div>
          <div className={styles.reviewBody}>
            <div className={styles.reviewTop}>
              <div>
                <p className={styles.reviewerName}>{review.name}</p>
                <div className={styles.ratingRow}>
                  <span className={styles.stars}>{"★".repeat(review.rating || 0)}</span>
                  <span className={styles.reviewDate}>{review.date}</span>
                </div>
              </div>
              <button className={styles.iconButton} aria-label="More options">
                ⋮
              </button>
            </div>
            <p className={styles.reviewText}>{review.text}</p>
            <div className={styles.reviewGallery}>
              {review.gallery?.map((img, idx) => (
                <div key={idx} className={styles.galleryItem}>
                  <Image src={img} alt={`${review.name} ${idx}`} width={90} height={90} />
                </div>
              ))}
            </div>
            <p className={styles.reviewSource}>Review From Lorem ipsum</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reviews;

