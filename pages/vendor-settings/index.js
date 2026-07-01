import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import VendorSettingsLayout from "../../components/vendor-settings/VendorSettingsLayout";
import GeneralSettings from "../../components/vendor-settings/GeneralSettings";
import TransactionSettings from "../../components/vendor-settings/TransactionSettings";
import TaxesGSTSettings from "../../components/vendor-settings/TaxesGSTSettings";
import TransactionMessageSettings from "../../components/vendor-settings/TransactionMessageSettings";
import SupplierCustomerSettings from "../../components/vendor-settings/SupplierCustomerSettings";
import ItemSettings from "../../components/vendor-settings/ItemSettings";
import ProfileSettings from "../../components/vendor-settings/ProfileSettings";
import {
  getSettings,
  createSettings,
  updateSettings,
  DEFAULT_SETTINGS,
} from "../../services/settingsService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";

export default function VendorSettingsPage() {
  const router = useRouter();
  const { jwtToken, userInfo } = useStore();
  const { branchId } = useDashboardData({ skipReviews: true });

  /* ── Active tab from URL query ── */
  const activeTab = (router.query.tab || "General");

  /* ── Settings state ── */
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasExisting, setHasExisting] = useState(false); // track POST vs PUT
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Fetch on mount / when branchId changes ── */
  useEffect(() => {
    if (!jwtToken || !branchId) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await getSettings(jwtToken, branchId);
        const data = res?.data?.settings || res?.settings;
        if (data) {
          setSettings({
            general: { ...DEFAULT_SETTINGS.general, ...data.general },
            backup: { ...DEFAULT_SETTINGS.backup, ...data.backup },
            transaction: { ...DEFAULT_SETTINGS.transaction, ...data.transaction },
            messages: { ...DEFAULT_SETTINGS.messages, ...data.messages },
            party: { ...DEFAULT_SETTINGS.party, ...data.party },
            item: { ...DEFAULT_SETTINGS.item, ...data.item },
            tax: { ...DEFAULT_SETTINGS.tax, ...data.tax },
          });
          setHasExisting(true);
        }
      } catch (err) {
        // 404 means no settings exist yet — use defaults, will POST
        if (err?.response?.status !== 404) {
          console.error("Failed to fetch settings:", err);
        }
        setHasExisting(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [jwtToken, branchId]);

  /* ── Tab change — update URL query without full navigation ── */
  const handleTabChange = (tab) => {
    router.push({ pathname: router.pathname, query: { tab } }, undefined, { shallow: true });
  };

  /* ── Partial updaters for each section ── */
  const updateSection = useCallback(
    (section) => (patch) =>
      setSettings((prev) => ({ ...prev, [section]: patch })),
    []
  );

  /* ── Save ── */
  const handleSave = async () => {
    if (!branchId) {
      toast.error("No branch selected.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        branchId: parseInt(branchId),
        createdBy: userInfo?.vendorId || 1,
        settings: {
          general: settings.general,
          backup: settings.backup,
          transaction: settings.transaction,
          messages: settings.messages,
          party: settings.party,
          item: settings.item,
          tax: settings.tax,
        },
      };

      let res;
      if (hasExisting) {
        res = await updateSettings(jwtToken, payload);
      } else {
        res = await createSettings(jwtToken, payload);
        setHasExisting(true);
      }

      const status = res?.status || res?.data?.status;
      if (status === "success" || status === "ok" || status === 200 || status === 201) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(res?.message || res?.data?.message || "Failed to save settings.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Render active tab content ── */
  const renderTab = () => {
    if (loading) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5790c" strokeWidth="2"
            style={{ animation: "spin 0.8s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <div style={{ marginTop: 12 }}>Loading settings…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    switch (activeTab) {
      case "General":
        return (
          <GeneralSettings
            settings={settings.general}
            onChange={updateSection("general")}
            backupSettings={settings.backup}
            onBackupChange={updateSection("backup")}
          />
        );
      case "Transactions":
        return (
          <TransactionSettings
            settings={settings.transaction}
            onChange={updateSection("transaction")}
          />
        );
      case "TaxesGST":
        return (
          <TaxesGSTSettings
            settings={settings.tax || {}}
            onChange={updateSection("tax")}
          />
        );
      case "TransactionMessage":
        return (
          <TransactionMessageSettings
            settings={settings.messages}
            onChange={updateSection("messages")}
          />
        );
      case "SupplierCustomer":
        return (
          <SupplierCustomerSettings
            settings={settings.party}
            onChange={updateSection("party")}
          />
        );
      case "ItemSettings":
        return (
          <ItemSettings
            settings={settings.item}
            onChange={updateSection("item")}
          />
        );
      case "ProfileSettings":
        return <ProfileSettings />;

      default:
        return (
          <GeneralSettings
            settings={settings.general}
            onChange={updateSection("general")}
            backupSettings={settings.backup}
            onBackupChange={updateSection("backup")}
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <VendorSettingsLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSave={handleSave}
        saving={saving}
      >
        {renderTab()}
      </VendorSettingsLayout>
    </DashboardLayout>
  );
}
