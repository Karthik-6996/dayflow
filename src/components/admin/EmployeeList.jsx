/**
 * Dayflow — Employee List (Admin)
 * Searchable, filterable employee directory.
 */

import { useState } from 'react';

export default function EmployeeList({ employees, onSelect, loading }) {
  const [search, setSearch] = useState('');

  const filtered = employees.filter((emp) => {
    const s = search.toLowerCase();
    return (
      !s ||
      emp.name?.toLowerCase().includes(s) ||
      emp.email?.toLowerCase().includes(s) ||
      emp.department?.toLowerCase().includes(s) ||
      emp.employee_id?.toLowerCase().includes(s)
    );
  });

  if (loading) {
    return <div className="loading-container"><span className="loading-spinner"></span></div>;
  }

  return (
    <div>
      <div className="search-bar" style={{ marginBottom: 20 }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, email, department, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No employees found</h3>
          <p>Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const initials = (emp.name || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2);

                return (
                  <tr
                    key={emp.id}
                    className="animate-in"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelect?.(emp)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar">{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {emp.employee_id || '—'}
                      </span>
                    </td>
                    <td>{emp.department || '—'}</td>
                    <td>{emp.job_title || '—'}</td>
                    <td>
                      <span className={`badge ${emp.role === 'admin' ? 'badge-approved' : 'badge-pending'}`}>
                        <span style={{ fontSize: '0.5rem' }}>●</span>
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onSelect?.(emp); }}>
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
