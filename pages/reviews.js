import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import useDashboardData from "../components/dashboard/useDashboardData";
import useStore from "../components/state/useStore";
import { WebApimanager } from "../components/utilities/WebApiManager";
import { formatInOriginalTz } from "../utilities/date-time-utils";
import styles from "../styles/dashboard/reviews.module.css";
import swal from "sweetalert";
import { IMAGE_URL } from "../components/utilities/Constants";

/* ── Helpers ── */
const AVATAR_COLORS = ["#e05c2d", "#2d8ae0", "#2de07a", "#c42de0", "#e0c42d"];

const StarIcon = ({ fillValue = 1 }) => {
  if (fillValue === 1) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24"
        fill="#fbbf24" stroke="#fbbf24" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  } else if (fillValue === 0.5) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24"
        stroke="#fbbf24" strokeWidth="2" style={{ fill: "url(#halfGrad)" }}>
        <defs>
          <linearGradient id="halfGrad">
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  } else {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="#fbbf24" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
};

const ReplyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);

const OwnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const OptionsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

/* Relative time uppercase formatter */
function getRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return "JUST NOW";
  if (diffMin < 60) return `${diffMin} MINUTES AGO`;
  if (diffHour < 24) return `${diffHour} HOURS AGO`;
  if (diffDay === 1) return "YESTERDAY";
  if (diffDay < 7) return `${diffDay} DAYS AGO`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return weeks === 1 ? "ONE WEEK AGO" : `${weeks} WEEKS AGO`;
  }
  const months = Math.floor(diffDay / 30);
  return months === 1 ? "ONE MONTH AGO" : `${months} MONTHS AGO`;
}

