// Thin wrapper around the shared RBAC matrix so nav/UI can hide what the
// logged-in role genuinely cannot do — mirrors what the backend already
// enforces via shadowPermission(), never a separate source of truth.
import { hasPermission } from '../../../shared/permissions/permissionMatrix';
import { PERMISSIONS } from '../../../shared/constants/roles';

export const can = (role, permission) => hasPermission(role, permission);

export { PERMISSIONS };
