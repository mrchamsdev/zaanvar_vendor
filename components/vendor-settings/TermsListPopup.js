import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";
import { getTermsAndConditions, deleteTermAndCondition } from "../../services/settingsService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import AddTermPopup from "./AddTermPopup";

const TermsListPopup = ({ onClose }) => {
  const { jwtToken } = useStore();
  const { branchId } = useDashboardData({ skipReviews: true });
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  const fetchTerms = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await getTermsAndConditions(jwtToken, branchId);
      let items = [];
      if (res && res.status === "success" || res?.status === 200) {
        if (Array.isArray(res.data)) items = res.data;
        else if (res.data && Array.isArray(res.data.data)) items = res.data.data;
      } else if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
      }
      setTerms(items);
    } catch (err) {
      toast.error("Failed to load terms and conditions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [branchId]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this term?")) {
      try {
        const res = await deleteTermAndCondition(jwtToken, id);
        if (res.status === "success" || res.status === 200) {
          toast.success("Term deleted successfully");
          fetchTerms();
        } else {
          toast.error("Failed to delete term");
        }
      } catch (err) {
        toast.error("An error occurred");
      }
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingTerm(null);
    setShowAddModal(true);
  };

  const FIXED_TYPES = ["Sale Invoice", "Purchase Order", "Sale Return", "Purchase Return"];

  const displayTerms = FIXED_TYPES.map(type => {
    const existing = terms.find(t => t.transactionType === type);
    return existing || { transactionType: type, header: type, termsText: "", isPlaceholder: true };
  });

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent} style={{ maxWidth: '600px', width: '100%', padding: 0 }}>
          <div className={styles.modalHeader} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h2 className={styles.modalTitle}>Terms & Conditions</h2>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button className={styles.closeBtn} onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
          </div>
          
          <div style={{ background: '#fef0f4', padding: '16px 20px', position: 'relative' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>What has improved ?</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5', paddingRight: '20px' }}>
              Now you can add multiple terms and conditions for a transaction type, choose between them when creating a transaction
            </p>
            <button style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', fontSize: '18px', color: '#666', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '15px', color: '#555', fontWeight: '600' }}>Header</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '15px', color: '#555', fontWeight: '600', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                ) : (
                  displayTerms.map(t => (
                    <tr key={t.transactionType} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#555' }}>
                        {t.transactionType} &gt;
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button onClick={() => handleEdit(t)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '16px', color: '#555' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showAddModal && (
        <AddTermPopup 
          onClose={() => setShowAddModal(false)} 
          onSave={() => {
            setShowAddModal(false);
            fetchTerms();
          }}
          initialData={editingTerm}
        />
      )}
    </>
  );
};

export default TermsListPopup;
