import React from 'react';
import styles from '../../styles/utilities/loader.module.css';

const Loader = ({ message = "Loading reports..." }) => {
    return (
        <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loaderText}>{message}</p>
        </div>
    );
};

export default Loader;