export default function ReviewsPage() {
  const { jwtToken } = useStore();
  const {
    reviews: fetchedReviews,
    reviewsLoading,
    reviewsError,
    branchId
  } = useDashboardData({ skipReviews: false });

  /* ── Local Reviews State ── */
  const [localReviews, setLocalReviews] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ── Reply / Editing State ── */
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyCommentText, setReplyCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});

  const toggleExpand = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  /* ── Pagination State ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* Sync with hook reviews */
  useEffect(() => {
    if (fetchedReviews) {
      setLocalReviews(fetchedReviews);
    }
  }, [fetchedReviews]);

  /* Refresh local reviews list */
  const refreshReviews = async () => {
    if (!jwtToken || !branchId) return;
    setIsRefreshing(true);
    const webApi = new WebApimanager(jwtToken);
    try {
      const res = await webApi.get(`vendor-reviews/branch/${branchId}`);
      const data = res?.data || res;
      const list = data?.reviews || data?.data || data || [];
      setLocalReviews(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to refresh reviews:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  /* ── Actions ── */
  const handleStartReply = (review) => {
    setReplyingReviewId(review.reviewId);
    setReplyCommentText("");
    setIsEditing(false);
    setActiveReplyId(null);
  };

  const handleStartEdit = (review) => {
    setReplyingReviewId(review.reviewId);
    setReplyCommentText(review.replyComment || "");
    setIsEditing(true);
    setActiveReplyId(review.replyId || null);
  };

  const handleCancelReply = () => {
    setReplyingReviewId(null);
    setReplyCommentText("");
    setIsEditing(false);
    setActiveReplyId(null);
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyCommentText.trim()) {
      swal("Warning", "Please write a reply comment before submitting.", "warning");
      return;
    }

    setSubmittingId(reviewId);
    const webApi = new WebApimanager(jwtToken);

    try {
      const payload = {
        replyComment: replyCommentText.trim()
      };

      if (isEditing && activeReplyId) {
        payload.replyId = activeReplyId;
      }

      const res = await webApi.put(`vendor-reviews/${reviewId}/reply`, payload);

      if (res?.status === "success" || res?.data?.status === "success" || res) {
        swal("Success", isEditing ? "Reply updated successfully!" : "Reply submitted successfully!", "success");
        handleCancelReply();
        await refreshReviews();
      } else {
        throw new Error("API reported failure");
      }
    } catch (err) {
      console.error("Failed to submit reply:", err);
      swal("Error", "Failed to submit reply. Please try again.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteReply = async (review) => {
    const confirmDelete = await swal({
      title: "Are you sure?",
      text: "Do you want to delete this reply? This action cannot be undone.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (!confirmDelete) return;

    setSubmittingId(review.reviewId);
    const webApi = new WebApimanager(jwtToken);

    try {
      const payload = {
        replyId: review.replyId || `rep_${review.reviewId}`,
        action: "delete"
      };

      const res = await webApi.put(`vendor-reviews/${review.reviewId}/reply`, payload);

      if (res?.status === "success" || res?.data?.status === "success" || res) {
        swal("Deleted", "Reply deleted successfully!", "success");
        await refreshReviews();
      } else {
        throw new Error("API reported failure");
      }
    } catch (err) {
      console.error("Failed to delete reply:", err);
      swal("Error", "Failed to delete reply. Please try again.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  /* Pagination Logic */
  const totalItems = localReviews.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedReviews = localReviews.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className={styles.reviewsWrap}>
        
        {/* ── Main card container ── */}
        <div className={styles.reviewsMainCard}>
          {reviewsLoading && localReviews.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              Loading reviews…
            </p>
          )}

          {!reviewsLoading && reviewsError && localReviews.length === 0 && (
            <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              Reviews are currently unavailable. Please try again shortly.
            </p>
          )}

          {!reviewsLoading && localReviews.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
              No reviews found.
            </p>
          )}

          {/* Review List */}
          {paginatedReviews.map((rev, i) => {
            const name = rev.user ? (rev.user.name || `${rev.user.firstName || ""} ${rev.user.lastName || ""}`.trim()) : (rev.userName || rev.reviewerName || "Customer");
            const rating = parseFloat(rev.rating || 0);
            const comment = rev.reviewComment || "";
            const dateStr = rev.created_at ? getRelativeTime(rev.created_at) : "";
            
            const hasReply = !!rev.replyComment;
            const isReplyingThis = replyingReviewId === rev.reviewId;
            const hasReplyOrEditor = hasReply || isReplyingThis;

            // Handle rendering a list of replies (supports duplicate mock display or array replies)
            const repliesList = rev.replies || (hasReply ? [{
              replyId: rev.replyId,
              replyComment: rev.replyComment,
              replyDate: rev.replyDate,
              replyDateTimeZone: rev.replyDateTimeZone
            }] : []);

            const isExpanded = !!expandedReviews[rev.reviewId];
            const repliesToShow = isExpanded ? repliesList : repliesList.slice(0, 1);
            const showViewMore = repliesList.length > 1;
            const timelineSpan = isReplyingThis 
              ? (repliesToShow.length + (showViewMore ? 1 : 0) + 2)
              : (repliesToShow.length + 1);

            return (
              <div key={rev.reviewId || i} className={styles.reviewCard}>
                
                {/* Timeline connector behind avatars */}
                {hasReplyOrEditor && (
                  <div 
                    className={styles.timelineLine} 
                    style={{ 
                      gridRow: `1 / span ${timelineSpan}`,
                      gridColumn: "1"
                    }} 
                  />
                )}

                {/* Reviewer Avatar */}
                <div
                  className={styles.reviewerAvatar}
                  style={{ 
                    background: (rev.user?.profileImage || rev.reviewerImage) ? "transparent" : AVATAR_COLORS[i % AVATAR_COLORS.length],
                    overflow: "hidden",
                    justifySelf: "center"
                  }}
                >
                  {(rev.user?.profileImage || rev.reviewerImage) ? (
                    <img 
                      src={rev.user?.profileImage || rev.reviewerImage} 
                      alt={name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    name[0]?.toUpperCase() || "C"
                  )}
                </div>

                {/* Customer Review Content */}
                <div className={styles.reviewerContent}>
                  <div className={styles.reviewCardTop}>
                    <div>
                      <p className={styles.reviewCardName}>
                        {name}
                        {rev.isVerified && (
                          <span className={styles.verifiedBadge} title="Verified Customer">
                            ✓ Verified
                          </span>
                        )}
                      </p>
                      <div className={styles.reviewCardMeta}>
                        <div className={styles.reviewCardStars}>
                          {Array.from({ length: 5 }).map((_, si) => {
                            let fillValue = 0;
                            if (rating >= si + 1) fillValue = 1;
                            else if (rating > si) fillValue = 0.5;
                            return <StarIcon key={si} fillValue={fillValue} />;
                          })}
                        </div>
                        <span className={styles.ratingNumber}>{rating}</span>
                        <span className={styles.reviewCardDate}>{dateStr}</span>
                        {rev.fromService && (
                          <span className={styles.fromServiceBadge}>
                            {rev.fromService}
                          </span>
                        )}
                        {rev.from && (
                          <span className={styles.fromPlatform}>
                            via {rev.from}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className={styles.moreBtn}>
                      <OptionsIcon />
                    </button>
                  </div>

                  {comment && <p className={styles.reviewCardText}>{comment}</p>}

                  {/* Pet Profile Details */}
                  {rev.petProfile && (() => {
                    const cleanPetPhoto = rev.petProfile.morePhotos?.[0];
                    const petPhotoUrl = cleanPetPhoto 
                      ? (cleanPetPhoto.startsWith("http") 
                          ? cleanPetPhoto 
                          : (IMAGE_URL.endsWith("/") 
                              ? `${IMAGE_URL}${cleanPetPhoto.startsWith("/") ? cleanPetPhoto.slice(1) : cleanPetPhoto}`
                              : `${IMAGE_URL}/${cleanPetPhoto.startsWith("/") ? cleanPetPhoto.slice(1) : cleanPetPhoto}`))
                      : null;
                    return (
                      <div className={styles.petProfileChip}>
                        <span className={styles.petLabel}>Pet:</span>
                        {petPhotoUrl && (
                          <img 
                            src={petPhotoUrl} 
                            alt={rev.petProfile.petName} 
                            className={styles.petAvatar}
                          />
                        )}
                        <span className={styles.petName}>
                          {rev.petProfile.petName} ({rev.petProfile.breed || rev.petProfile.petType})
                        </span>
                      </div>
                    );
                  })()}

                  {/* Review Gallery/Images if any */}
                  {rev.gallery && rev.gallery.length > 0 && (
                    <div className={styles.reviewGallery}>
                      {rev.gallery.map((img, idx) => (
                        <div key={idx} className={styles.galleryItem}>
                          <img src={img} alt={`review-img-${idx}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  {rev.images && rev.images.length > 0 && (
                    <div className={styles.reviewGallery}>
                      {rev.images.map((img, idx) => (
                        <div key={idx} className={styles.galleryItem}>
                          <img src={img} alt={`review-img-${idx}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply trigger button */}
                  {!hasReplyOrEditor && (
                    <button
                      className={styles.replyBtn}
                      onClick={() => handleStartReply(rev)}
                      disabled={submittingId !== null}
                    >
                      <ReplyIcon /> Reply
                    </button>
                  )}
                </div>

                {/* Reply Editor Form (New reply or Edit text area) */}
                {isReplyingThis && (
                  <>
                    <div className={styles.ownerAvatarContainer}>
                      <div className={styles.ownerAvatar}>
                        <OwnerIcon />
                      </div>
                    </div>

                    <div className={styles.ownerContent}>
                      <div className={styles.ownerHeader}>
                        <span className={styles.ownerLabel}>OWNER</span>
                        <span className={styles.replyTimeAgo} style={{ color: "#ff4d6a", fontWeight: "600" }}>
                          (JUST NOW)
                        </span>
                      </div>

                      <div className={styles.editorArea}>
                        <textarea
                          className={styles.replyTextarea}
                          value={replyCommentText}
                          onChange={(e) => setReplyCommentText(e.target.value)}
                          placeholder="Your Replay"
                          disabled={submittingId !== null}
                        />
                        <p className={styles.complianceText}>
                          PLEASE NOTE THAT YOUR REPLY WILL BE DISPLAYED <strong>PUBLICLY</strong> ON GOOGLE AND MUST COMPLY WITH GOOGLE'S LOCAL CONTENT POLICIES. <span className={styles.termsLink}>TERMS OF SERVICE</span>
                        </p>
                        <div className={styles.editorButtons}>
                          <button
                            className={styles.submitBtn}
                            onClick={() => handleSubmitReply(rev.reviewId)}
                            disabled={submittingId !== null}
                          >
                            {submittingId === rev.reviewId ? "Submitting..." : "Submit"}
                          </button>
                          <button
                            className={styles.cancelBtn}
                            onClick={handleCancelReply}
                            disabled={submittingId !== null}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Existing Replies List */}
                {repliesToShow.map((reply, ri) => (
                  <React.Fragment key={reply.replyId || ri}>
                    {/* Owner Avatar */}
                    <div className={styles.ownerAvatarContainer}>
                      <div className={styles.ownerAvatar}>
                        <OwnerIcon />
                      </div>
                    </div>

                    {/* Owner Content */}
                    <div className={styles.ownerContent}>
                      <div className={styles.ownerHeader}>
                        <span className={styles.ownerLabel}>OWNER</span>
                        <span className={styles.replyTimeAgo}>
                          ({reply.replyDate ? getRelativeTime(reply.replyDate) : "JUST NOW"})
                        </span>
                      </div>

                      <div className={styles.replyDisplayArea}>
                        <p className={styles.reviewCardText} style={{ fontWeight: "500", color: "#334155" }}>
                          {reply.replyComment}
                        </p>
                        <div className={styles.replyActions}>
                          {repliesList.length <= 1 && (
                            <button
                              className={styles.actionOutlineBtn}
                              onClick={() => handleStartReply(rev)}
                              disabled={submittingId !== null}
                            >
                              Replay
                            </button>
                          )}
                          <button
                            className={styles.actionOutlineBtn}
                            onClick={() => handleStartEdit({
                              reviewId: rev.reviewId,
                              replyComment: reply.replyComment,
                              replyId: reply.replyId
                            })}
                            disabled={submittingId !== null}
                          >
                            Edit
                          </button>
                          <button
                            className={`${styles.actionOutlineBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDeleteReply({
                              reviewId: rev.reviewId,
                              replyId: reply.replyId
                            })}
                            disabled={submittingId !== null}
                          >
                            {submittingId === rev.reviewId ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}

                {/* View More/Less Button */}
                {showViewMore && (
                  <>
                    <div />
                    <div className={styles.viewMoreContainer}>
                      <button
                        className={styles.viewMoreBtn}
                        onClick={() => toggleExpand(rev.reviewId)}
                      >
                        {isExpanded ? (
                          <>View Less <ChevronUpIcon /></>
                        ) : (
                          <>View More ({repliesList.length - 1} more) <ChevronDownIcon /></>
                        )}
                      </button>
                    </div>
                  </>
                )}



              </div>
            );
          })}
        </div>

        {/* ── Pagination Footer ── */}
        {totalItems > 0 && (
          <div className={styles.paginationBar}>
            <span>Rows per Page</span>
            <select
              className={styles.paginationSelect}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className={styles.paginationRange}>
              {startIndex + 1} - {endIndex} of {totalItems}
            </span>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </button>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
