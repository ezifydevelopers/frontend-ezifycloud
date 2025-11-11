import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LeaveManagementPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Leave Dashboard by default
    navigate('/admin/leave-management/dashboard', { replace: true });
  }, [navigate]);

  return null;
};

export default LeaveManagementPage;