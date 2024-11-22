import React, { useState, useEffect } from 'react';
import './Profile.css';
import Navbar from "../src/Navbar";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to retrieve user data from localStorage
  const getUserFromLocalStorage = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing user data from localStorage', error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    setUser(getUserFromLocalStorage());
    setLoading(false); // Set loading to false after fetching data
  }, []);

  return (
    <div className="profile-container">
      <Navbar />
      <h1>User Profile</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>Details</h2>
          {user ? (
            <>
              <p><strong>Name:</strong> {user?.name || 'Not provided'}</p>
              <p><strong>Email:</strong> {user?.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
              <p><strong>Date of Birth:</strong> {user?.dob || 'Not provided'}</p>
              <p><strong>Bank Name:</strong> {user?.bankName || 'Not provided'}</p>
              <p><strong>IFSC Code:</strong> {user?.ifscCode || 'Not provided'}</p>
            </>
          ) : (
            <p>No user data available.</p>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
