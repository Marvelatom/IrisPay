import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ViewStatements.css'; // Create a CSS file for styling if needed
import { format } from 'date-fns';

const ViewStatements = ({ transactions, onClose }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating a data load or fetch call
    setTimeout(() => {
      setLoading(false); // Assuming data is loaded after 2 seconds
    }, 2000);
  }, []);

  return (
    <div className="statements-overlay">
      <div className="statements-content">
        <h2>Transaction Statements</h2>
        <button onClick={onClose} className="close-statements" aria-label="Close Statement">
          Close
        </button>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="statements-list">
            {transactions.length === 0 ? (
              <p className="no-transactions-message">No transactions found. Please try again later.</p>
            ) : (
              <ul>
                {transactions.map((transaction, index) => (
                  <li key={index}>
                    <span>{format(new Date(transaction.date), 'MM/dd/yyyy')}</span>
                    <span>{transaction.description}</span>
                    <span>{transaction.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ViewStatements.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ViewStatements;
