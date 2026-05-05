
import React from 'react';
import styles from '../../styles/utilities/empty-state.module.css';
import { FiPlus } from 'react-icons/fi';

const EmptyState = ({ message, buttonText, onAddClick }) => {
    return (
        <div className={styles.emptyStateContainer}>
            <img 
                src="https://zaanvarprods3.b-cdn.net/media/1777954906495-Product_List (2).png" 
                alt="No Data" 
                className={styles.emptyImage}
            />
            {buttonText && (
                <button className={styles.addButton} onClick={onAddClick}>
                    <FiPlus />
                    {buttonText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
