// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { smartErpApi } from "../services/smartErpApi";

// export default function AdminPanel({
//   allowedModulesByRole = {},
//   moduleOptions = [],
//   onUpdateRoleModules
// }) {

//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     password: "",
//     role: "OperationsWorker",
//     mfaEnabled: false,
//     name: "",
//     smtpHost: "",
//     smtpPort: "",
//     smtpEmail: "",
//     smtpPassword: ""
//   });

//   const [users, setUsers] = useState([]);
//   const [editingUser, setEditingUser] = useState(null);
//   const [result, setResult] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [moduleRole, setModuleRole] = useState("OperationsWorker");
//   const [moduleResult, setModuleResult] = useState("");
//   const [selectedModules, setSelectedModules] = useState([]);

//   useEffect(() => {
//     const current = allowedModulesByRole[moduleRole] || [];
//     if (moduleRole === "Admin" && !current.includes("admin")) {
//       setSelectedModules([...current, "admin"]);
//     } else {
//       setSelectedModules(current);
//     }
//   }, [allowedModulesByRole, moduleRole]);

//   const loadUsers = useCallback(async () => {
//     try {
//       const res = await smartErpApi.getUsers();
//       setUsers(res.data || []);
//     } catch (err) {
//       console.error("Failed to load users:", err);
//     }
//   }, []);

//   useEffect(() => {
//     loadUsers();
//   }, [loadUsers]);

//   const modulePlaceholders = useMemo(
//     () =>
//       moduleOptions.map((option) => ({
//         id: option.id,
//         label: typeof option.label === "function" ? option.label({ unreadCount: 0 }) : option.label
//       })),
//     [moduleOptions]
//   );

//   const handleToggleModule = (moduleId) => {
//     setSelectedModules((current) =>
//       current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId]
//     );
//   };

//   const handleSaveModuleAccess = (event) => {
//     event.preventDefault();
//     if (!onUpdateRoleModules) return;
//     const normalizedSelection =
//       moduleRole === "Admin" ? Array.from(new Set([...selectedModules, "admin"])) : selectedModules;

//     onUpdateRoleModules({
//       ...allowedModulesByRole,
//       [moduleRole]: normalizedSelection
//     });
//     setModuleResult(`Updated ${normalizedSelection.length} module access rules for ${moduleRole}.`);
//   };

//   const handleUserSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       if (editingUser) {
//         await smartErpApi.updateUser(editingUser.id, form);
//         setResult(`User updated: ${form.username}`);
//       } else {
//         const res = await smartErpApi.registerUser(form);
//         setResult(`User created: ${res.data.username} (${res.data.role})`);
//       }

//       resetForm();
//       loadUsers();

//     } catch (err) {
//       setResult(
//         err?.response?.data ||
//         "User operation failed"
//       );
//     }

//     setLoading(false);
//   };

//   const handleEditUser = (user) => {
//     setEditingUser(user);
//     setForm({
//       username: user.username,
//       email: user.email || "",
//       password: "", // Don't populate password for security
//       role: user.role || "OperationsWorker",
//       mfaEnabled: user.mfaEnabled || false,
//       name: user.name || "",
//       smtpHost: user.smtpHost || "",
//       smtpPort: user.smtpPort || "",
//       smtpEmail: user.smtpEmail || "",
//       smtpPassword: "" // Don't populate password for security
//     });
//   };

//   const handleDeleteUser = async (userId) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) return;

//     try {
//       await smartErpApi.deleteUser(userId);
//       setResult("User deleted successfully");
//       loadUsers();
//     } catch (err) {
//       setResult("Failed to delete user");
//     }
//   };

//   const handleBlockUser = async (userId) => {
//     try {
//       await smartErpApi.blockUser(userId);
//       setResult("User blocked successfully");
//       loadUsers();
//     } catch (err) {
//       setResult("Failed to block user");
//     }
//   };

//   const handleUnblockUser = async (userId) => {
//     try {
//       await smartErpApi.unblockUser(userId);
//       setResult("User unblocked successfully");
//       loadUsers();
//     } catch (err) {
//       setResult("Failed to unblock user");
//     }
//   };

//   const resetForm = () => {
//     setEditingUser(null);
//     setForm({
//       username: "",
//       email: "",
//       password: "",
//       role: "OperationsWorker",
//       mfaEnabled: false,
//       name: "",
//       smtpHost: "",
//       smtpPort: "",
//       smtpEmail: "",
//       smtpPassword: ""
//     });
//   };

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;

//     setForm({
//       ...form,
//       [name]: type === "checkbox" ? checked : value
//     });
//   };

//   return (
//     <div className="container-fluid py-4">

//       <div className="card shadow-sm border-0 p-4" style={{ maxWidth: 900 }}>

//         <h4 className="fw-bold">Admin & Security</h4>
//         <p className="text-muted">Create ERP users and manage access.</p>

//         {result && (
//           <div className="alert alert-info">{result}</div>
//         )}

//         <form
//           className="row g-3"
//           onSubmit={handleUserSubmit}
//           autoComplete="off"
//         >

