import React from "react";
import Head from "next/head";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/dashboard/legal.module.css";

export default function PrivacyPolicyPage() {
  return (
    <DashboardLayout>
      <Head>
        <title>Privacy Policy | Zaanvar Business</title>
      </Head>

      <div className={styles.pageContainer}>
        <div className={styles.legalCard}>
          <div className={styles.headerGroup}>
            <h1 className={styles.title}>Privacy &amp; Details</h1>
            <p className={styles.subtitle}>
              Zaanvar PetSales Vendor Privacy Policy
            </p>
          </div>

          <div className={styles.introBox}>
            We value your privacy at Zaanvar PetSales. This Vendor Privacy Policy describes the way we gather, process, and protect the data of vendors, breeders and partners that either register or communicate with our platform. Using or accessing PetSales (the &quot;Service&quot;), you accept the practices presented in this policy.
          </div>

          <h2 className={styles.sectionTitle}>INFORMATION WE COLLECT</h2>
          <p className={styles.paragraph}>
            The following are some of the types of information we may gather based on your usage of the PetSales Vendor Platform:
          </p>

          <h3 className={styles.subHeading}>Information You Provide Directly:</h3>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Vendor name, contact number, email, phone number and business address.</li>
            <li className={styles.bulletItem}>Government-issued license, certificates, or registration documents for compliance</li>
            <li className={styles.bulletItem}>Details about products or listing like pet breeds, health certificates, prices and availability.</li>
          </ul>

          <h3 className={styles.subHeading}>Account and Profile Data:</h3>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Login credentials, business profile, and store settings</li>
            <li className={styles.bulletItem}>Preferences for notifications, visibility, and communication</li>
          </ul>

          <h3 className={styles.subHeading}>Automatically Collected Information:</h3>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>IP address, device details, browser type, and access timestamps</li>
            <li className={styles.bulletItem}>Cookies or tracking data to improve platform experience and security</li>
          </ul>

          <h3 className={styles.subHeading}>Transaction and Operational Data:</h3>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Order and sales records</li>
            <li className={styles.bulletItem}>Communication logs between vendors, buyers, and support teams</li>
          </ul>

          <h2 className={styles.sectionTitle}>HOW WE USE YOUR INFORMATION</h2>
          <p className={styles.paragraph}>We may use the collected data to:</p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Review and maintain accounts and listing of vendors.</li>
            <li className={styles.bulletItem}>Communicate order updates, buyer inquiries, and operational alerts</li>
            <li className={styles.bulletItem}>Offer analytics, insights and tools to enhance sales performance.</li>
            <li className={styles.bulletItem}>Identify, avert, and scrutinize fraud, infractions of policy or criminal activity.</li>
            <li className={styles.bulletItem}>Set standards on animal welfare, e-commerce and regulatory standards.</li>
            <li className={styles.bulletItem}>Increase overall functionality, security and reliability of the service PetSales.</li>
          </ul>

          <h2 className={styles.sectionTitle}>HOW WE SHARE INFORMATION</h2>
          <p className={styles.paragraph}>
            Your data may be shared with trusted third parties in the following cases:
          </p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Service Providers:</span> Logistics partners, payment gateways, cloud hosting, analytics, and technical support providers who assist in platform operations
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Buyers:</span> Certain contact or listing information may be shared with verified buyers to enable communication and order fulfillment
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Affiliates and Partners:</span> Business partners or group companies supporting marketplace services or compliance functions
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Legal or Regulatory Authorities:</span> When required to comply with applicable laws, enforce platform policies, or respond to lawful requests
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.boldLabel}>Business Restructuring:</span> In case of mergers, acquisitions, or corporate restructuring
            </li>
          </ul>
          <p className={styles.paragraph}>
            <em>We do not sell or rent vendor data to advertisers or unrelated third parties.</em>
          </p>

          <h2 className={styles.sectionTitle}>NOTIFICATIONS</h2>
          <p className={styles.paragraph}>
            We may send in-app messages, emails, or push notifications related to:
          </p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Account verification and approval updates</li>
            <li className={styles.bulletItem}>Policy updates, operational notices, and performance reports</li>
          </ul>
          <p className={styles.paragraph}>
            You can manage or disable notifications from your vendor dashboard or device settings. However, certain critical alerts (e.g., security warnings) may still be delivered as they are essential to your business account.
          </p>

          <h2 className={styles.sectionTitle}>LOCATION DATA</h2>
          <p className={styles.paragraph}>
            If you enable location-based features, we may collect and use your location data to:
          </p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Match listings to nearby buyers or service areas</li>
            <li className={styles.bulletItem}>Improve accuracy of delivery, logistics, or service recommendations</li>
          </ul>
          <p className={styles.paragraph}>
            You can manage or disable location permissions through your device settings. Disabling location access may limit certain features (like local buyer visibility or regional promotions).
          </p>

          <h2 className={styles.sectionTitle}>YOUR RIGHTS</h2>
          <p className={styles.paragraph}>As a registered vendor, you have the right to:</p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Access, update, or correct your business information</li>
            <li className={styles.bulletItem}>Request deletion of your account or data, subject to legal and transactional obligations</li>
            <li className={styles.bulletItem}>Manage preferences for marketing, communication, and notifications</li>
            <li className={styles.bulletItem}>Withdraw consent where processing is based on consent (e.g., promotional messages)</li>
          </ul>
          <p className={styles.paragraph}>
            To exercise these rights, contact our support team as outlined below.
          </p>

          <h2 className={styles.sectionTitle}>DATA PROTECTION</h2>
          <p className={styles.paragraph}>
            We use a combination of technical, organizational, and administrative measures to protect vendor data from unauthorized access, alteration, loss, or misuse. These include encryption, secure storage, limited access, and regular system monitoring.
          </p>
          <p className={styles.paragraph}>
            While we implement strong safeguards, no online platform can guarantee absolute security. Vendors are encouraged to protect their account credentials and report any suspicious activity immediately.
          </p>

          <h2 className={styles.sectionTitle}>USE BY MINORS</h2>
          <p className={styles.paragraph}>
            The PetSales Vendor Platform is intended only for individuals and businesses legally eligible to engage in commercial activities. It is not directed at minors or individuals under 18 years of age. We do not knowingly collect or retain data from such individuals.
          </p>

          <h2 className={styles.sectionTitle}>POLICY UPDATES</h2>
          <p className={styles.paragraph}>
            This Privacy Policy may be revised periodically to reflect changes in business operations, legal requirements, or technological advancements. Updates will be posted on this page, and significant changes will be highlighted. Vendors are encouraged to review this policy periodically.
          </p>

          <h3 className={styles.sectionTitle}>CONTACT US</h3>
          <p className={styles.paragraph} >
            If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please reach out to:{" "}
            <a href="mailto:support@zaanvar.com" className={styles.contactLink}>
              support@zaanvar.com
            </a>
          </p>

        </div>
      </div>
    </DashboardLayout>
  );
}
