import React, { useState } from "react";
import Head from "next/head";
import Header from "@/components/header/header";
import useStore from "@/components/state/useStore";
import RegisterBusinessModal from "@/components/RegisterBusinessModal";

export default function RegisterPage() {
  const { userInfo } = useStore();
  const [open, setOpen] = useState(true);

  return (
    <>
      <Head>
        <title>Register Your Business - Zaanvar</title>
      </Head>
      <Header />
      <div style={{ minHeight: "calc(100vh - 70px)", background: "#f8fafc", padding: "24px 0" }}>
        <RegisterBusinessModal
          open={open}
          onClose={() => setOpen(false)}
          userInfo={userInfo}
        />
      </div>
    </>
  );
}