//           <div className="col-md-3">
//             <label className="form-label">Username</label>
//             <input
//               name="username"
//               autoComplete="new-username"
//               className="form-control"
//               value={form.username}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="col-md-3">
//             <label className="form-label">Name</label>
//             <input
//               name="name"
//               className="form-control"
//               value={form.name}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="col-md-3">
//             <label className="form-label">Email</label>
//             <input
//               type="email"
//               name="email"
//               autoComplete="off"
//               className="form-control"
//               value={form.email}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="col-md-3">
//             <label className="form-label">Role</label>
//             <select
//               name="role"
//               className="form-select"
//               value={form.role}
//               onChange={handleChange}
//             >
//               <option>Admin</option>
//               <option>Manager</option>
//               <option>OperationsWorker</option>
//               <option>ScannerWorker</option>
//               <option>Warehouse Manager</option>
//               <option>Finance Manager</option>
//               <option>Robot Supervisor</option>
//               <option>User</option>
//             </select>
//           </div>

//           {!editingUser && (
//             <div className="col-md-3">
//               <label className="form-label">Password</label>
//               <input
//                 type="password"
//                 name="password"
//                 autoComplete="new-password"
//                 className="form-control"
//                 value={form.password}
//                 onChange={handleChange}
//                 required={!editingUser}
//               />
//             </div>
//           )}

//           <div className="col-md-3">
//             <label className="form-label">SMTP Host</label>
//             <input
//               name="smtpHost"
//               className="form-control"
//               value={form.smtpHost}
//               onChange={handleChange}
//               placeholder="smtp.gmail.com"
//             />
//           </div>

//           <div className="col-md-3">
//             <label className="form-label">SMTP Port</label>
//             <input
//               type="number"
//               name="smtpPort"
//               className="form-control"
//               value={form.smtpPort}
//               onChange={handleChange}
//               placeholder="587"
//             />
//           </div>

//           <div className="col-md-3">
//             <label className="form-label">SMTP Email</label>
//             <input
//               type="email"
//               name="smtpEmail"
//               className="form-control"
//               value={form.smtpEmail}
//               onChange={handleChange}
//               placeholder="user@company.com"
//             />
//           </div>

//           <div className="col-md-3">
//             <label className="form-label">SMTP Password</label>
//             <input
//               type="password"
//               name="smtpPassword"
//               className="form-control"
//               value={form.smtpPassword}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="col-12 d-flex align-items-center gap-2">
//             <input
//               id="mfaEnabled"
//               name="mfaEnabled"
//               type="checkbox"
//               checked={form.mfaEnabled}
//               onChange={handleChange}
//             />
//             <label htmlFor="mfaEnabled" className="form-label m-0">
//               Enable MFA
//             </label>
//           </div>

//           <div className="col-12">
//             <button
//               className="btn btn-primary me-2"
//               disabled={loading}
//             >
//               {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
//             </button>
//             {editingUser && (
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={resetForm}
//               >
//                 Cancel
//               </button>
//             )}
//           </div>

//         </form>

//       </div>

//       {/* User Management Table */}
//       <div className="card shadow-sm border-0 p-4 mt-4" style={{ maxWidth: 1200 }}>
//         <h5 className="fw-bold mb-3">User Management</h5>
//         <div className="table-responsive">
//           <table className="table table-striped">
//             <thead>
//               <tr>
//                 <th>Username</th>
//                 <th>Name</th>
//                 <th>Email</th>
//                 <th>Role</th>
//                 <th>Status</th>
//                 <th>Created</th>
//                 <th>Last Login</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map((user) => (
//                 <tr key={user.id}>
//                   <td>{user.username}</td>
//                   <td>{user.name || '-'}</td>
//                   <td>{user.email || '-'}</td>
//                   <td>{user.role || 'OperationsWorker'}</td>
//                   <td>
//                     <span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
//                       {user.status || 'Active'}
//                     </span>
//                   </td>
//                   <td>{user.createdDate ? new Date(user.createdDate).toLocaleDateString() : '-'}</td>
//                   <td>{user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : '-'}</td>
//                   <td>
//                     <div className="btn-group btn-group-sm">
//                       <button
//                         className="btn btn-outline-primary"
//                         onClick={() => handleEditUser(user)}
//                       >
//                         Edit
//                       </button>
//                       {user.status === 'Active' ? (
//                         <button
//                           className="btn btn-outline-warning"
//                           onClick={() => handleBlockUser(user.id)}
//                         >
//                           Block
//                         </button>
//                       ) : (
//                         <button
//                           className="btn btn-outline-success"
//                           onClick={() => handleUnblockUser(user.id)}
//                         >
//                           Unblock
//                         </button>
//                       )}
//                       <button
//                         className="btn btn-outline-danger"
//                         onClick={() => handleDeleteUser(user.id)}
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Worker Monitor Section */}
//       <div className="card shadow-sm border-0 p-4 mt-4" style={{ maxWidth: 1200 }}>
//         <h5 className="fw-bold mb-3">Worker Activity Monitor</h5>
//         <WorkerMonitor />
//       </div>

