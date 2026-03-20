import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/Utilities/SearchableCountryCode.module.css";

const SearchableCountryCode = ({ countries, selectedCode, onSelect, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown on outside click amaize!
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when opened amaize!
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredCountries = countries.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.dialCode || c.code).includes(searchTerm)
    );

    const selectedCountry = countries.find(c => c.code === selectedCode);
    const displayValue = selectedCountry?.dialCode || selectedCode;

    const handleToggle = () => setIsOpen(!isOpen);

    const handleSelect = (code) => {
        onSelect(code);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`${styles.Container} ${className}`} ref={dropdownRef}>
            <div className={styles.SelectedLabel} onClick={handleToggle}>
                {displayValue}
                <span className={`${styles.Arrow} ${isOpen ? styles.ArrowOpen : ""}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className={styles.Dropdown}>
                    <div className={styles.SearchWrapper}>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search country..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.SearchInput}
                        />
                    </div>
                    <ul className={styles.List}>
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((c, idx) => (
                                <li
                                    key={`${c.code}-${idx}`}
                                    className={`${styles.ListItem} ${selectedCode === c.code ? styles.Active : ""}`}
                                    onClick={() => handleSelect(c.code)}
                                >
                                    <span className={styles.CountryName}>{c.name}</span>
                                    <span className={styles.CountryCode}>{c.dialCode || c.code}</span>
                                </li>
                            ))
                        ) : (
                            <li className={styles.NoResult}>No country found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableCountryCode;
