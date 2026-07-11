import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/utilities/SearchableCountryCode.module.css";

const SearchableSelect = ({ options, value, onChange, placeholder = "Select...", disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : (value || placeholder);

    const handleToggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={styles.Container} ref={dropdownRef} style={{ width: '100%', display: 'block', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            <div className={styles.SelectedLabel} onClick={handleToggle} style={{ width: '100%', padding: '12px', border: '1px solid #eee', borderRadius: '6px', boxSizing: 'border-box', background: '#fcfcfc', fontSize: '14px', color: '#1a1a1a' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '90%' }}>{displayValue}</span>
                <span className={`${styles.Arrow} ${isOpen ? styles.ArrowOpen : ""}`} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className={styles.Dropdown} style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', marginTop: '4px', zIndex: 100, position: 'absolute', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div className={styles.SearchWrapper} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.SearchInput}
                            style={{ width: '100%', padding: '6px', border: '1px solid #eee', borderRadius: '4px', outline: 'none' }}
                        />
                    </div>
                    <ul className={styles.List} style={{ maxHeight: '200px', overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => (
                                <li
                                    key={`${opt.value}-${idx}`}
                                    className={`${styles.ListItem} ${value === opt.value ? styles.Active : ""}`}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #fafafa' }}
                                >
                                    {opt.label}
                                </li>
                            ))
                        ) : (
                            <li style={{ padding: '8px 12px', color: '#999', fontSize: '14px' }}>No results found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
