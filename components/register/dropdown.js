import React, { useState, useEffect } from "react";
// import styles from "../../styles/ui.module.css";
import styles from "../../styles/register/ui.module.css"

const DropDownv1 = ({
  question,
  options,
  width = "45%",
  backgroundColor = "rgba(243, 243, 243, 0.50)",
  value,
  onChange,
  CustomInputElementAddpet,
  error,
  Customdropdown,
  customFlex,
  custommarrgin,
  disabled,
  custompadding,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 660px)");

    // Update state based on the initial value
    setIsSmallScreen(mediaQuery.matches);

    // Add a listener to update state on resize
    const handleMediaChange = (e) => {
      setIsSmallScreen(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const dynamicStyle = {
    flex:
      customFlex || (!Customdropdown && width === "45%" ? `1 1 ${width}` : ""),
    width: isSmallScreen ? "100%" : Customdropdown ? Customdropdown : width,
  };

  const handleChange = (e) => {
    if (onChange && !disabled) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={styles.DropDownV1Div} style={dynamicStyle}>
      <p
        style={{
          color: CustomInputElementAddpet?.color,
          marginBottom: custommarrgin?.marginBottom,
          paddingBottom: custompadding?.paddingBottom,
        }}
      >
        {question.split("*").map((part, index, arr) => (
          <React.Fragment key={index}>
            {part}
            {index < arr.length - 1 && (
              <span style={{ color: "red", fontSize: "17px" }}>*</span>
            )}
          </React.Fragment>
        ))}
      </p>
      <div style={{ position: "relative", width: "100%" }}>
        <select
          style={{
            backgroundColor: backgroundColor,
            width: "100%",
            border: "1px solid rgb(217, 217, 217)",
            padding: "10px",
            paddingRight: "40px",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            marginTop: custommarrgin?.marginTop,
          }}
          value={disabled ? "Disabled" : value}
          onChange={handleChange}
          disabled={disabled}
        >
          {[...new Set(options)]?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div 
          style={{ 
            position: "absolute", 
            right: "15px", 
            top: "50%", 
            transform: "translateY(-50%)", 
            pointerEvents: "none",
            color: "#666",
            fontSize: "12px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {(value === "select" || value === "") && error && (
        <span
          style={{
            color: "red",
            fontSize: "0.875rem",
            marginTop: "5px",
            display: "block"
          }}
        >
          {error}
        </span>
      )}
    </div>

  );
};

export default DropDownv1;
