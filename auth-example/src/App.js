import React from 'react';
import AppRoutes from './Routes';
import "./Auth.css"
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <div className="App">
      <AppRoutes />
      <ToastContainer />
    </div>
  );
}

export default App;
