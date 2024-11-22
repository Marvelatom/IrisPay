import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import NavBar from './Navbar';
import TransferMoneyModal from './TransferMoneyModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewStatements from './ViewStatements';

function Dashboard() {
  const initialBalance = 10000.0;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStatements, setShowStatements] = useState(false);
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false); // For loading state during transfer

  useEffect(() => {
    const storedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    setTransactions(storedTransactions);

    const storedBalance = parseFloat(localStorage.getItem('balance'));
    const lastResetTimestamp = localStorage.getItem('lastReset');

    if (lastResetTimestamp) {
      const elapsedTime = Date.now() - lastResetTimestamp;
      if (elapsedTime >= 24 * 60 * 60 * 1000) {
        setBalance(initialBalance);
        setTransactions([]);
        localStorage.setItem('transactions', JSON.stringify([]));
        localStorage.setItem('balance', initialBalance.toFixed(2));
        localStorage.setItem('lastReset', Date.now());
      } else if (!isNaN(storedBalance)) {
        setBalance(storedBalance);
      }
    } else {
      localStorage.setItem('lastReset', Date.now());
    }
  }, []); // Empty dependency array ensures it runs only on initial mount
  

  const updateLocalStorage = (updatedTransactions, newBalance) => {
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    localStorage.setItem('balance', newBalance.toFixed(2));
  };

  const handleTransferClick = () => {
    setIsModalOpen(true); // Open the transfer modal
    setShowStatements(false); // Close ViewStatements if it was open
  };

  const handleViewStatements = () => {
    setShowStatements(true);
    setIsModalOpen(false); // Close TransferMoneyModal if it was open
  };
  const handleTransfer = (formData) => {
    const { receiverName, amount } = formData;
    const transferAmount = parseFloat(amount);
  
    if (transferAmount > balance) {
      toast.error('Insufficient balance for this transfer.');
      return;
    }
  
    setLoading(true); // Start loading state
  
    const newBalance = balance - transferAmount;
    setBalance(newBalance); // Update balance state immediately
    console.log("Balance updated:", newBalance); // Log to ensure balance update happens
  
    const newTransaction = {
      description: `Transfer to ${receiverName}`,
      amount: `-₹${transferAmount.toFixed(2)}`,
      date: new Date().toLocaleString(),
    };
  
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions); // Update the transactions list
  
    // Update local storage with new balance and transactions
    updateLocalStorage(updatedTransactions, newBalance);
  
    // Log to confirm localStorage update
    console.log("LocalStorage updated with balance:", newBalance);
    setLoading(false); // Stop loading state
  };
  
  

  const closeModalAfterToast = () => {
    // Delay closing modal until the toast finishes
    setTimeout(() => {
      setIsModalOpen(false);
      setShowStatements(false);
    }, 2000); // Adjust the delay to match the toast duration
  };

  return (
    <div className="dashboard-container">
      <NavBar />
      <header className="dashboard-header">
        <h1>Welcome to Your Bank</h1>
      </header>

      <div className="dashboard-content">
        <div className="balance-section">
          <h2>Account Balance</h2>
          <p>₹{balance.toFixed(2)}</p>
        </div>

        <div className="transactions-section">
          <h2>Recent Transactions</h2>
          <ul>
            {transactions.map((transaction, index) => (
              <li key={index}>
                <span>{transaction.description}</span>
                <span>{transaction.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="actions-section">
          <button onClick={handleTransferClick}>Transfer Money</button>
          <button onClick={handleViewStatements}>View Statements</button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing your request...</p>
        </div>
      )}

      {isModalOpen && (
        <TransferMoneyModal
          onClose={() => closeModalAfterToast()} // Close after toast finishes
          onTransfer={handleTransfer}
        />
      )}

      {showStatements && (
        <ViewStatements
          transactions={transactions}
          onClose={() => setShowStatements(false)}
        />
      )}

      <ToastContainer />
    </div>
  );
}

export default Dashboard;
