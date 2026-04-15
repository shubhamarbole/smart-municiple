import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Issues from './pages/Issues';
import IssueDetail from './pages/IssueDetail';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import PublicComplaintForm from './pages/PublicComplaintForm';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/report" element={<PublicComplaintForm />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
             <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/complaints" element={
          <PrivateRoute>
             <Complaints />
          </PrivateRoute>
        } />

        <Route path="/complaints/:id" element={
          <PrivateRoute>
             <ComplaintDetail />
          </PrivateRoute>
        } />
        
        <Route path="/issues" element={
          <PrivateRoute>
             <Issues />
          </PrivateRoute>
        } />

        <Route path="/issues/:id" element={
          <PrivateRoute>
             <IssueDetail />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
