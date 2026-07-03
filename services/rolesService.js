import axios from "axios";
import { BACKEND_URL } from "../components/utilities/Constants";

export const getVendorModules = async () => {
  const response = await axios.get(`${BACKEND_URL}vendor/modules`);
  return response.data;
};

export const getRoles = async (branchId) => {
  const response = await axios.get(`${BACKEND_URL}vendor/roles`, {
    params: { branchId }
  });
  return response.data;
};

export const getRoleById = async (id) => {
  const response = await axios.get(`${BACKEND_URL}vendor/roles/${id}`);
  return response.data;
};

export const createRole = async (payload) => {
  const response = await axios.post(`${BACKEND_URL}vendor/roles`, payload);
  return response.data;
};

export const updateRole = async (id, payload) => {
  const response = await axios.put(`${BACKEND_URL}vendor/roles/${id}`, payload);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await axios.delete(`${BACKEND_URL}vendor/roles/${id}`);
  return response.data;
};

export const getAssignedPersons = async (id) => {
  const response = await axios.get(`${BACKEND_URL}vendor/roles/${id}/assigned-persons`);
  return response.data;
};

export const applyRoleToStaff = async (id, staffUserId) => {
  const response = await axios.post(`${BACKEND_URL}vendor/roles/${id}/apply-to-staff`, { staffUserId });
  return response.data;
};
