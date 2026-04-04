import React, { useState, useEffect, useRef } from "react";  
  
  
  
  
  const SearchableDropdown = ({ options, value, onChange, placeholder, label, error, disabled, isMobile }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (e.target.value === "") {
      onChange("");
    }
  };

  const getDisplayValue = () => {
    if (isOpen) return searchTerm;
    return value || "";
  };

  return (
    <div style={{ width: isMobile ? "90%" : "48%", position: "relative" }} ref={dropdownRef}>
      <p>{label} <span style={{ color: "red" }}>*</span></p>
      {disabled ? (
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#f5f5f5", 
          border: "1px solid #e0e0e0",
          color: "#666"
        }}>
          {value}
        </div>
      ) : (
        <>
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={getDisplayValue()}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              placeholder={`Search or select ${placeholder}...`}
              style={{
                width: "90%",
                padding: "12px",
                paddingRight: "27px",
                border: "1px solid #d9d9d9",
                backgroundColor: "#fff",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer"
              }}
            />
            <span 
              onClick={() => setIsOpen(!isOpen)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "12px",
                color: "#666"
              }}
            >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
            </span>
          </div>
          
          {isOpen && filteredOptions.length > 0 && (
            <div style={{
              position: "absolute",
              left: 0,
              right: 0,
              backgroundColor: "#fff",
              border: "1px solid #d9d9d9",
              borderRadius: "8px",
              marginTop: "4px",
              maxHeight: "180px",
              overflowY: "auto",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}>
              {filteredOptions.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(option)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    backgroundColor: value === option ? "#f5f5f5" : "transparent",
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
          
          {isOpen && filteredOptions.length === 0 && searchTerm && (
            <div style={{
              position: "absolute",
              left: 0,
              right: 0,
              backgroundColor: "#fff",
              border: "1px solid #d9d9d9",
              borderRadius: "8px",
              marginTop: "4px",
              padding: "10px",
              textAlign: "center",
              color: "#999",
              fontSize: "14px",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}>
              No results found for "{searchTerm}"
            </div>
          )}
        </>
      )}
      {error && <span style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{error}</span>}
    </div>
  );
};
export default SearchableDropdown;