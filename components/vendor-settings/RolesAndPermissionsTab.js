import React, { useState, useEffect } from "react";
import AddRolesPermission from "../settings/add-roles-permission";
import { getRoles } from "../../services/rolesService";
import useDashboardData from "../dashboard/useDashboardData";

const RolesAndPermissionsTab = ({ addEdit = true, canDelete = true }) => {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const { branchId } = useDashboardData({ skipReviews: true }) || {};

  const fetchRoles = async () => {
    if (!branchId) return;
    try {
      const res = await getRoles(branchId);
      setRoles(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [branchId]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Roles & Permissions</h2>
        {addEdit && (
        <button 
          onClick={() => { setMode("add"); setSelectedRole(null); setShowModal(true); }}
          style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add New Role
        </button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee', color: '#666' }}>Role Name</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee', color: '#666' }}>Permissions</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee', color: '#666' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 500 }}>{role.roleName}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee', color: '#555' }}>{role.description || `${role.permissionKeys?.length || 0} permissions`}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                  <span 
                    onClick={() => { setSelectedRole(role); setMode("view"); setShowModal(true); }}
                    style={{ color: '#d81b60', cursor: 'pointer', marginRight: '16px' }}
                  >
                    View
                  </span>
                  {addEdit && (
                  <span 
                    onClick={() => { setSelectedRole(role); setMode("edit"); setShowModal(true); }}
                    style={{ color: '#d81b60', cursor: 'pointer' }}
                  >
                    Edit
                  </span>
                  )}
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center', color: '#888' }}>
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddRolesPermission 
        show={showModal} 
        onClose={() => { setShowModal(false); fetchRoles(); }} 
        mode={mode} 
        initialData={selectedRole}
      />
    </div>
  );
};

export default RolesAndPermissionsTab;
