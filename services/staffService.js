import axios from "axios";
import { BACKEND_URL } from "../components/utilities/Constants";

export const getBranchStaff = async (branchId) => {
  const response = await axios.get(`${BACKEND_URL}vendor-users/branch-staff`, {
    params: { branchId }
  });
  return response.data;
};

export const getStaffLeaveRequests = async (branchId) => {
  const response = await axios.get(`${BACKEND_URL}vendor-users/branch-staff`, {
    params: { branchId, type: 'leaves' }
  });
  return response.data;
};

export const addStaffLeaveRequest = async (payload) => {
  const response = await axios.post(`${BACKEND_URL}vendor-users/branch-staff/leaves`, payload);
  return response.data;
};

export const addBranchStaff = async (staffData) => {
  const response = await axios.post(`${BACKEND_URL}vendor-users/branch-staff`, staffData);
  return response.data;
};

export const updateStaffStatusOrLeave = async (leaveRequestId, payload) => {
  const response = await axios.put(`${BACKEND_URL}vendor-users/branch-staff/leaves/${leaveRequestId}`, payload);
  return response.data;
};

export const getStaffDetailsById = async (id) => {
  const response = await axios.get(`${BACKEND_URL}vendor-users/${id}`);
  return response.data;
};

export const updateStaffDetails = async (id, payload) => {
  const response = await axios.put(`${BACKEND_URL}vendor-users/${id}`, payload);
  return response.data;
};

export const updateStaffProfileImage = async (id, formData) => {
  const response = await axios.put(`${BACKEND_URL}vendor-users/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
