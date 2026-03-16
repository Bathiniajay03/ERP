import React, { useEffect, useMemo, useState } from "react";
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
    mfaEnabled: false,
    name: "",
    smtpHost: "",
    smtpPort: "",
    smtpEmail: "",
    smtpPassword: ""
  });

  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [moduleRole, setModuleRole] = useState("OperationsWorker");
  const [moduleResult, setModuleResult] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);

  useEffect(() => {
    const current = allowedModulesByRole[moduleRole] || [];
    if (moduleRole === "Admin" && !current.includes("admin")) {
      setSelectedModules([...current, "admin"]);
    } else {
      setSelectedModules(current);
    }
  }, [allowedModulesByRole, moduleRole]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await smartErpApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const modulePlaceholders = useMemo(
    () =>
      moduleOptions.map((option) => ({
        id: option.id,
        label: typeof option.label === "function" ? option.label({ unreadCount: 0 }) : option.label
      })),
    [moduleOptions]
  );

  const handleToggleModule = (moduleId) => {
    setSelectedModules((current) =>
      current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId]
    );
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
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        await smartErpApi.updateUser(editingUser.id, form);
        setResult(`User updated: ${form.username}`);
      } else {
        const res = await smartErpApi.registerUser(form);
        setResult(`User created: ${res.data.username} (${res.data.role})`);
      }

      resetForm();
      loadUsers();

    } catch (err) {
      setResult(
        err?.response?.data ||
        "User operation failed"
      );
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
      mfaEnabled: user.mfaEnabled || false,
      name: user.name || "",
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
      setResult("User deleted successfully");
      loadUsers();
    } catch (err) {
      setResult("Failed to delete user");
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await smartErpApi.blockUser(userId);
      setResult("User blocked successfully");
      loadUsers();
    } catch (err) {
      setResult("Failed to block user");
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await smartErpApi.unblockUser(userId);
      setResult("User unblocked successfully");
      loadUsers();
    } catch (err) {
      setResult("Failed to unblock user");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setForm({
      username: "",
      email: "",
      password: "",
      role: "OperationsWorker",
      mfaEnabled: false,
      name: "",
      smtpHost: "",
      smtpPort: "",
      smtpEmail: "",
      smtpPassword: ""
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const res = await smartErpApi.registerUser(form);

      setResult(`User created: ${res.data.username} (${res.data.role})`);

      setForm({
        username: "",
        email: "",
        password: "",
        role: "Operator",
        mfaEnabled: false
      });

    } catch (err) {

      setResult(
        err?.response?.data ||
        "User registration failed"
      );

    }

    setLoading(false);
  };

  return (
    <div className="container-fluid py-4">

      <div className="card shadow-sm border-0 p-4" style={{ maxWidth: 900 }}>

        <h4 className="fw-bold">Admin & Security</h4>
        <p className="text-muted">Create ERP users and manage access.</p>

        {result && (
          <div className="alert alert-info">{result}</div>
        )}

        <form
          className="row g-3"
          onSubmit={handleUserSubmit}
          autoComplete="off"
        >

          <div className="col-md-3">
            <label className="form-label">Username</label>
            <input
              name="username"
              autoComplete="new-username"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Name</label>
            <input
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="off"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleChange}
            >
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

          {!editingUser && (
            <div className="col-md-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                required={!editingUser}
              />
            </div>
          )}

          <div className="col-md-3">
            <label className="form-label">SMTP Host</label>
            <input
              name="smtpHost"
              className="form-control"
              value={form.smtpHost}
              onChange={handleChange}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">SMTP Port</label>
            <input
              type="number"
              name="smtpPort"
              className="form-control"
              value={form.smtpPort}
              onChange={handleChange}
              placeholder="587"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">SMTP Email</label>
            <input
              type="email"
              name="smtpEmail"
              className="form-control"
              value={form.smtpEmail}
              onChange={handleChange}
              placeholder="user@company.com"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">SMTP Password</label>
            <input
              type="password"
              name="smtpPassword"
              className="form-control"
              value={form.smtpPassword}
              onChange={handleChange}
            />
          </div>

          <div className="col-12 d-flex align-items-center gap-2">
            <input
              id="mfaEnabled"
              name="mfaEnabled"
              type="checkbox"
              checked={form.mfaEnabled}
              onChange={handleChange}
            />
            <label htmlFor="mfaEnabled" className="form-label m-0">
              Enable MFA
            </label>
          </div>

          <div className="col-12">
            <button
              className="btn btn-primary me-2"
              disabled={loading}
            >
              {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
            </button>
            {editingUser && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>

        </form>

      </div>

      {/* User Management Table */}
      <div className="card shadow-sm border-0 p-4 mt-4" style={{ maxWidth: 1200 }}>
        <h5 className="fw-bold mb-3">User Management</h5>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.name || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>{user.role || 'OperationsWorker'}</td>
                  <td>
                    <span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td>{user.createdDate ? new Date(user.createdDate).toLocaleDateString() : '-'}</td>
                  <td>{user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : '-'}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </button>
                      {user.status === 'Active' ? (
                        <button
                          className="btn btn-outline-warning"
                          onClick={() => handleBlockUser(user.id)}
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-success"
                          onClick={() => handleUnblockUser(user.id)}
                        >
                          Unblock
                        </button>
                      )}
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Monitor Section */}
      <div className="card shadow-sm border-0 p-4 mt-4" style={{ maxWidth: 1200 }}>
        <h5 className="fw-bold mb-3">Worker Activity Monitor</h5>
        <WorkerMonitor />
      </div>

      <div className="card shadow-sm border-0 p-4 mt-4" style={{ maxWidth: 900 }}>
        <h5 className="fw-bold mb-2">Module Access</h5>
        <p className="text-muted mb-3">Control which navigation tiles each role can reach.</p>
        {moduleResult && (
          <div className="alert alert-success">{moduleResult}</div>
        )}
        <form className="row g-3" onSubmit={handleSaveModuleAccess}>
          <div className="col-md-4">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={moduleRole}
              onChange={(event) => setModuleRole(event.target.value)}
            >
              {Object.keys(allowedModulesByRole).map((roleKey) => (
                <option key={roleKey}>{roleKey}</option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <div className="row row-cols-2 g-2">
              {modulePlaceholders.map((module) => (
                <label key={module.id} className="form-check col d-flex align-items-center gap-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedModules.includes(module.id)}
                    onChange={() => handleToggleModule(module.id)}
                    disabled={moduleRole === "Admin" && module.id === "admin"}
                  />
                  <span className="form-check-label m-0">{module.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="col-12 text-end">
            <button className="btn btn-outline-primary" type="submit">
              Save module access
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

function WorkerMonitor() {
  const [workerData, setWorkerData] = useState([]);
  const [scannerOperations, setScannerOperations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    workerName: '',
    warehouseId: ''
  });

  useEffect(() => {
    loadWorkerData();
    loadScannerOperations();
  }, [filters]);

  const loadWorkerData = async () => {
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
  };

  const loadScannerOperations = async () => {
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
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-control"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-control"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Worker Name</label>
          <input
            type="text"
            className="form-control"
            value={filters.workerName}
            onChange={(e) => handleFilterChange('workerName', e.target.value)}
            placeholder="Search by name"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Warehouse</label>
          <select
            className="form-select"
            value={filters.warehouseId}
            onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
          >
            <option value="">All Warehouses</option>
            {/* Add warehouse options here */}
          </select>
        </div>
      </div>

      {/* Worker Activity Table */}
      <div className="mb-4">
        <h6>Worker Login/Logout Activity</h6>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>IP Address</th>
                <th>Device</th>
                <th>Items Scanned</th>
                <th>Stock IN</th>
                <th>Stock OUT</th>
                <th>Transfers</th>
                <th>Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {workerData.map((worker, index) => (
                <tr key={index}>
                  <td>{worker.workerName}</td>
                  <td>{worker.loginTime ? new Date(worker.loginTime).toLocaleString() : '-'}</td>
                  <td>{worker.logoutTime ? new Date(worker.logoutTime).toLocaleString() : '-'}</td>
                  <td>{worker.ipAddress || '-'}</td>
                  <td>{worker.device || '-'}</td>
                  <td>{worker.itemsScanned || 0}</td>
                  <td>{worker.stockInCount || 0}</td>
                  <td>{worker.stockOutCount || 0}</td>
                  <td>{worker.transfers || 0}</td>
                  <td>{worker.warehouseUsed || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scanner Operations Table */}
      <div>
        <h6>Scanner Operations</h6>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Item</th>
                <th>Warehouse</th>
                <th>Lot</th>
                <th>Serial Numbers</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {scannerOperations.map((op, index) => (
                <tr key={index}>
                  <td>{op.worker}</td>
                  <td>{op.item}</td>
                  <td>{op.warehouse}</td>
                  <td>{op.lot}</td>
                  <td>{op.serialNumbers}</td>
                  <td>{op.action}</td>
                  <td>{op.quantity}</td>
                  <td>{op.time ? new Date(op.time).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
