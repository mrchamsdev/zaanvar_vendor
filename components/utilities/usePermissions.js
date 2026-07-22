import useStore from "../state/useStore";

/**
 * usePermissions
 * 
 * A hook to check if the current user has access to a specific module and service.
 * Defaults to giving access if the role is 'superadmin', or if the role cannot be found.
 * 
 * @param {string} moduleName - e.g., "Inventory"
 * @param {string} serviceName - e.g., "Products"
 * @returns {object} { view, addEdit, canDelete }
 */
export default function usePermissions(moduleName, serviceName) {
  const { userInfo, roles } = useStore();
  
  // Try to determine the logged in user's ID
  const currentUserId = userInfo?.userId || userInfo?.id || userInfo?._id;
  const userRoleStr = userInfo?.role;

  // Superadmin bypasses checks
  if (userRoleStr === "superadmin") {
    return { view: true, addEdit: true, canDelete: true, noAccess: false };
  }

  // Find the matching role object by checking if the user's ID is in the role's userIds array
  const role = roles?.find(
    (r) => r.userIds && r.userIds.includes(Number(currentUserId))
  );
  
  if (!role) {
    // If no roles are loaded yet, or role isn't found, default to true 
    // to prevent blocking legitimate access before APIs return.
    return { view: true, addEdit: true, canDelete: true, noAccess: false };
  }

  const normalizedModule = moduleName.trim().toLowerCase();
  const normalizedService = (serviceName || "").trim().toLowerCase();

  const permission = role.permissions?.find(
    (p) => p.module.trim().toLowerCase() === normalizedModule && 
           (p.serviceName || "").trim().toLowerCase() === normalizedService
  );

  if (permission) {
    return {
      view: !!permission.view,
      addEdit: !!permission.addEdit,
      canDelete: !!permission.delete,
      noAccess: !!permission.noAccess
    };
  }

  // If the specific permission block is not found, assume it is not restricted
  return { view: true, addEdit: true, canDelete: true, noAccess: false };
}
