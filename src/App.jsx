import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './lib/api.js';
import AdminPage from './pages/AdminPage.jsx';
import LegacySite from './pages/LegacySite.jsx';

// Wrapper component to handle page transitions
function PageTransition({ children }) {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    if (key !== location.pathname) {
      setKey(location.pathname);
    }
  }, [location.pathname, key]);

  return (
    <div key={key} className="legacy-page-transition">
      {children}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  async function refresh() {
    setError('');
    try {
      const payload = await api.getContent();
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsInitialLoad(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (isInitialLoad && !data && !error) {
    return (
      <main className="admin-shell admin-container" style={{ paddingTop: '2rem' }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="admin-shell admin-container" style={{ paddingTop: '2rem' }}>
        <h1>Load error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <PageTransition>
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
    </PageTransition>
  );
}
