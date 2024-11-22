import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';
import { toast } from 'react-toastify';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [irisRegistered, setIrisRegistered] = useState(false); // Track if iris registration is completed
  const [isLoading, setIsLoading] = useState(false); // For loading state
  const [isProcessing, setIsProcessing] = useState(false); // Track if Python script is running
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!irisRegistered) {
      toast.error('Please register your iris before signing up.');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Trigger the Python script to process the image
      setIsProcessing(true);

      const pythonResponse = await fetch('https://irispay.onrender.com/api/run-python-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      

      const pythonData = await pythonResponse.json();

      if (pythonResponse.ok) {
        setIrisRegistered(true); // Mark iris as registered
        

        // 2. Proceed with user registration now that iris is registered
        const userData = { email, password, name, phone, dob, bankName, ifscCode };

        const response = await fetch('https://irispay.onrender.com/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
          setError('');
          localStorage.setItem('user', JSON.stringify(userData));
          navigate('/Dashboard');
          // toast.success('Signup successful!');
        } else {
          setError(data.error);
          toast.error(data.error || 'Signup failed.');
        }
      } else {
        toast.error(pythonData.message || 'Failed to process iris image with Python script.');
      }
    } catch (error) {
      toast.error('An error occurred during signup.');
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleRegisterIris = async () => {
    try {
      setIsLoading(true);

      // 1. Trigger the iris capture process by sending a POST request to the backend
      const captureResponse = await fetch('https://irispay.onrender.com/api/auth/capture-iris-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const captureData = await captureResponse.json();

      if (!captureResponse.ok) {
        toast.error(captureData.message || 'Failed to capture iris image.');
        return;
      }

      // 2. Mark the iris registration as complete (no Python script execution)
      setIrisRegistered(true);
      toast.success('Iris registration complete!');
    } catch (error) {
      toast.error('An error occurred while processing the iris image.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Phone:</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Date of Birth:</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Bank Name:</label>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>IFSC Code:</label>
          <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button
          type="button"
          onClick={handleRegisterIris}
          className="auth-button"
          disabled={isLoading || isProcessing || irisRegistered}
        >
          {irisRegistered ? 'Iris Registered' : 'Register Iris'}
        </button>

        <button
          type="submit"
          className="auth-button"
          disabled={!irisRegistered || isLoading || isProcessing}
        >
          Sign Up
        </button>
      </form>

      <div className="auth-links">
        <Link to="/login">Already have an account? Login</Link>
      </div>

      {(isLoading || isProcessing) && (
        <div className="loading-form">
          <div className="loading-message">
            {isProcessing
              ? 'Processing Iris Registration...'
              : 'Please wait, your data is being processed...'}
          </div>
          <div className="spinner"></div>
        </div>
      )}

      {irisRegistered && (
        <div className="success-message">Iris registration complete!</div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default Signup;
