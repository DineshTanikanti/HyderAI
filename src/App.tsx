import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Health from './pages/Health';
import Groups from './pages/Groups';
import Analytics from './pages/Analytics';
import Reminders from './pages/Reminders';
import Onboarding from './pages/Onboarding';
import { useHydrationStore } from './lib/hydration-store';

function App() {
  const { user, loading, fetchUserData } = useHydrationStore();

  useEffect(() => {
    // Initial fetch when app starts
    fetchUserData();

    // REAL-TIME SYNC: This triggers every time you switch back to the app
    // or unlock your phone while the tab is open.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUserData();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchUserData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/onboarding" element={!user ? <Onboarding /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/onboarding" />}>
          <Route index element={<Dashboard />} />
          <Route path="health" element={<Health />} />
          <Route path="groups" element={<Groups />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reminders" element={<Reminders />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;