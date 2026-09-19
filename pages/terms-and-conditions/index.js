import React from "react";
import Head from "next/head";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/dashboard/legal.module.css";

export default function TermsAndConditionsPage() {
  return (
    <DashboardLayout>
      <Head>
        <title>Terms &amp; Conditions | Zaanvar Business</title>
      </Head>

      <div className={styles.pageContainer}>
        <div className={styles.legalCard}>
          <div className={styles.headerGroup}>
            <h1 className={styles.title}>Terms &amp; Conditions</h1>
            <p className={styles.subtitle}>
              Vendor &amp; Partner Legal Policies &amp; Documentation &bull; Mrchams Services Private Limited
            </p>
          </div>

          <h2 className={styles.sectionTitle}>1. Introduction</h2>
          <p className={styles.paragraph}>
            Welcome to Zaanvar. By accessing or using our website and services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
          </p>

          <h2 className={styles.sectionTitle}>2. Services Offered</h2>
          <p className={styles.paragraph}>
            Zaanvar provides a comprehensive range of pet-related services, including but not limited to:
          </p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Pet Grooming</li>
            <li className={styles.bulletItem}>Pet Hospitals</li>
            <li className={styles.bulletItem}>Pet Essentials</li>
            <li className={styles.bulletItem}>Pet Boarding</li>
            <li className={styles.bulletItem}>Pet Daycare</li>
            <li className={styles.bulletItem}>Pet Cremation</li>
            <li className={styles.bulletItem}>Pet Blood Bank</li>
            <li className={styles.bulletItem}>Pet Matchmaking</li>
            <li className={styles.bulletItem}>Lost and Found</li>
            <li className={styles.bulletItem}>Pet Training Courses</li>
            <li className={styles.bulletItem}>Pet Breeding</li>
            <li className={styles.bulletItem}>Pet Walker Services</li>
            <li className={styles.bulletItem}>Pet News Updates</li>
          </ul>

          <h2 className={styles.sectionTitle}>3. User Responsibilities</h2>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Account Creation:</span> You are responsible for maintaining the confidentiality of your account information and credentials.
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Accurate Information:</span> Provide accurate and up-to-date details while using our services and platform features.
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Compliance:</span> Follow all applicable animal welfare, statutory, and regulatory laws.
            </li>
          </ul>

          <h2 className={styles.sectionTitle}>4. Service Providers</h2>
          <p className={styles.paragraph}>
            Zaanvar works with third-party providers. We are not liable for their actions, omissions, or independent conduct.
          </p>

          <h2 className={styles.sectionTitle}>5. Payments and Refunds</h2>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Payments must be made through approved official payment channels.</li>
            <li className={styles.bulletItem}>Refund policies vary per service. Check specific booking and service terms before completing transactions.</li>
          </ul>

          <h2 className={styles.sectionTitle}>6. Content</h2>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>User-Generated Content:</span> You grant Zaanvar a non-exclusive license to use, host, and display your submitted content for service operation.
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Prohibited Content:</span> No unlawful, defamatory, deceptive, or infringing content is permitted on the platform.
            </li>
          </ul>

          <h2 className={styles.sectionTitle}>7. Privacy</h2>
          <p className={styles.paragraph}>
            By using Zaanvar, you agree to the collection, processing, and practices set out in our Privacy Policy.
          </p>

          <h2 className={styles.sectionTitle}>8. Governing Law &amp; Liability</h2>
          <p className={styles.paragraph}>
            Zaanvar&apos;s liability is strictly limited to the amount paid by the user or business for the specific service requested.
          </p>

          <h2 className={styles.sectionTitle}>9. Termination</h2>
          <p className={styles.paragraph}>
            We reserve the right to suspend or terminate access to services without prior notice if these terms are violated or if fraudulent activity is detected.
          </p>


        </div>
      </div>
    </DashboardLayout>
  );
}
