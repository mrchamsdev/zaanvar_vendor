import React, { useState } from 'react'
// import styles from '../../styles/about/FAQ.module.css'
import styles from "../../styles/about/faq.module.css"
import { Max, Min } from '@/public/image/SVG';
// import { AboutMinus, AboutPluse } from '@/public/images/SVG';

const FAQ = ({filter}) => {
    const [openId, setOpenId] = useState(null);
    let FAQData;

    if (filter !== "lostandfound") {
        FAQData = [
            {
                id: 1,
                question: 'How can I adopt a pet through Zaanvar ?',
                answer: 'You can explore available pets on our platform and submit an adoption application. Our team will guide you through the process to ensure the pet finds the right home.'
            },
            {
                id: 2,
                question: 'How does the Pet Blood Bank service work?',
                answer: 'Register your pet as a donor or request assistance for emergencies.'
            },
            {
                id: 3,
                question: 'What is Pet Matchmaking?',
                answer: 'Create a pet profile to find compatible companions.'
            },
            {
                id: 4,
                question: 'How do you ensure adoption quality?',
                answer: 'Through interviews, checks, and ensuring a safe home for every pet.'
            },
            {
                id: 5,
                question: 'How can I contact Zaanvar for support?',
                answer: 'Through our contact form or social media channels.'
            }
        ];
    } else {
        FAQData = [
            {
                id: 1,
                question: 'How to look for a lost pet immediately?',
                answer: 'Start immediately—search your area, alert neighbors, and post in local groups. Use platforms like Zaanvar’s lost and found pets database to increase visibility, especially for Hyderabad lost and found pets.'
            },
            {
                id: 2,
                question: 'Can you track a pet with a microchip?',
                answer: 'No, microchips aren’t GPS trackers. But if your lost pet is found and scanned, the chip links to your contact info—so always keep it updated.'
            },
            {
                id: 3,
                question: 'What happens to most lost pets in India?',
                answer: 'Many pets never make it home due to a lack of awareness and proper systems. That’s why platforms like Zaanvar’s lost and found pets near me are vital to improve reunions, especially in cities like Hyderabad.'
            },
            {
                id: 4,
                question: 'What happens if I lose my dog or cat?',
                answer: `Take immediate action by looking in the area, posting a report on Zaanvar's lost and found pets website, notifying nearby shelters, and sharing the information on social media. Timing is crucial.`
            },
            {
                id: 5,
                question: 'How to prevent a pet from getting lost?',
                answer: 'Keep pets indoors or on a leash, use ID tags, and register their microchip. Train basic recall commands and know where to report on lost and found pets near me if needed.'
            }
        ];
    }
    

    const handleToggle = (id) => {
        setOpenId(openId === id ? null : id);
    }

    return (
        <div className={styles.faqContainer}>
            <h5 className={styles.faqTitle}>{filter!=="lostandfound"? "Frequently Asked Questions":"Zaanvar’s Lost And Found Pet Services - Frequently Asked Questions"}</h5>
            <div className={styles.faqGrid}>
                {FAQData.map((faq) => (
                    <div key={faq.id} className={styles.faqCard}>
                        <div 
                            className={styles.faqHeader}
                            onClick={() => handleToggle(faq.id)}
                        >
                            <h3 className={styles.question}>{faq.question}</h3>
                            <div className={styles.iconWrapper}>
                                {openId === faq.id ? <Min /> : <Max />}
                            </div>

                        </div>
                        {openId === faq.id && (
                            <div className={styles.answer}>
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FAQ