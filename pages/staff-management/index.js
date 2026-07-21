import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/staff-management.module.css";
import AddStaff from "../../components/staff-management/add-staff";
import ViewStaff from "../../components/staff-management/view-staff";
import LeaveRequest from "../../components/staff-management/leave-request";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { getBranchStaff, getStaffLeaveRequests, updateStaffStatusOrLeave, updateStaffStatus } from "../../services/staffService";

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState("MANAGE STAFF");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState("add"); // "add", "edit", "view"
  const [showLeaveRequest, setShowLeaveRequest] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [totalStaffCount, setTotalStaffCount] = useState("00");
  const [totalLeaveCount, setTotalLeaveCount] = useState("00");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { branchId, branches } = useDashboardData({ skipReviews: true }) || {};

  useEffect(() => {
    if (branchId) {
      fetchData();
    }
  }, [branchId, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === "MANAGE LEAVES") {
        const data = await getStaffLeaveRequests(branchId);
        setLeaveRequests(Array.isArray(data) ? data : data?.data || data?.staff || []);
        if (data?.totalStaff !== undefined) setTotalStaffCount(data.totalStaff < 10 ? `0${data.totalStaff}` : data.totalStaff);
        if (data?.totalLeaveRequests !== undefined) setTotalLeaveCount(data.totalLeaveRequests < 10 ? `0${data.totalLeaveRequests}` : data.totalLeaveRequests);
      } else {
        const data = await getBranchStaff(branchId);
        setStaffList(Array.isArray(data) ? data : data?.data || data?.staff || []);
        if (data?.totalStaff !== undefined) setTotalStaffCount(data.totalStaff < 10 ? `0${data.totalStaff}` : data.totalStaff);
        if (data?.totalLeaveRequests !== undefined) setTotalLeaveCount(data.totalLeaveRequests < 10 ? `0${data.totalLeaveRequests}` : data.totalLeaveRequests);
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
    }
  };

  <div className={styles.tabs}>
    <button
      className={`${styles.tab} ${activeTab === "MANAGE STAFF" ? styles.activeTab : ""}`}
      onClick={() => setActiveTab("MANAGE STAFF")}
    >
      MANAGE STAFF
    </button>
    <button
      className={`${styles.tab} ${activeTab === "MANAGE LEAVES" ? styles.activeTab : ""}`}
      onClick={() => setActiveTab("MANAGE LEAVES")}
    >
      MANAGE LEAVES
    </button>
  </div>

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const activeList = staffList.length > 0 ? staffList : staffData;
      setSelectedStaff(activeList.map(s => s.userId || s.id || s._id || s.staffName || s.name));
    } else {
      setSelectedStaff([]);
    }
  };

  const handleSelectStaff = (id) => {
    if (selectedStaff.includes(id)) {
      setSelectedStaff(selectedStaff.filter(item => item !== id));
    } else {
      setSelectedStaff([...selectedStaff, id]);
    }
  };

  const handleActionClick = (mode) => {
    if (selectedStaff.length === 0) return;
    if (mode === "inactive") {
      alert("Staff marked as inactive.");
      setSelectedStaff([]);
      return;
    }
    setStaffModalMode(mode);
    setShowAddStaff(true);
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      if (!leaveId) {
        alert("Dummy action triggered: " + status);
        return;
      }
      await updateStaffStatusOrLeave(leaveId, { status });
      fetchData(); // refresh data
    } catch (err) {
      console.error("Error updating leave:", err);
      alert("Failed to update leave request.");
    }
  };

  const handleStaffStatusToggle = async (staffId, currentStatus) => {
    try {
      if (!staffId) return;
      const newStatus = (currentStatus || "").toLowerCase() === "inactive" ? "Active" : "Inactive";
      await updateStaffStatus(staffId, newStatus);
      fetchData(); // refresh list
    } catch (err) {
      console.error("Error updating staff status:", err);
      alert("Failed to update staff status.");
    }
  };


  const customTopbarRight = (
    <div style={{ display: 'flex', gap: '12px' }}>
      {activeTab === "MANAGE LEAVES" ? (
        <button
          onClick={() => setShowLeaveRequest(true)}
          style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          + Request Leave
        </button>
      ) : (
        <button
          onClick={() => { setStaffModalMode("add"); setShowAddStaff(true); }}
          style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add Staff
        </button>
      )}
    </div>
  );

  return (
    <DashboardLayout customTopbarRight={customTopbarRight}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2>Staff Management</h2>
            <span className={styles.badge}>TOTAL STAFF: {totalStaffCount}</span>
            <span className={styles.badge}>LEAVES REQUEST: {totalLeaveCount}</span>
          </div>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "MANAGE STAFF" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("MANAGE STAFF")}
            >
              MANAGE STAFF
            </button>
            <button
              className={`${styles.tab} ${activeTab === "MANAGE LEAVES" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("MANAGE LEAVES")}
            >
              MANAGE LEAVES
            </button>
          </div>
        </div>

        {activeTab !== "MANAGE LEAVES" && (
          <div className={styles.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search products here" />
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              {activeTab === "MANAGE LEAVES" ? (
                <tr>
                  <th>STAFF NAME</th>
                  <th>BRANCH NAME</th>
                  <th>DESIGNATION</th>
                  <th>DATE</th>
                  <th>NO OF DAYS</th>
                  <th>NOTES</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={staffList.length > 0 && selectedStaff.length === staffList.length}
                    />
                  </th>
                  <th>STAFF NAME</th>
                  <th>BRANCH NAME</th>
                  <th>CONTACT</th>
                  <th>ROLE</th>
                  <th>WEEK OFF DAY</th>
                  <th>SCHEDULE</th>
                  <th>LEAVE TAKEN</th>
                  <th>LEAVE PENDING</th>
                  <th>STATUS</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === "MANAGE LEAVES" ? (
                leaveRequests.map((leave, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{leave.name || leave.firstName}</td>
                    <td>{leave.branch || "ROHTAK"}</td>
                    <td><span className={styles.roleBadge}>{leave.role || "STAFF"}</span></td>
                    <td>{leave.date || "N/A"}</td>
                    <td>{leave.days || "N/A"}</td>
                    <td>{leave.notes || "-"}</td>
                    <td>
                      <span className={
                        (leave.status || "Pending").toUpperCase() === "APPROVED" ? styles.statusApproved :
                          (leave.status || "Pending").toUpperCase() === "PENDING" ? styles.statusPending : styles.statusRejected
                      }>{leave.status || "Pending"}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {(leave.status || "Pending").toUpperCase() === "PENDING" ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleLeaveAction(leave.id || leave._id, "Approved")} className={`${styles.actionBtn} ${styles.actionBtnGreen}`}>APPROVE</button>
                          <button onClick={() => handleLeaveAction(leave.id || leave._id, "Rejected")} className={`${styles.actionBtn} ${styles.actionBtnRed}`}>REJECT</button>
                        </div>
                      ) : (
                        <button onClick={() => handleLeaveAction(leave.id || leave._id, "Cancelled")} className={styles.actionBtn}>WITH DRAW</button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                staffList.map((staff, i) => {
                  const id = staff.userId || staff.id || staff._id || staff.staffName || staff.name;
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(id)}
                          onChange={() => handleSelectStaff(id)}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{staff.staffName || staff.name || (staff.firstName ? `${staff.firstName} ${staff.lastName || ''}` : '')}</td>
                      <td>{staff.branchName || "ROHTAK"}</td>
                      <td>{staff.contact || staff.phoneNumber || "-"}</td>
                      <td><span className={styles.roleBadge}>{staff.role || "STAFF"}</span></td>
                      <td>
                        {(staff.weekOffDay || staff.weekOff) !== "-" && (staff.weekOffDay || staff.weekOff) ?
                          <span>{(staff.weekOffDay || staff.weekOff)} <span style={{ background: '#eee', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>1+</span></span>
                          : staff.weekOffDay || staff.weekOff || "-"}
                      </td>
                      <td>{staff.schedule || "-"}</td>
                      <td>{staff.leaveTaken || "00"}</td>
                      <td>{staff.leavePending || "00"}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={(staff.status || "").toLowerCase() !== "inactive"}
                              onChange={() => handleStaffStatusToggle(id, staff.status)}
                            />
                            <span className={`${styles.slider} ${styles.round}`}></span>
                          </label>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: (staff.status || "").toLowerCase() === "inactive" ? '#ef4444' : '#10b981' }}>
                            {(staff.status || "").toLowerCase() === "inactive" ? "Inactive" : "Active"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination} style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div style={{ color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Rows per Page
            <select
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            {Math.min((currentPage - 1) * rowsPerPage + 1, activeTab === "MANAGE LEAVES" ? leaveRequests.length : staffList.length)} - {Math.min(currentPage * rowsPerPage, activeTab === "MANAGE LEAVES" ? leaveRequests.length : staffList.length)} of {activeTab === "MANAGE LEAVES" ? leaveRequests.length : staffList.length} Items
          </div>

          {selectedStaff.length > 0 && activeTab === "MANAGE STAFF" && (
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '16px', background: '#f8f9fa', border: '1px solid #eee', borderRadius: '30px', padding: '6px 20px', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#d81b60', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setSelectedStaff([])}>
                ✕ {selectedStaff.length} Items Selected
              </div>
              <div style={{ width: '1px', height: '16px', background: '#ddd' }}></div>
              <div style={{ display: 'flex', gap: '16px', color: '#555' }}>
                <span onClick={() => handleActionClick("view")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>👁 View</span>
                <span onClick={() => handleActionClick("edit")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>✎ Edit</span>
                {/* <span onClick={() => handleActionClick("inactive")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>🚫 Inactive</span> */}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentPage > 1 && (
              <button
                className={styles.actionBtn}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </button>
            )}
            {((activeTab === "MANAGE LEAVES" ? leaveRequests.length : staffList.length) > currentPage * rowsPerPage) && (
              <button
                className={styles.actionBtn}
                style={{ background: '#000', color: '#fff' }}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Staff Modal */}
      {(staffModalMode === "add" || staffModalMode === "edit") && (
        <AddStaff
          show={showAddStaff}
          onClose={() => { setShowAddStaff(false); setSelectedStaff([]); }}
          mode={staffModalMode}
          staffId={selectedStaff.length === 1 ? selectedStaff[0] : null}
        />
      )}

      {/* View Staff Modal */}
      {staffModalMode === "view" && (
        <ViewStaff
          show={showAddStaff}
          onClose={() => { setShowAddStaff(false); setSelectedStaff([]); }}
          staffId={selectedStaff.length === 1 ? selectedStaff[0] : null}
          onEdit={() => setStaffModalMode("edit")}
        />
      )}

      {/* Leave Request Drawer */}
      <LeaveRequest
        show={showLeaveRequest}
        onClose={() => setShowLeaveRequest(false)}
        branches={branches}
        staffList={staffList}
        onSuccess={() => fetchData()}
      />
    </DashboardLayout>
  );
};

export default StaffManagement;
