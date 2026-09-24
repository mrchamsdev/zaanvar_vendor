import React, { useState } from "react";
import Head from "next/head";
import useStore from "@/components/state/useStore";
import RegisterBusinessModal from "@/components/RegisterBusinessModal";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function RegisterPage() {
  const { userInfo } = useStore();
  const [open, setOpen] = useState(true);

  return (
    <>
      <Head>
        <title>Register Your Business - Zaanvar</title>
      </Head>
      <DashboardLayout>
        <RegisterBusinessModal
          open={open}
          onClose={() => setOpen(false)}
          userInfo={userInfo}
        />
      </DashboardLayout>
    </>
  );
}