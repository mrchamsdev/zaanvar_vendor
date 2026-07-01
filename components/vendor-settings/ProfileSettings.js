import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";
import profileStyles from "../../styles/vendor-settings/profileSettings.module.css";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import { toast } from "sonner";

/* ── Icons ── */
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const ForgotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ── PIN input row ── */
const PinRow = ({ label, value, onChange, placeholder = "● ● ● ●" }) => {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = (value || "").padEnd(4, "").split("").slice(0, 4);

  const handleChange = (idx, e) => {
    const digit = e.target.value.replace(/\D/, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    onChange(next.join("").trimEnd());
    if (digit && idx < 3) refs[idx + 1].current?.focus();
  };
  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx]?.trim() && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  return (
    <div className={profileStyles.pinGroup}>
      <label className={profileStyles.pinLabel}>{label}</label>
      <div className={profileStyles.pinInputRow}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            className={profileStyles.pinDigit}
            value={d.trim()}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            id={`${label.replace(/\s/g, "-").toLowerCase()}-digit-${i}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Read-only field ── */
const ReadField = ({ label, value, half }) => (
  <div className={`${profileStyles.fieldBox} ${half ? profileStyles.fieldBoxHalf : ""}`}>
    <label className={profileStyles.fieldLabel}>{label}</label>
    <div className={profileStyles.fieldValue}>{value || ""}</div>
  </div>
);

/* ── Editable field ── */
const EditField = ({ label, value, onChange, placeholder, half, required }) => (
  <div className={`${profileStyles.fieldBox} ${half ? profileStyles.fieldBoxHalf : ""}`}>
    <label className={profileStyles.fieldLabel}>
      {label}{required && <span style={{ color: "#e9315d" }}> *</span>}
    </label>
    <input
      className={profileStyles.fieldInput}
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || label}
    />
  </div>
);

/* ══════════════════════════════════════════════════════
 * ProfileSettings Component
 * ════════════════════════════════════════════════════ */
const ProfileSettings = () => {
  const { jwtToken, userInfo } = useStore();
  const webApi = new WebApimanager(jwtToken);

  /* ── State: Profile Details ── */
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    experience: "",
  });
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── State: Address Details ── */
  const [address, setAddress] = useState({
    country: "",
    state: "",
    city: "",
    pinCode: "",
    areaStreet: "",
    flatHouseNo: "",
  });
  const [editAddress, setEditAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  /* ── State: Password ── */
  // mode: "view" | "change" | "forgot"
  const [pwMode, setPwMode] = useState("view");
  const [pwLastUpdated, setPwLastUpdated] = useState("22 May 2026");
  const [currentPw, setCurrentPw] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  /* ── Populate from userInfo ── */
  useEffect(() => {
    if (!userInfo) return;
    const v = userInfo;
    setProfile({
      name: `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.name || "",
      phone: v.phoneNumber || v.phone || "",
      email: v.email || "",
      experience: v.experience || v.yearsOfExperience || "",
    });
    const addr = v.address || v.addresses?.[0] || {};
    setAddress({
      country: addr.country || "India",
      state: addr.state || "",
      city: addr.city || "",
      pinCode: addr.pincode || addr.pinCode || "",
      areaStreet: addr.area || addr.areaStreet || "",
      flatHouseNo: addr.flatNo || addr.flatHouseNo || "",
    });
  }, [userInfo]);

  /* ── Save Profile ── */
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const nameParts = profile.name.trim().split(" ");
      const payload = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phoneNumber: profile.phone,
        email: profile.email,
        experience: profile.experience,
      };
      await webApi.put("users/updateProfile", payload);
      toast.success("Profile updated successfully!");
      setEditProfile(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Save Address ── */
  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const payload = {
        country: address.country,
        state: address.state,
        city: address.city,
        pincode: address.pinCode,
        area: address.areaStreet,
        flatNo: address.flatHouseNo,
      };
      await webApi.put("users/updateAddress", payload);
      toast.success("Address updated successfully!");
      setEditAddress(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update address.");
    } finally {
      setSavingAddress(false);
    }
  };

  /* ── Save Password ── */
  const handleSavePassword = async () => {
    if (newPw.length < 4) { toast.error("Password must be at least 4 digits."); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match."); return; }

    setSavingPw(true);
    try {
      let payload;
      if (pwMode === "change") {
        if (!currentPw || currentPw.length < 4) { toast.error("Enter current password."); setSavingPw(false); return; }
        payload = { currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw };
        await webApi.put("users/changePassword", payload);
      } else {
        // forgot — OTP flow
        payload = { otp, newPassword: newPw, confirmPassword: confirmPw };
        await webApi.put("users/resetPasswordWithOtp", payload);
      }
      toast.success("Password saved successfully!");
      setPwMode("view");
      setCurrentPw(""); setOtp(""); setNewPw(""); setConfirmPw("");
      const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      setPwLastUpdated(today);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save password.");
    } finally {
      setSavingPw(false);
    }
  };

  /* ── Request OTP ── */
  const handleForgotPassword = async () => {
    try {
      await webApi.post("users/sendOtp", { email: profile.email });
      toast.success("OTP sent to your email!");
      setPwMode("forgot");
    } catch (e) {
      toast.error("Could not send OTP.");
    }
  };

  const cancelPassword = () => {
    setPwMode("view");
    setCurrentPw(""); setOtp(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <div className={profileStyles.wrap}>

      {/* ══ Profile Details ══ */}
      <section className={profileStyles.section}>
        <div className={profileStyles.sectionHeader}>
          <div>
            <h2 className={profileStyles.sectionTitle}>Profile Details</h2>
            <p className={profileStyles.sectionSub}>
              Manage your personal information, contact details, and account preferences from one place.
            </p>
          </div>
          {!editProfile ? (
            <button
              className={profileStyles.editBtn}
              onClick={() => setEditProfile(true)}
              id="edit-profile-btn"
            >
              <EditIcon /> Edit Profile
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={profileStyles.cancelBtn}
                onClick={() => setEditProfile(false)}
              >
                Cancel
              </button>
              <button
                className={profileStyles.saveProfileBtn}
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                <SaveIcon /> {savingProfile ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className={profileStyles.fieldGrid}>
          {editProfile ? (
            <>
              <EditField label="Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} half />
              <EditField label="Phone Number" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} half />
              <EditField label="Mail Id" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} half />
              <EditField label="Experience" value={profile.experience} onChange={(v) => setProfile({ ...profile, experience: v })} half placeholder="e.g. 02 Years" />
            </>
          ) : (
            <>
              <ReadField label="Name" value={profile.name || (userInfo ? `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim() : "Admin ID")} half />
              <ReadField label="Phone Number" value={profile.phone || "+91 9874583134"} half />
              <ReadField label="Mail Id" value={profile.email || "admin123@gmail.com"} half />
              <ReadField label="Experience" value={profile.experience || "02 Years"} half />
            </>
          )}
        </div>
      </section>

      {/* ══ Address Details ══ */}
      <section className={profileStyles.section}>
        <div className={profileStyles.sectionHeader}>
          <h2 className={profileStyles.sectionTitle}>Address Details</h2>
          {!editAddress ? (
            <button
              className={profileStyles.editBtn}
              onClick={() => setEditAddress(true)}
              id="edit-address-btn"
            >
              <EditIcon /> Edit Address
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button className={profileStyles.cancelBtn} onClick={() => setEditAddress(false)}>
                Cancel
              </button>
              <button
                className={profileStyles.saveProfileBtn}
                onClick={handleSaveAddress}
                disabled={savingAddress}
              >
                <SaveIcon /> {savingAddress ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className={profileStyles.fieldGrid}>
          {editAddress ? (
            <>
              <EditField label="Country" value={address.country} onChange={(v) => setAddress({ ...address, country: v })} half required />
              <EditField label="State" value={address.state} onChange={(v) => setAddress({ ...address, state: v })} half />
              <EditField label="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} half />
              <EditField label="Pin Code" value={address.pinCode} onChange={(v) => setAddress({ ...address, pinCode: v })} half />
              <EditField label="Area, Street" value={address.areaStreet} onChange={(v) => setAddress({ ...address, areaStreet: v })} half />
              <EditField label="Flat/House no." value={address.flatHouseNo} onChange={(v) => setAddress({ ...address, flatHouseNo: v })} half />
            </>
          ) : (
            <>
              <ReadField label="Country *" value={address.country || "India"} half />
              <ReadField label="State" value={address.state || "Telangana"} half />
              <ReadField label="City" value={address.city || "Hyderabad"} half />
              <ReadField label="Pin Code" value={address.pinCode || "500085"} half />
              <ReadField label="Area, Street" value={address.areaStreet || "KPHB Colony"} half />
              <ReadField label="Flat/House no." value={address.flatHouseNo || "Pragathi Enclave flat No. 101"} half />
            </>
          )}
        </div>
      </section>

      {/* ══ Password Settings ══ */}
      <section className={profileStyles.section}>
        <h2 className={profileStyles.sectionTitle}>Password Settings</h2>

        {/* Last updated row */}
        <div className={profileStyles.pwLastRow}>
          <span className={profileStyles.pwLastText}>
            <LockIcon />
            Password was Updated on : {pwLastUpdated}
          </span>
          {pwMode === "view" && (
            <button
              className={profileStyles.editBtn}
              onClick={() => setPwMode("change")}
              id="change-password-btn"
            >
              <EditIcon /> Change Password
            </button>
          )}
        </div>

        {/* Change Password mode */}
        {pwMode === "change" && (
          <div className={profileStyles.pwForm}>
            <PinRow label="Enter Current Password" value={currentPw} onChange={setCurrentPw} />
            <div className={profileStyles.pwTwoCol}>
              <PinRow label="Enter New Password" value={newPw} onChange={setNewPw} />
              <PinRow label="Enter Confirm Password" value={confirmPw} onChange={setConfirmPw} />
            </div>
            <div className={profileStyles.pwActions}>
              <button
                className={profileStyles.forgotBtn}
                type="button"
                onClick={handleForgotPassword}
                id="forgot-password-btn"
              >
                <ForgotIcon /> Forgot Password
              </button>
              <button
                className={profileStyles.savePwBtn}
                type="button"
                onClick={handleSavePassword}
                disabled={savingPw}
                id="save-password-btn"
              >
                <SaveIcon /> {savingPw ? "Saving…" : "Save Password"}
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password / OTP mode */}
        {pwMode === "forgot" && (
          <div className={profileStyles.pwForm}>
            <PinRow label="Enter OTP" value={otp} onChange={setOtp} />
            <div className={profileStyles.pwTwoCol}>
              <PinRow label="Enter New Password" value={newPw} onChange={setNewPw} />
              <PinRow label="Enter Confirm Password" value={confirmPw} onChange={setConfirmPw} />
            </div>
            <div className={profileStyles.pwActions}>
              <button
                className={profileStyles.cancelBtn}
                type="button"
                onClick={cancelPassword}
              >
                Cancel
              </button>
              <button
                className={profileStyles.savePwBtn}
                type="button"
                onClick={handleSavePassword}
                disabled={savingPw}
              >
                <SaveIcon /> {savingPw ? "Saving…" : "Save Password"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfileSettings;
