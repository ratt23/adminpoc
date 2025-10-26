// netlify/utils/permissions.js
const permissionConfig = {
  admin: {
    view_patients: true,
    add_patient: true,
    edit_patient: true,
    delete_patient: true,
    export_csv: true,
    all_access: true,
    manage_users: true
  },
  admin_poc: {
    view_patients: true,
    add_patient: true,
    edit_patient: true,
    delete_patient: true,
    export_csv: true,
    manage_users: false
  },
  exporter: {
    view_patients: true,
    add_patient: false,
    edit_patient: false,
    delete_patient: false,
    export_csv: true,
    manage_users: false
  }
};

// Function untuk check permission
const checkPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  
  // Jika user memiliki all_access, return true untuk semua permission
  if (user.permissions.all_access) return true;
  
  // Check specific permission
  return user.permissions[permission] === true;
};

// Function untuk get permissions berdasarkan role
const getPermissionsByRole = (role) => {
  return permissionConfig[role] || permissionConfig.exporter;
};

// Middleware untuk protect routes berdasarkan permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!checkPermission(user, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  permissionConfig,
  checkPermission,
  requirePermission,
  getPermissionsByRole
};