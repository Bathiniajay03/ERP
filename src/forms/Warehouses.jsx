import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({ code: '', name: '' });
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const sanitize = (str) => str.replace(/[^A-Za-z0-9\- ]/g, '').trim();

  const handleAdd = async (e) => {
    e.preventDefault();

    const code = sanitize(form.code).toUpperCase().replace(/\s+/g, '-');
    const name = sanitize(form.name);

    if (!/[A-Z]/.test(code)) {
      alert('Warehouse code must include a letter.');
      return;
    }

    const exists = warehouses.some((w) =>
      w.code.toLowerCase() === code.toLowerCase() ||
      w.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert('A warehouse with that code or name already exists.');
      return;
    }

    try {
      await api.post(`/warehouses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`);
      setForm({ code: '', name: '' });
      fetchWarehouses();
    } catch (e) {
      console.error(e);
      alert('Failed to create warehouse');
    }
  };

  const filtered = warehouses.filter((w) => w.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Warehouse Management</h2>
          <p style={styles.subText}>Create and manage storage locations</p>
        </div>
      </div>

      <div style={styles.card}>
        <h4 style={styles.sectionTitle}>Add New Warehouse</h4>

        <form onSubmit={handleAdd} style={styles.formGrid}>
          <div>
            <label style={styles.label}>Warehouse Code</label>
            <input
              style={styles.input}
              placeholder="e.g. KNR-MAIN"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={styles.label}>Warehouse Name</label>
            <input
              style={styles.input}
              placeholder="e.g. Karimnagar Main"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button style={styles.primaryBtn}>Add Warehouse</button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.tableHeader}>
          <h4 style={styles.sectionTitle}>Warehouse List</h4>
          <input
            style={styles.filterInput}
            placeholder="Search warehouses..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th>Code</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((w) => (
                  <tr key={w.id} style={styles.row}>
                    <td style={styles.codeCell}>{w.code}</td>
                    <td>{w.name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={styles.noData}>No warehouses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '30px', background: '#f4f6f9', minHeight: '100vh' },
  header: { marginBottom: '25px' },
  subText: { color: '#6b7280', marginTop: '5px' },
  card: { background: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  sectionTitle: { marginBottom: '20px', fontWeight: 600 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 500 },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' },
  primaryBtn: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  filterInput: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', width: '250px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#111827', color: '#fff' },
  row: { borderBottom: '1px solid #eee' },
  codeCell: { fontWeight: 600, letterSpacing: '0.5px' },
  noData: { textAlign: 'center', padding: '30px', color: '#6b7280' }
};