//       <div className="card shadow-sm border-0 p-4 mt-4" style={{ maxWidth: 900 }}>
//         <h5 className="fw-bold mb-2">Module Access</h5>
//         <p className="text-muted mb-3">Control which navigation tiles each role can reach.</p>
//         {moduleResult && (
//           <div className="alert alert-success">{moduleResult}</div>
//         )}
//         <form className="row g-3" onSubmit={handleSaveModuleAccess}>
//           <div className="col-md-4">
//             <label className="form-label">Role</label>
//             <select
//               className="form-select"
//               value={moduleRole}
//               onChange={(event) => setModuleRole(event.target.value)}
//             >
//               {Object.keys(allowedModulesByRole).map((roleKey) => (
//                 <option key={roleKey}>{roleKey}</option>
//               ))}
//             </select>
//           </div>
//           <div className="col-12">
//             <div className="row row-cols-2 g-2">
//               {modulePlaceholders.map((module) => (
//                 <label key={module.id} className="form-check col d-flex align-items-center gap-2">
//                   <input
//                     className="form-check-input"
//                     type="checkbox"
//                     checked={selectedModules.includes(module.id)}
//                     onChange={() => handleToggleModule(module.id)}
//                     disabled={moduleRole === "Admin" && module.id === "admin"}
//                   />
//                   <span className="form-check-label m-0">{module.label}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
//           <div className="col-12 text-end">
//             <button className="btn btn-outline-primary" type="submit">
//               Save module access
//             </button>
//           </div>
//         </form>
//       </div>

//     </div>
//   );
// }

// function WorkerMonitor() {
//   const [workerData, setWorkerData] = useState([]);
//   const [scannerOperations, setScannerOperations] = useState([]);
//   const [, setLoading] = useState(false);
//   const [filters, setFilters] = useState({
//     startDate: '',
//     endDate: '',
//     workerName: '',
//     warehouseId: ''
//   });

//   const loadWorkerData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const params = {};
//       if (filters.startDate) params.startDate = filters.startDate;
//       if (filters.endDate) params.endDate = filters.endDate;
//       if (filters.workerName) params.workerName = filters.workerName;
//       if (filters.warehouseId) params.warehouseId = filters.warehouseId;

//       const response = await smartErpApi.getWorkerMonitor(params);
//       setWorkerData(response.data || []);
//     } catch (err) {
//       console.error('Failed to load worker data:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [filters]);

//   const loadScannerOperations = useCallback(async () => {
//     try {
//       const params = {};
//       if (filters.startDate) params.startDate = filters.startDate;
//       if (filters.endDate) params.endDate = filters.endDate;
//       if (filters.workerName) params.workerName = filters.workerName;
//       if (filters.warehouseId) params.warehouseId = filters.warehouseId;

//       const response = await smartErpApi.getScannerOperations(params);
//       setScannerOperations(response.data || []);
//     } catch (err) {
//       console.error('Failed to load scanner operations:', err);
//     }
//   }, [filters]);

//   useEffect(() => {
//     loadWorkerData();
//     loadScannerOperations();
//   }, [loadWorkerData, loadScannerOperations]);

//   const handleFilterChange = (field, value) => {
//     setFilters(prev => ({ ...prev, [field]: value }));
//   };

//   return (
//     <div>
//       {/* Filters */}
//       <div className="row g-3 mb-4">
//         <div className="col-md-3">
//           <label className="form-label">Start Date</label>
//           <input
//             type="date"
//             className="form-control"
//             value={filters.startDate}
//             onChange={(e) => handleFilterChange('startDate', e.target.value)}
//           />
//         </div>
//         <div className="col-md-3">
//           <label className="form-label">End Date</label>
//           <input
//             type="date"
//             className="form-control"
//             value={filters.endDate}
//             onChange={(e) => handleFilterChange('endDate', e.target.value)}
//           />
//         </div>
//         <div className="col-md-3">
//           <label className="form-label">Worker Name</label>
//           <input
//             type="text"
//             className="form-control"
//             value={filters.workerName}
//             onChange={(e) => handleFilterChange('workerName', e.target.value)}
//             placeholder="Search by name"
//           />
//         </div>
//         <div className="col-md-3">
//           <label className="form-label">Warehouse</label>
//           <select
//             className="form-select"
//             value={filters.warehouseId}
//             onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
//           >
//             <option value="">All Warehouses</option>
//             {/* Add warehouse options here */}
//           </select>
//         </div>
//       </div>

//       {/* Worker Activity Table */}
//       <div className="mb-4">
//         <h6>Worker Login/Logout Activity</h6>
//         <div className="table-responsive">
//           <table className="table table-striped">
//             <thead>
//               <tr>
//                 <th>Worker Name</th>
//                 <th>Login Time</th>
//                 <th>Logout Time</th>
//                 <th>IP Address</th>
//                 <th>Device</th>
//                 <th>Items Scanned</th>
//                 <th>Stock IN</th>
//                 <th>Stock OUT</th>
//                 <th>Transfers</th>
//                 <th>Warehouse</th>
//               </tr>
//             </thead>
//             <tbody>
//               {workerData.map((worker, index) => (
//                 <tr key={index}>
//                   <td>{worker.workerName}</td>
//                   <td>{worker.loginTime ? new Date(worker.loginTime).toLocaleString() : '-'}</td>
//                   <td>{worker.logoutTime ? new Date(worker.logoutTime).toLocaleString() : '-'}</td>
//                   <td>{worker.ipAddress || '-'}</td>
//                   <td>{worker.device || '-'}</td>
//                   <td>{worker.itemsScanned || 0}</td>
//                   <td>{worker.stockInCount || 0}</td>
//                   <td>{worker.stockOutCount || 0}</td>
//                   <td>{worker.transfers || 0}</td>
//                   <td>{worker.warehouseUsed || '-'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Scanner Operations Table */}
//       <div>
//         <h6>Scanner Operations</h6>
//         <div className="table-responsive">
//           <table className="table table-striped">
//             <thead>
//               <tr>
//                 <th>Worker</th>
//                 <th>Item</th>
//                 <th>Warehouse</th>
//                 <th>Lot</th>
//                 <th>Serial Numbers</th>
//                 <th>Action</th>
//                 <th>Quantity</th>
//                 <th>Time</th>
//               </tr>
//             </thead>
//             <tbody>
//               {scannerOperations.map((op, index) => (
//                 <tr key={index}>
//                   <td>{op.worker}</td>
//                   <td>{op.item}</td>
//                   <td>{op.warehouse}</td>
//                   <td>{op.lot}</td>
//                   <td>{op.serialNumbers}</td>
//                   <td>{op.action}</td>
//                   <td>{op.quantity}</td>
//                   <td>{op.time ? new Date(op.time).toLocaleString() : '-'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

