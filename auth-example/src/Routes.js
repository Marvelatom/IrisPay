import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import "./Auth.css"
import Dashboard from './Dashboard';
import  Profile  from '../src/Profile';
import Settings from './Settings';



function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} /> 
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard/>}/>
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/Settings' element={<Settings/>}/>
       
      </Routes>
    </Router>
  );
}

export default AppRoutes;
