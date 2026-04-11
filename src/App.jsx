import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './lib/api.js';
import AdminPage from './pages/AdminPage.jsx';
import LegacySite from './pages/LegacySite.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    setError('');
    try {
      const payload = await api.getContent();
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (error) {
    return (
      <main className="admin-shell admin-container" style={{ paddingTop: '2rem' }}>
        <h1>Load error</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="admin-shell admin-container" style={{ paddingTop: '2rem' }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <div className="admin-shell">
            <AdminPage data={data} refresh={refresh} />
          </div>
        }
      />

      <Route path="/*" element={<LegacySite />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
