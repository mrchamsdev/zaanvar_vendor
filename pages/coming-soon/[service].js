import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";

const LOGO_URL =
  "https://zaanvarprods3.b-cdn.net/media/1773901732776-zaanvarbusinesslogo.svg";

/* ── Service metadata ── */
const SERVICE_INFO = {
  training: { label: "Training", sub: "Expert pet training sessions tailored to every breed and age — from basic obedience to advanced behavioural correction. Our certified trainers work closely with you and your pet to build confidence, communication, and a lasting bond." },
  breeders: { label: "Breeders", sub: "Connect with trusted, ethical breeders who prioritise health, care, and transparency. Whether you are looking to adopt, partner, or grow your kennel, we bring responsible breeding to your fingertips." },
  mating: { label: "Mating", sub: "Find the perfect genetic match for your pet through our safe, ethical, and transparent mating network. Every pairing is guided by health standards and breed excellence." },
  clinic: { label: "Clinic", sub: "Access top-tier veterinary care — from routine check-ups and vaccinations to advanced diagnostics and surgery. Compassionate, professional vets ready to keep your pet healthy at every stage of life." },
  grooming: { label: "Grooming", sub: "Professional grooming for every breed — bathing, trimming, nail clipping, and full hygiene care by certified groomers. Keeping your pet fresh, clean, and confident after every visit." },
  "blood-bank": { label: "Blood Bank", sub: "Life-saving blood resources for pets in critical need. Register your pet as a donor or locate certified blood banks near you. Together we build a community that saves lives, one drop at a time." },
  "day-care": { label: "Day Care", sub: "A safe, loving, and stimulating environment for your pet while you're away. Supervised play, rest, and socialisation by trained professionals — your pet will love every moment." },
  location: { label: "Location", sub: "Discover the best pet services near you with our smart location-based search. Vets, groomers, trainers, and stores — all just a few taps away, wherever you are." },
  events: { label: "Events", sub: "Stay connected with pet shows, adoption drives, workshops, and community events in your area. Meet fellow pet lovers, share knowledge, and celebrate the joy of pets together." },
};

export default function ComingSoonPage() {
  const router = useRouter();
  const service = (router.query?.service || "").toLowerCase();
  const info = SERVICE_INFO[service] || {
    label: service.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    sub: "We are working hard to bring this feature to you. Stay tuned for updates!",
  };

  return (
    <>
      <Head>
        <title>{info.label} | Coming Soon — Zaanvar</title>
        <meta name="description" content={info.sub} />
      </Head>

      <div style={wrap}>
        {/* Logo */}
        <div style={{ marginBottom: "clamp(24px,4vh,48px)", cursor: "pointer" }} onClick={() => router.push("/")}>
          <Image
            src={LOGO_URL}
            alt="Zaanvar Business"
            width={200}
            height={70}
            priority
            style={{ width: "clamp(140px,16vw,220px)", height: "auto" }}
          />
        </div>

        {/* Coming Soon badge */}
        <span style={badge}>Coming Soon</span>

        {/* Service name */}
        <h1 style={heading}>{info.label}</h1>

        {/* Readable sub-text */}
        <p style={subText}>{info.sub}</p>

        {/* Divider */}
        <div style={divider} />

        {/* CTA */}
        <p style={ctaText}>
          Be the first to know when we launch — register your pet business today.
        </p>

        <div style={{ display: "flex", gap: "clamp(10px,1.2vw,16px)", flexWrap: "wrap", justifyContent: "center" }}>
          <button style={btnPrimary} onClick={() => router.push("/contact-us")}>
            Register Now
          </button>
          <button style={btnOutline} onClick={() => router.back()}>
            ← Go Back
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Inline styles ── */
const wrap = {
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "clamp(24px,5vw,80px) clamp(16px,4vw,60px)",
  background: "linear-gradient(135deg, #fdf6ee 0%, #fff 100%)",
};

const badge = {
  display: "inline-block",
  background: "#fff3e0",
  color: "#f5790c",
  fontWeight: 700,
  fontSize: "clamp(11px,1vw,13px)",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "6px 16px",
  borderRadius: "999px",
  marginBottom: "clamp(12px,2vh,20px)",
  border: "1px solid #ffd5a8",
};

const heading = {
  fontSize: "clamp(28px,5vw,56px)",
  fontWeight: 800,
  color: "#1a1a1a",
  margin: "0 0 clamp(12px,2vh,20px)",
  lineHeight: 1.15,
};

const subText = {
  fontSize: "clamp(14px,1.3vw,18px)",
  color: "#555",
  maxWidth: "clamp(280px,55vw,640px)",
  lineHeight: 1.75,
  margin: "0 auto clamp(20px,3vh,36px)",
};

const divider = {
  width: "clamp(40px,6vw,80px)",
  height: 3,
  background: "linear-gradient(90deg,#f5790c,#ff9f4a)",
  borderRadius: 4,
  margin: "0 auto clamp(20px,3vh,36px)",
};

const ctaText = {
  fontSize: "clamp(13px,1.1vw,16px)",
  color: "#888",
  marginBottom: "clamp(16px,2.5vh,28px)",
};

const btnPrimary = {
  padding: "clamp(10px,1.2vh,14px) clamp(22px,2.5vw,36px)",
  background: "#f5790c",
  color: "#fff",
  border: "none",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "clamp(13px,1.1vw,16px)",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const btnOutline = {
  padding: "clamp(10px,1.2vh,14px) clamp(22px,2.5vw,36px)",
  background: "transparent",
  color: "#f5790c",
  border: "2px solid #f5790c",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "clamp(13px,1.1vw,16px)",
  cursor: "pointer",
  transition: "opacity 0.2s",
};
