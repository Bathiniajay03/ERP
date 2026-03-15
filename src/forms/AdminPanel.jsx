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
    role: "Operator",
    mfaEnabled: false
  });

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [moduleRole, setModuleRole] = useState("Operator");
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
          onSubmit={handleSubmit}
          autoComplete="off"
        >

          <div className="col-md-4">
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

          <div className="col-md-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4">
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

          <div className="col-md-4">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleChange}
            >
              <option>Admin</option>
              <option>Warehouse Manager</option>
              <option>Operator</option>
              <option>Finance Manager</option>
              <option>Robot Supervisor</option>
            </select>
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
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>

        </form>

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
