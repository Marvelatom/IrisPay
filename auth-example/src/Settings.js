import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';  // Import the CSS file
import Navbar from "./Navbar"

const Settings = () => {
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    const user = localStorage.getItem('user');
    if (!user) {
      console.error('No user found in localStorage');
      return;
    }
  
    const { email } = JSON.parse(user);
  
    // Remove user data from localStorage
    localStorage.removeItem('user');
  
    try {
      const response = await fetch('http://localhost:5000/api/auth/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log('Account successfully deleted');
        navigate('/login');
      } else {
        console.error('Account deletion failed:', data.error);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };
  
  
  

  return (
    <div className="settings-container">
      <Navbar/>
      <h2>Settings</h2>
      <p className="warning-message">Warning: Deleting your account is permanent and cannot be undone.</p>
      <button onClick={handleDeleteAccount}>Delete Account</button>
    </div>
  );
};

export default Settings;
