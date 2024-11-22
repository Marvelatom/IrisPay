import React, { useState, useRef,  } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './TransferMoneyModal.css';

const TransferMoneyModal = ({ onClose, onTransfer }) => {
  const [formData, setFormData] = useState({
    receiverName: '',
    upiId: '', // Replacing phone number with upiId
    amount: '',
  });
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State for loading screen
  const [isIrisVerified, setIsIrisVerified] = useState(false); // State to track verification status
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle iris verification
  const startCamera = () => {
    setShowCamera(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => console.error("Camera access denied", error));
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    const tracks = stream ? stream.getTracks() : [];
    tracks.forEach(track => track.stop());
    setShowCamera(false);
  };

  let counter = 1;  // Start with 1, and increase with each capture

  const captureImage = () => {
    if (!formData.receiverName || !formData.amount || isNaN(formData.amount) || formData.amount <= 0) {
      toast.error('Please provide a valid receiver and amount.');
      return;
    }
  
    setIsLoading(true);  // Set loading state to true
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
  
    context.putImageData(imageData, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/png');

    const filename = `300_1_${counter}.jpg`;
    counter++;
  
    // Sending the captured image
    fetch(imageDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const formDataToSend = new FormData();
        formDataToSend.append('irisImage', blob, filename);
  
        fetch("http://localhost:5000/api/upload-iris", {
          method: "POST",
          body: formDataToSend,
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Image saved:", data);
            toast.success("Image saved successfully!");
            stopCamera();
  
            // After image upload, proceed with iris verification
            fetch("http://localhost:5000/api/verify-iris", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ filename }),
            })
              .then((response) => response.json())
              .then((result) => {
                setIsLoading(false);
  
                // Check if verification is successful
                if (result.success) {
                  // Check if the iris verification is successful and match is found
                  if (result.match) {
                    // Verification successful, template is valid
                    setIsIrisVerified(true);
                    toast.success("Iris verification successful!");
                    
                    // After successful iris verification, trigger the transfer
                    createRazorpayOrder();  // Create payment order
                    onTransfer(formData);  // Save transaction on Dashboard
                    onClose();  // Close modal after transfer
                  } else {
                    // Verification failed due to no match found
                    toast.error("Iris verification failed: No match found.");
                  }
                } else {
                  // Iris verification failed (either error or no match)
                  toast.error("Iris verification failed.");
                }
              })
              .catch((error) => {
                console.error("Verification error:", error);
                toast.error("Verification failed.");
                setIsLoading(false);
              });
          })
          .catch((error) => {
            console.error("Error saving image:", error);
            toast.error("Failed to save image.");
            setIsLoading(false);
          });
      });
  };
  
  
  
  
  // Function to create Razorpay order after successful iris verification
 // Razorpay order creation function
const createRazorpayOrder = () => {
  fetch("http://localhost:5000/api/create-order", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,  // Add token from localStorage
    },
    body: JSON.stringify({
      amount: formData.amount,  // Amount from form data
      currency: 'INR',
    }),
  })
    .then((res) => res.json())
    .then((orderData) => {
      handleRazorpayPayment(orderData.id, orderData.amount);
    })
    .catch((error) => {
      console.error("Error creating Razorpay order:", error);
      toast.error("Payment creation failed.");
    });
};

  
  // Razorpay payment handler
 const handleRazorpayPayment = () => {
  const rzpLink = "https://rzp.io/rzp/ksmH3GK";  // Your Razorpay payment URL

  window.location.href = rzpLink;  // Redirect to the Razorpay URL
};

  


  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    if (!formData.receiverName || !formData.amount || isNaN(formData.amount) || formData.amount <= 0) {
      toast.error('Please provide valid receiver name and amount.');
      return;
    }

    // Proceed with transfer
    if (isIrisVerified) {
      onTransfer(formData); // Transfer money if iris is verified
      onClose(); // Close the modal after transfer
    } else {
      toast.error("Iris verification is required.");
    }
  };

  return (
    <>
      {/* Loading Screen */}
      {isLoading && (
        <div className="loading-screen">
          <div className="loading-content">
            <h2>Processing...</h2>
            <div className="spinner"></div> {/* You can style this spinner */}
          </div>
        </div>
      )}

      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Send Money</h2> {/* Changed "Transfer Money" to "Send Money" */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Receiver's Name:</label>
              <input
                type="text"
                name="receiverName"
                value={formData.receiverName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>UPI ID:</label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Verify Iris Button */}
            {!isIrisVerified && (
              <button type="button" onClick={startCamera} className="verify-iris-button">
                Verify Iris
              </button>
            )}

           
            <button type="button" onClick={onClose} className="close-modal">
              Close
            </button>
          </form>
        </div>

        {/* Camera Overlay */}
{showCamera && (
  <div className="camera-overlay">
    <div className="camera-content">
      <h2>Verify Iris</h2>

      {/* Set video element to 640x480 */}
      <video
        ref={videoRef}
        autoPlay
        width="640"
        height="480"
        style={{ border: '2px solid #ccc' }}
      ></video>

      <button type="button" onClick={captureImage} className="capture-button">
        Capture
      </button>

      {/* Canvas with the same dimensions as video */}
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ display: 'none' }}
      ></canvas>

      <button type="button" onClick={stopCamera} className="close-camera">
        Close Camera
      </button>
    </div>
  </div>
)}

      </div>

      {/* Toast Notifications Container */}
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
};

export default TransferMoneyModal;
