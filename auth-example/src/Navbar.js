// NavBar.js
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import "./Navbar.css";

function NavBar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (e.g., via cookie, local storage, or an API call)
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsAuthenticated(false); // Update authentication state
        localStorage.removeItem('user'); // Clear user data from local storage
        navigate('/login'); // Redirect to login page after successful sign-out
      } else {
        const errorData = await response.json();
        console.error('Failed to sign out:', errorData.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-logo">
        <Link to="/dashboard">MyBankApp</Link>
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink to="/dashboard" activeClassName="active">Home</NavLink>
        </li>
        <li>
          <NavLink to="/profile" activeClassName="active">Profile</NavLink>
        </li>
        <li>
          <NavLink to="/settings" activeClassName="active">Settings</NavLink>
        </li>
        <li>
          {isAuthenticated ? (
            <Link to="#" onClick={handleSignOut}>Logout</Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