export default function AdminPanel({
  allowedModulesByRole = {},
  moduleOptions = [],
  onUpdateRoleModules
}) {

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "OperationsWorker",
    userType: "WORKER",
    mfaEnabled: false,
    name: "",
    tenantName: "",
    assignedPages: [],
    smtpHost: "",
    smtpPort: "",
    smtpEmail: "",
    smtpPassword: ""
  });

  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [result, setResult] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [moduleRole, setModuleRole] = useState("OperationsWorker");
  const [moduleResult, setModuleResult] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const formatApiError = (err, fallback = "Request failed") => {
    const payload = err?.response?.data;
    if (!payload) return err?.message || fallback;
    if (typeof payload === "string") return payload;
    if (payload.message) return payload.message;
    if (Array.isArray(payload.errors) && payload.errors.length) {
      return payload.errors.map((item) => (typeof item === "string" ? item : item.message)).join(", ");
    }
    try {
      return JSON.stringify(payload);
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    const baseList = allowedModulesByRole[moduleRole] || [];
    const expanded = moduleRole === "Admin" && !baseList.includes("admin") ? [...baseList, "admin"] : baseList;
    const normalized = Array.from(new Set(expanded)).sort();

    setSelectedModules((prev) => {
      if (
        prev.length === normalized.length &&
        prev.every((value, index) => value === normalized[index])
      ) {
        return prev;
      }
      return normalized;
    });
  }, [allowedModulesByRole, moduleRole]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await smartErpApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (editingUser) return;

    const basePages = allowedModulesByRole[form.role] || [];
    const normalizedPages = form.userType === "ADMIN"
      ? Array.from(new Set([...basePages, "admin"]))
      : basePages.filter((page) => page !== "admin");

    setForm((current) => {
      const currentSorted = [...current.assignedPages].sort();
      const nextSorted = [...normalizedPages].sort();
      if (
        currentSorted.length === nextSorted.length &&
        currentSorted.every((value, index) => value === nextSorted[index])
      ) {
        return current;
      }

      return {
        ...current,
        assignedPages: normalizedPages
      };
    });
  }, [allowedModulesByRole, editingUser, form.role, form.userType]);

  const modulePlaceholders = useMemo(
    () =>
      moduleOptions.flatMap((option) => {
        if (option.isGroup) {
          return option.subModules.map((subModule) => ({
            id: subModule.id,
            label: typeof subModule.label === "function" ? subModule.label({ unreadCount: 0 }) : subModule.label
          }));
        }

        return [{
          id: option.id,
          label: typeof option.label === "function" ? option.label({ unreadCount: 0 }) : option.label
        }];
      }),
    [moduleOptions]
  );

  const availableUserPages = useMemo(
    () => modulePlaceholders.filter((module) => form.userType === "ADMIN" || module.id !== "admin"),
    [form.userType, modulePlaceholders]
  );

  const formattedResultText = useMemo(() => {
    if (!result || !result.text) return "";
    if (typeof result.text === "string") return result.text;
    if (typeof result.text === "object") {
      if (result.text.title) return result.text.title;
      if (result.text.message) return result.text.message;
      if (result.text.detail) return result.text.detail;
      if (Array.isArray(result.text.errors)) {
        return result.text.errors.map((item) => (typeof item === "string" ? item : item.message)).join(", ");
      }
      return JSON.stringify(result.text);
    }
    return String(result.text);
  }, [result]);

  const handleToggleModule = (moduleId) => {
    setSelectedModules((current) =>
      current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId]
    );
  };

  const handleToggleAssignedPage = (pageId) => {
    setForm((current) => {
      const exists = current.assignedPages.includes(pageId);
      const nextPages = exists
        ? current.assignedPages.filter((item) => item !== pageId)
        : [...current.assignedPages, pageId];

      return {
        ...current,
        assignedPages: current.userType === "ADMIN" ? Array.from(new Set([...nextPages, "admin"])) : nextPages
      };
    });
  };

  const buildUserPayload = () => {
    const normalizedSmtpPort =
      form.smtpPort === "" || form.smtpPort === null || typeof form.smtpPort === "undefined"
        ? null
        : Number(form.smtpPort);

    return {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      userType: form.userType,
      mfaEnabled: Boolean(form.mfaEnabled),
      name: form.name.trim(),
      tenantName: form.userType === "CLIENT" ? form.tenantName.trim() : null,
      assignedPages: Array.isArray(form.assignedPages) ? form.assignedPages : [],
      smtpHost: form.smtpHost.trim() || null,
      smtpPort: Number.isNaN(normalizedSmtpPort) ? null : normalizedSmtpPort,
      smtpEmail: form.smtpEmail.trim() || null,
      smtpPassword: form.smtpPassword || null
    };
  };

  const handleSaveModuleAccess = (event) => {
    event.preventDefault();
    if (!onUpdateRoleModules) return;
    const normalizedSelection =
      moduleRole === "Admin" ? Array.from(new Set([...selectedModules, "admin"])) : selectedModules;

    onUpdateRoleModules({
      ...allowedModulesByRole,
      [moduleRole]: normalizedSelection
    });
    setModuleResult(`Updated ${normalizedSelection.length} module access rules for ${moduleRole}.`);
    setTimeout(() => setModuleResult(""), 4000);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = buildUserPayload();

    try {
      if (editingUser) {
        await smartErpApi.updateUser(editingUser.id, {
          email: payload.email,
          role: payload.role,
          name: payload.name,
          status: editingUser.status || "Active",
          smtpHost: payload.smtpHost,
          smtpPort: payload.smtpPort,
          smtpEmail: payload.smtpEmail,
          smtpPassword: payload.smtpPassword
        });
        await smartErpApi.updateUserPermissions({
          userId: editingUser.id,
          role: payload.role,
          userType: payload.userType,
          isActive: (editingUser.status || "Active") === "Active",
          name: payload.name,
          email: payload.email,
          assignedPages: payload.assignedPages
        });
        setResult({ text: `✓ User updated: ${form.username}`, type: "success" });
      } else {
        const res = await smartErpApi.registerUser(payload);
        setResult({ text: `✓ User created: ${res.data.username} (${res.data.userType})`, type: "success" });
      }

      resetForm();
      loadUsers();

    } catch (err) {
      setResult({
        text: formatApiError(err, "User operation failed"),
        type: "danger"
      });
    }

    setLoading(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email || "",
      password: "", // Don't populate password for security
      role: user.role || "OperationsWorker",
      userType: user.userType || (user.role === "Admin" ? "ADMIN" : "WORKER"),
      mfaEnabled: user.mfaEnabled || false,
      name: user.name || "",
      tenantName: user.tenantName || "",
      assignedPages: user.assignedPages || [],
      smtpHost: user.smtpHost || "",
      smtpPort: user.smtpPort || "",
      smtpEmail: user.smtpEmail || "",
      smtpPassword: "" // Don't populate password for security
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await smartErpApi.deleteUser(userId);
      setResult({ text: "✓ User deleted successfully", type: "success" });
      loadUsers();
    } catch (err) {
      setResult({ text: formatApiError(err, "Failed to delete user"), type: "danger" });
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await smartErpApi.blockUser(userId);
      setResult({ text: "✓ User blocked successfully", type: "success" });
      loadUsers();
    } catch (err) {
      setResult({ text: formatApiError(err, "Failed to block user"), type: "danger" });
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await smartErpApi.unblockUser(userId);
      setResult({ text: "✓ User unblocked successfully", type: "success" });
      loadUsers();
    } catch (err) {
      setResult({ text: formatApiError(err, "Failed to unblock user"), type: "danger" });
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setForm({
      username: "",
      email: "",
      password: "",
      role: "OperationsWorker",
      userType: "WORKER",
      mfaEnabled: false,
      name: "",
      tenantName: "",
      assignedPages: [],
      smtpHost: "",
      smtpPort: "",
      smtpEmail: "",
      smtpPassword: ""
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => {
      const nextValue = type === "checkbox" ? checked : value;
      const nextForm = {
        ...current,
        [name]: nextValue
      };

      if (name === "role" && value === "Admin") {
        nextForm.userType = "ADMIN";
        nextForm.assignedPages = Array.from(new Set([...current.assignedPages, "admin"]));
      }

      if (name === "userType" && value !== "ADMIN") {
        nextForm.assignedPages = current.assignedPages.filter((page) => page !== "admin");
      }

      if (name === "userType" && value === "CLIENT" && !current.tenantName) {
        nextForm.tenantName = current.name || current.username;
      }

      return nextForm;
    });
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Admin & Security Center</h4>
            <span className="erp-text-muted small text-uppercase">User Access & Role Management</span>
          </div>
        </div>

        {/* ALERTS */}
        {formattedResultText && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: result.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: result.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${result.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{formattedResultText}</span>
            <button className="btn-close btn-sm" onClick={() => setResult({ text: "", type: "" })}></button>
          </div>
        )}

        <div className="row g-4 mb-4">
          {/* USER REGISTRATION FORM */}
          <div className="col-xl-8">
            <div className="erp-panel shadow-sm h-100">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">{editingUser ? "Update Existing User" : "Provision New User"}</span>
              </div>
              <div className="p-4 bg-white h-100">
                <form className="row g-3" onSubmit={handleUserSubmit} autoComplete="off">
                  <div className="col-md-4">
                    <label className="erp-label">Username <span className="text-danger">*</span></label>
                    <input name="username" autoComplete="new-username" className="form-control erp-input" value={form.username} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Full Name</label>
                    <input name="name" className="form-control erp-input" value={form.name} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Email Address <span className="text-danger">*</span></label>
                    <input type="email" name="email" autoComplete="off" className="form-control erp-input" value={form.email} onChange={handleChange} required />
                  </div>
                  
                  <div className="col-md-4">
                    <label className="erp-label">System Role <span className="text-danger">*</span></label>
                    <select name="role" className="form-select erp-input" value={form.role} onChange={handleChange}>
                      <option>Admin</option>
                      <option>Manager</option>
                      <option>OperationsWorker</option>
                      <option>ScannerWorker</option>
                      <option>Warehouse Manager</option>
                      <option>Finance Manager</option>
                      <option>Robot Supervisor</option>
                      <option>User</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">User Type <span className="text-danger">*</span></label>
                    <select name="userType" className="form-select erp-input" value={form.userType} onChange={handleChange}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="WORKER">WORKER</option>
                      <option value="CLIENT">CLIENT</option>
                    </select>
                  </div>
                  {!editingUser && (
                    <div className="col-md-4">
                      <label className="erp-label">Initial Password <span className="text-danger">*</span></label>
                      <input type="password" name="password" autoComplete="new-password" className="form-control erp-input" value={form.password} onChange={handleChange} required={!editingUser} />
                    </div>
                  )}

                  {form.userType === "CLIENT" && (
                    <div className="col-md-4">
                      <label className="erp-label">Tenant Name <span className="text-danger">*</span></label>
                      <input name="tenantName" className="form-control erp-input" value={form.tenantName} onChange={handleChange} placeholder="Client ERP name" required={form.userType === "CLIENT"} />
                    </div>
                  )}

                  <div className="col-12 mt-4">
                    <h6 className="erp-section-title">Assigned Page Access</h6>
                    <div className="bg-light p-3 border rounded">
                      <div className="row row-cols-1 row-cols-md-2 g-2">
                        {availableUserPages.map((page) => (
                          <label key={page.id} className="form-check d-flex align-items-center m-0">
                            <input
                              className="form-check-input me-2"
                              type="checkbox"
                              checked={form.assignedPages.includes(page.id)}
                              onChange={() => handleToggleAssignedPage(page.id)}
                              disabled={form.userType !== "ADMIN" && page.id === "admin"}
                            />
                            <span className="form-check-label small fw-semibold text-dark">{page.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 mt-4">
                    <h6 className="erp-section-title">SMTP Configuration (Optional)</h6>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="erp-label">SMTP Host</label>
                    <input name="smtpHost" className="form-control erp-input" value={form.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" />
                  </div>
                  <div className="col-md-2">
                    <label className="erp-label">SMTP Port</label>
                    <input type="number" name="smtpPort" className="form-control erp-input" value={form.smtpPort} onChange={handleChange} placeholder="587" />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">SMTP Email</label>
                    <input type="email" name="smtpEmail" className="form-control erp-input" value={form.smtpEmail} onChange={handleChange} placeholder="user@company.com" />
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">SMTP Password</label>
                    <input type="password" name="smtpPassword" className="form-control erp-input" value={form.smtpPassword} onChange={handleChange} />
                  </div>

                  <div className="col-12 mt-3 d-flex align-items-center gap-2">
                    <div className="form-check form-switch">
                      <input className="form-check-input" id="mfaEnabled" name="mfaEnabled" type="checkbox" checked={form.mfaEnabled} onChange={handleChange} />
                      <label htmlFor="mfaEnabled" className="form-check-label erp-label m-0 mt-1">Enforce Multi-Factor Auth (MFA)</label>
                    </div>
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2 pt-3 border-top mt-4">
                    {editingUser && (
                      <button type="button" className="btn btn-light border erp-btn" onClick={resetForm}>Cancel</button>
                    )}
                    <button className="btn btn-primary erp-btn px-4 fw-bold" disabled={loading}>
                      {loading ? "Processing..." : editingUser ? "Commit User Update" : "Provision New User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ROLE MODULE ACCESS */}
          <div className="col-xl-4">
            <div className="erp-panel shadow-sm h-100 d-flex flex-column">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Role-Based Access Control</span>
              </div>
              <div className="p-4 bg-white flex-grow-1">
                <p className="text-muted small mb-4">Control which navigation tiles and modules each role can access.</p>
                {moduleResult && (
                  <div className="alert alert-success py-2 small fw-bold">{moduleResult}</div>
                )}
                <form onSubmit={handleSaveModuleAccess}>
                  <div className="mb-4">
                    <label className="erp-label">Target Role</label>
                    <select className="form-select erp-input" value={moduleRole} onChange={(event) => setModuleRole(event.target.value)}>
                      {Object.keys(allowedModulesByRole).map((roleKey) => (
                        <option key={roleKey}>{roleKey}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-light p-3 border rounded mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="d-flex flex-column gap-2">
                      {modulePlaceholders.map((module) => (
                        <label key={module.id} className="form-check d-flex align-items-center m-0">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            checked={selectedModules.includes(module.id)}
                            onChange={() => handleToggleModule(module.id)}
                            disabled={moduleRole === "Admin" && module.id === "admin"}
                          />
                          <span className="form-check-label small fw-semibold text-dark">{module.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-dark erp-btn w-100 fw-bold" type="submit">
                    Save Module Policies
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* USER MANAGEMENT TABLE */}
        <div className="erp-panel shadow-sm mb-5">
          <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
            <span className="fw-bold">Active User Roster</span>
            <span className="badge bg-secondary">{users.length} Users</span>
          </div>
          <div className="erp-table-container overflow-auto bg-white" style={{ maxHeight: '400px' }}>
            <table className="table erp-table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>User Type</th>
                  <th className="text-center">Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="fw-bold font-monospace text-dark">{user.username}</td>
                    <td>{user.name || '---'}</td>
                    <td className="text-muted">{user.email || '---'}</td>
                    <td><span className="erp-status-tag tag-info">{user.role || 'OperationsWorker'}</span></td>
                    <td><span className="erp-status-tag tag-warning">{user.userType || 'WORKER'}</span></td>
                    <td className="text-center">
                      <span className={`erp-status-tag ${user.status === 'Active' ? 'tag-success' : 'tag-danger'}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="text-muted small">{user.createdDate ? new Date(user.createdDate).toLocaleDateString() : '---'}</td>
                    <td className="text-muted small">{user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : '---'}</td>
                    <td className="text-end pe-3">
                      <div className="btn-group shadow-sm">
                        <button className="btn btn-sm btn-light border erp-btn text-primary" onClick={() => handleEditUser(user)}>Edit</button>
                        {user.status === 'Active' ? (
                          <button className="btn btn-sm btn-light border erp-btn text-warning" onClick={() => handleBlockUser(user.id)}>Block</button>
                        ) : (
                          <button className="btn btn-sm btn-light border erp-btn text-success" onClick={() => handleUnblockUser(user.id)}>Unblock</button>
                        )}
                        <button className="btn btn-sm btn-light border erp-btn text-danger" onClick={() => handleDeleteUser(user.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* WORKER MONITOR SECTION */}
        <div className="erp-panel shadow-sm mb-4">
          <div className="erp-panel-header bg-light">
            <span className="fw-bold">Worker Activity & Telemetry</span>
          </div>
          <div className="p-4 bg-white">
            <WorkerMonitor />
          </div>
        </div>

      </div>

      <style>{`
        /* --- ERP THEME CSS --- */
        :root {
          --erp-primary: #0f4c81;
          --erp-bg: #eef2f5;
          --erp-surface: #ffffff;
          --erp-border: #cfd8dc;
          --erp-text-main: #263238;
          --erp-text-muted: #607d8b;
        }

        .erp-app-wrapper {
          background-color: var(--erp-bg);
          color: var(--erp-text-main);
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 0.85rem;
        }

        .erp-text-muted { color: var(--erp-text-muted) !important; }

        /* Panels */
        .erp-panel {
          background: var(--erp-surface);
          border: 1px solid var(--erp-border);
          border-radius: 4px;
          overflow: hidden;
        }
        .erp-panel-header {
          border-bottom: 1px solid var(--erp-border);
          padding: 12px 16px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #34495e;
        }

        /* Inputs & Buttons */
        .erp-input {
          border-radius: 3px;
          border-color: #b0bec5;
          font-size: 0.85rem;
          padding: 6px 10px;
        }
        .erp-input:focus {
          border-color: var(--erp-primary);
          box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
        }
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.8rem;
          padding: 6px 14px;
        }
        .erp-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 4px;
          display: block;
        }
        .erp-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #90a4ae;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--erp-border);
          padding-bottom: 4px;
          margin-bottom: 12px;
        }

        /* Data Table */
        .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
        .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
        .erp-table { font-size: 0.8rem; }
        .erp-table thead th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.7rem;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #cbd5e1;
          padding: 8px 12px;
          white-space: nowrap;
        }
        .erp-table tbody td {
          padding: 8px 12px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
        
        .worker-link {
          color: var(--erp-primary);
          text-decoration: none;
          cursor: pointer;
          font-weight: 700;
        }
        .worker-link:hover {
          text-decoration: underline;
        }

        /* Modals / Dialogs */
        .erp-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(38, 50, 56, 0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 1050;
        }
        .erp-dialog {
          background: var(--erp-surface);
          border-radius: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .erp-dialog-lg { max-width: 900px; }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 12px 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .erp-dialog-body {
          padding: 20px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

// --------------------------------------------------------------------------
// WORKER MONITOR SUB-COMPONENT
// --------------------------------------------------------------------------
function WorkerMonitor() {
  const [workerData, setWorkerData] = useState([]);
  const [scannerOperations, setScannerOperations] = useState([]);
  const [, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    workerName: '',
    warehouseId: ''
  });

  // State for the Worker History Modal
  const [selectedWorkerHistory, setSelectedWorkerHistory] = useState(null);

  const loadWorkerData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.workerName) params.workerName = filters.workerName;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;

      const response = await smartErpApi.getWorkerMonitor(params);
      setWorkerData(response.data || []);
    } catch (err) {
      console.error('Failed to load worker data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadScannerOperations = useCallback(async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.workerName) params.workerName = filters.workerName;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;

      const response = await smartErpApi.getScannerOperations(params);
      setScannerOperations(response.data || []);
    } catch (err) {
      console.error('Failed to load scanner operations:', err);
    }
  }, [filters]);

  useEffect(() => {
    loadWorkerData();
    loadScannerOperations();
  }, [loadWorkerData, loadScannerOperations]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Derived data for the modal
  const workerHistoryData = useMemo(() => {
    if (!selectedWorkerHistory) return [];
    return scannerOperations.filter(op => op.worker === selectedWorkerHistory);
  }, [scannerOperations, selectedWorkerHistory]);

  return (
    <div>
      {/* Filters */}
      <div className="row g-3 mb-4 bg-light p-3 border rounded">
        <div className="col-md-3">
          <label className="erp-label">Start Date</label>
          <input type="date" className="form-control erp-input" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="erp-label">End Date</label>
          <input type="date" className="form-control erp-input" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="erp-label">Worker Name</label>
          <input type="text" className="form-control erp-input" value={filters.workerName} onChange={(e) => handleFilterChange('workerName', e.target.value)} placeholder="Search by name" />
        </div>
        <div className="col-md-3">
          <label className="erp-label">Warehouse</label>
          <select className="form-select erp-input" value={filters.warehouseId} onChange={(e) => handleFilterChange('warehouseId', e.target.value)}>
            <option value="">All Warehouses</option>
            {/* Add warehouse options here if fetched */}
          </select>
        </div>
      </div>

      <div className="row g-4">
        {/* Worker Activity Table */}
        <div className="col-lg-12">
          <h6 className="erp-section-title">Session Activity</h6>
          <div className="erp-table-container border rounded overflow-auto" style={{ maxHeight: '300px' }}>
            <table className="table erp-table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Worker Name</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>IP / Device</th>
                  <th className="text-center">Items Scanned</th>
                  <th className="text-center">IN / OUT</th>
                  <th className="text-center">Transfers</th>
                  <th>Warehouse Location</th>
                </tr>
              </thead>
              <tbody>
                {workerData.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">No worker activity recorded.</td></tr>
                ) : (
                  workerData.map((worker, index) => (
                    <tr key={index}>
                      <td>
                        <span 
                          className="worker-link" 
                          onClick={() => setSelectedWorkerHistory(worker.workerName)}
                          title="Click to view detailed working history"
                        >
                          {worker.workerName}
                        </span>
                      </td>
                      <td className="text-muted small">{worker.loginTime ? new Date(worker.loginTime).toLocaleString() : '-'}</td>
                      <td className="text-muted small">{worker.logoutTime ? new Date(worker.logoutTime).toLocaleString() : '-'}</td>
                      <td>
                        <div className="font-monospace small">{worker.ipAddress || '-'}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{worker.device || '-'}</div>
                      </td>
                      <td className="text-center fw-bold">{worker.itemsScanned || 0}</td>
                      <td className="text-center">
                        <span className="text-success fw-bold me-1">{worker.stockInCount || 0}</span> / 
                        <span className="text-danger fw-bold ms-1">{worker.stockOutCount || 0}</span>
                      </td>
                      <td className="text-center fw-bold text-info">{worker.transfers || 0}</td>
                      <td className="text-muted">{worker.warehouseUsed || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scanner Operations Table */}
        <div className="col-lg-12">
          <h6 className="erp-section-title mt-2">Raw Scanner Telemetry</h6>
          <div className="erp-table-container border rounded overflow-auto" style={{ maxHeight: '300px' }}>
            <table className="table erp-table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Worker Identity</th>
                  <th>Timestamp</th>
                  <th>Item Ref</th>
                  <th>Warehouse</th>
                  <th>Lot / Serial</th>
                  <th>Action</th>
                  <th className="text-end">Qty</th>
                </tr>
              </thead>
              <tbody>
                {scannerOperations.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-4 text-muted">No scanner telemetry events found.</td></tr>
                ) : (
                  scannerOperations.map((op, index) => (
                    <tr key={index}>
                      <td>
                        <span 
                          className="worker-link" 
                          onClick={() => setSelectedWorkerHistory(op.worker)}
                          title="Click to view detailed working history"
                        >
                          {op.worker}
                        </span>
                      </td>
                      <td className="text-muted small">{op.time ? new Date(op.time).toLocaleString() : '-'}</td>
                      <td className="fw-bold font-monospace">{op.item}</td>
                      <td>{op.warehouse}</td>
                      <td>
                        <div className="font-monospace small">{op.lot || '-'}</div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>{op.serialNumbers}</div>
                      </td>
                      <td><span className="erp-status-tag tag-secondary">{op.action}</span></td>
                      <td className={`text-end fw-bold font-monospace ${op.quantity < 0 ? 'text-danger' : 'text-success'}`}>{op.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* WORKER HISTORY MODAL */}
      {selectedWorkerHistory && (
        <div className="erp-modal-overlay" onClick={() => setSelectedWorkerHistory(null)}>
          <div className="erp-dialog erp-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="erp-dialog-header">
              <h5 className="m-0 fw-bold">Working History: {selectedWorkerHistory}</h5>
              <button className="btn-close btn-close-white" onClick={() => setSelectedWorkerHistory(null)}></button>
            </div>
            <div className="erp-dialog-body bg-light p-0">
              <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                <span className="fw-bold text-dark">Detailed Scanner Log</span>
                <span className="badge bg-primary">{workerHistoryData.length} Events</span>
              </div>
              <div className="p-3">
                <div className="border rounded overflow-hidden bg-white shadow-sm">
                  <table className="table erp-table table-sm table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Time</th>
                        <th>Action</th>
                        <th>Item</th>
                        <th>Location</th>
                        <th>Lot / Serial</th>
                        <th className="text-end">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workerHistoryData.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No historical operations found for this worker.</td></tr>
                      ) : (
                        workerHistoryData.map((op, idx) => (
                          <tr key={idx}>
                            <td className="text-muted" style={{ fontSize: '0.75rem' }}>{op.time ? new Date(op.time).toLocaleString() : '-'}</td>
                            <td><span className="erp-status-tag tag-secondary">{op.action}</span></td>
                            <td className="fw-bold font-monospace text-dark">{op.item}</td>
                            <td>{op.warehouse}</td>
                            <td className="font-monospace small text-muted">{op.lot || '-'}<br/>{op.serialNumbers}</td>
                            <td className={`text-end fw-bold font-monospace ${op.quantity < 0 ? 'text-danger' : 'text-success'}`}>{op.quantity}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-3 bg-white border-top text-end">
              <button className="btn btn-secondary erp-btn px-4" onClick={() => setSelectedWorkerHistory(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




