import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useHydrationStore } from './lib/hydration-store';
import { supabase } from './lib/supabase';

// Component/Page Imports
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Reminders from './pages/Reminders';
import Onboarding from './pages/Onboarding';
import Groups from './pages/Groups';
import Health from './pages/Health';

function App() {
  const { user, fetchUserData, loading } = useHydrationStore();

  useEffect(() => {
    // Initial data fetch
    fetchUserData();

    // Listen for Auth changes (Sign In / Sign Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth Event:", event);
      fetchUserData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Initializing HydrAI...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding Route: Only accessible if NOT logged in */}
        <Route 
          path="/onboarding" 
          element={!user ? <Onboarding /> : <Navigate to="/" replace />} 
        />
        
        {/* Protected Routes: Requires 'user' session */}
        <Route element={user ? <Layout /> : <Navigate to="/onboarding" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/health" element={<Health />} />
        </Route>

        {/* Catch-all: Redirect to home or onboarding */}
        <Route path="*" element={<Navigate to={user ? "/" : "/onboarding"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;