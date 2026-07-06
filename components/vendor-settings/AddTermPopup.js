import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";
import { createTermAndCondition } from "../../services/settingsService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";

const TRANSACTION_TYPES = ["Sale Invoice", "Purchase Order", "Sale Return", "Purchase Return"];

const AddTermPopup = ({ onClose, onSave, initialData }) => {
  const { jwtToken, userInfo } = useStore();
  const { branchId } = useDashboardData({ skipReviews: true });

  const [header, setHeader] = useState("");
  const [termsText, setTermsText] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setHeader(initialData.transactionType || "");
      setTermsText(initialData.termsText || "");
      if (initialData.transactionType) {
        setSelectedTypes([initialData.transactionType]);
      }
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!termsText.trim()) {
      toast.error("Description is required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        branchId,
        transactionType: initialData.transactionType,
        header: initialData.transactionType,
        termsText,
        isDefault: true,
        createdBy: userInfo?.id || 1
      };
      if (initialData && !initialData.isPlaceholder && initialData.id) {
        payload.id = initialData.id;
      }
      await createTermAndCondition(jwtToken, payload);
      toast.success("Terms saved successfully");
      onSave();
    } catch (err) {
      toast.error("Failed to save terms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} style={{ zIndex: 1000 }}>
      <div className={styles.modalContent} style={{ maxWidth: '500px', width: '100%', padding: 0, borderRadius: '8px', overflow: 'hidden' }}>
        <div className={styles.modalHeader} style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.modalTitle} style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Terms & Conditions</h2>
          <button className={styles.closeBtn} onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', padding: 0, color: '#333' }}>×</button>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Terms and Conditions</label>
            <input 
              type="text" 
              value={header}
              disabled={true}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
              You can select the term based on the header you select here
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Description</label>
            <textarea 
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              placeholder="Thanks for Doing business with us...!"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '120px', resize: 'vertical', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>



          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button 
              onClick={onClose}
              style={{ padding: '8px 24px', background: '#fff', border: '1px solid #333', borderRadius: '4px', color: '#333', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              style={{ padding: '8px 24px', background: '#000', border: '1px solid #000', borderRadius: '4px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTermPopup;
