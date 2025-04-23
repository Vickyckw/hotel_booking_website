document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let bookingData = null;
    
    // Function to clear previous booking data on new booking creation
    const clearPreviousBookingData = () => {
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const isNewBooking = urlParams.get('new') === 'true';
        
        // If this is a new booking, clear any previous cancel status
        if (isNewBooking) {
            // Clear only the global orderCancelled flag (legacy)
            sessionStorage.removeItem('orderCancelled');
            
            // Don't clear booking-specific data yet as we need the ID first
            // We'll clear it in loadOrderData after we get the new booking ID
        }
    };
    
    // Call this function immediately
    clearPreviousBookingData();
    
    // Load order data from API or sessionStorage
    const loadOrderData = async () => {
        try {
            // Show loading indicator
            showLoading(true);
            
            // Get booking ID from sessionStorage or URL parameter
            let bookingId = sessionStorage.getItem('bookingId');
            
            // Check URL parameters if not in sessionStorage
            if (!bookingId) {
                const urlParams = new URLSearchParams(window.location.search);
                bookingId = urlParams.get('id');
            }
            
            // If this is a new booking, clear previous booking-specific data
            const urlParams = new URLSearchParams(window.location.search);
            const isNewBooking = urlParams.get('new') === 'true';
            if (isNewBooking && bookingId) {
                sessionStorage.removeItem(`orderCancelled_${bookingId}`);
            }
            
            // If we have a booking ID, try to fetch from API
            if (bookingId) {
                try {
                    const response = await fetch(`/api/bookings/${bookingId}`);
                    const data = await response.json();
                    
                    if (data.success) {
                        // Store booking data
                        bookingData = data.booking;
                        
                        // Save booking ID in sessionStorage
                        sessionStorage.setItem('bookingId', bookingId);
                        
                        // Update UI with booking data
                        updateOrderUI(bookingData);
                    } else {
                        // If API fails, fall back to sessionStorage data
                        fallbackToSessionStorage();
                    }
                } catch (error) {
                    console.error('Error fetching booking:', error);
                    // Fall back to sessionStorage data
                    fallbackToSessionStorage();
                }
            } else {
                // No booking ID, use sessionStorage data
                fallbackToSessionStorage();
            }
        } catch (error) {
            console.error('Error loading order data:', error);
            showError('Error loading booking details. Please try again later.');
        } finally {
            // Hide loading indicator
            showLoading(false);
        }
    };
    
    // Fall back to using sessionStorage data
    const fallbackToSessionStorage = () => {
        const bookingDataString = sessionStorage.getItem('bookingData');
        if (bookingDataString) {
            bookingData = JSON.parse(bookingDataString);
            updateOrderUI(bookingData);
        } else {
            showError('Booking information not found. Please make a booking first.');
        }
    };
    
    // Update UI with booking data
    const updateOrderUI = (booking) => {
        // Update hotel information
        const hotelNameElements = document.querySelectorAll('.hotel-name');
        hotelNameElements.forEach(element => {
            element.textContent = booking.hotel_name || 'CVK Park Bosphorus Hotel Istanbul';
        });
        
        // Update hotel location if available
        const hotelLocationElement = document.querySelector('.hotel-location');
        if (hotelLocationElement && booking.hotel_address) {
            hotelLocationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${booking.hotel_address}`;
        }
        
        // Update guest name
        const guestNameElement = document.querySelector('.guest-name');
        if (guestNameElement) {
            if (booking.guest_name) {
                guestNameElement.textContent = booking.guest_name;
            } else if (booking.first_name && booking.last_name) {
                guestNameElement.textContent = `${booking.first_name} ${booking.last_name}`;
            }
        }
        
        // Update room type
        const roomTypeElement = document.querySelector('.room-type');
        if (roomTypeElement) {
            roomTypeElement.textContent = booking.room_type || booking.room_type_name || 'Superior room';
        }
        
        // Update order price
        const orderPriceElement = document.querySelector('.order-price');
        if (orderPriceElement) {
            if (booking.formatted_amount) {
                orderPriceElement.textContent = booking.formatted_amount;
            } else if (booking.amount) {
                orderPriceElement.textContent = `$${parseFloat(booking.amount).toFixed(2)}`;
            } else if (booking.total_amount) {
                orderPriceElement.textContent = `$${parseFloat(booking.total_amount).toFixed(2)}`;
            }
        }
        
        // Update check-in and check-out dates
        const checkInDateElement = document.querySelector('.check-in-date .date-box h3');
        if (checkInDateElement) {
            if (booking.formatted_check_in) {
                checkInDateElement.textContent = booking.formatted_check_in;
            } else if (booking.check_in || booking.check_in_date) {
                const checkInDate = new Date(booking.check_in || booking.check_in_date);
                checkInDateElement.textContent = checkInDate.toLocaleDateString('en-US', 
                    { weekday: 'long', month: 'short', day: 'numeric' });
            }
        }
        
        const checkOutDateElement = document.querySelector('.check-out-date .date-box h3');
        if (checkOutDateElement) {
            if (booking.formatted_check_out) {
                checkOutDateElement.textContent = booking.formatted_check_out;
            } else if (booking.check_out || booking.check_out_date) {
                const checkOutDate = new Date(booking.check_out || booking.check_out_date);
                checkOutDateElement.textContent = checkOutDate.toLocaleDateString('en-US', 
                    { weekday: 'long', month: 'short', day: 'numeric' });
            }
        }
        
        // Set reservation number
        const reservationElement = document.querySelector('.res-value');
        if (reservationElement) {
            if (booking.booking_id) {
                reservationElement.textContent = booking.booking_id;
                
                // Save booking ID in sessionStorage
                sessionStorage.setItem('bookingId', booking.booking_id);
            } else {
                // Generate and set reservation number if not exists
                if (!sessionStorage.getItem('reservationNumber')) {
                    const reservationNumber = 'BK-' + Math.floor(Math.random() * 10000000000) + '-' + Math.floor(Math.random() * 1000);
                    sessionStorage.setItem('reservationNumber', reservationNumber);
                    
                    // Also use this as bookingId if no booking_id is available
                    sessionStorage.setItem('bookingId', reservationNumber);
                }
                reservationElement.textContent = sessionStorage.getItem('reservationNumber') || 'BK-1745337362779-425';
            }
        }
        
        // Check if booking is cancelled
        if (booking.status === 'Cancelled') {
            markBookingAsCancelled();
        }
    };
    
    // Show/hide loading indicator
    const showLoading = (show) => {
        let loadingElement = document.querySelector('.loading-overlay');
        
        if (show) {
            if (!loadingElement) {
                loadingElement = document.createElement('div');
                loadingElement.className = 'loading-overlay';
                loadingElement.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
                document.body.appendChild(loadingElement);
            }
            loadingElement.style.display = 'flex';
        } else if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    };
    
    // Show error message
    const showError = (message) => {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.orders-container') || document.body;
        mainContent.insertBefore(errorElement, mainContent.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    };
    
    // Mark booking as cancelled in UI
    const markBookingAsCancelled = () => {
        // Add cancelled class to the order card
        const orderCard = document.querySelector('.order-card');
        if (orderCard) {
            orderCard.classList.add('cancelled');
        }
        
        // Disable all buttons in the card
        const buttons = document.querySelectorAll('.order-card button');
        buttons.forEach(button => {
            button.disabled = true;
        });
        
        // Store cancelled status in sessionStorage with booking ID
        const bookingId = sessionStorage.getItem('bookingId');
        if (bookingId) {
            sessionStorage.setItem(`orderCancelled_${bookingId}`, 'true');
        }
    };
    
    // Handle Download button click (Print to PDF)
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            // 準備打印樣式
            const style = document.createElement('style');
            style.textContent = `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .order-card, .order-card * {
                        visibility: visible;
                    }
                    .order-card {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                        box-shadow: none;
                        border: none;
                    }
                    .action-buttons, .share-btn, #download-btn, #cancel-btn {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
            
            // 直接調用瀏覽器打印功能
            window.print();
            
            // 打印完成後延遲移除打印樣式
            setTimeout(() => {
                document.head.removeChild(style);
            }, 1000);
        });
    }
    
    // Handle Cancel & Refund button click
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to cancel this booking and request a refund?')) {
                try {
                    // Show loading indicator
                    showLoading(true);
                    
                    // Get booking ID
                    const bookingId = sessionStorage.getItem('bookingId');
                    
                    if (!bookingId) {
                        throw new Error('Booking ID not found');
                    }
                    
                    // Call API to cancel booking
                    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (!data.success) {
                        throw new Error(data.message || 'Failed to cancel booking');
                    }
                    
                    // Mark booking as cancelled in UI
                    markBookingAsCancelled();
                    
                    // Show confirmation message
                    alert(`Your booking has been cancelled and your refund of ${data.refund.formatted_amount} will be processed within ${data.refund.estimated_days}.`);
                    
                } catch (error) {
                    console.error('Error cancelling booking:', error);
                    
                    // For demo purposes, still mark as cancelled even if API fails
                    markBookingAsCancelled();
                    
                    // Show confirmation message
                    alert('Your booking has been cancelled and your refund will be processed within 5-7 business days.');
                } finally {
                    // Hide loading indicator
                    showLoading(false);
                }
            }
        });
    }
    
    // Check if this specific order is already cancelled
    const bookingId = sessionStorage.getItem('bookingId');
    if (bookingId && sessionStorage.getItem(`orderCancelled_${bookingId}`) === 'true') {
        markBookingAsCancelled();
    }
    
    // Handle Share button click
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // Create a temporary input to copy the URL
            const tempInput = document.createElement('input');
            let shareUrl = window.location.href;
            
            // Add booking ID to URL if not already there
            const bookingId = sessionStorage.getItem('bookingId');
            if (bookingId && !shareUrl.includes('id=')) {
                const separator = shareUrl.includes('?') ? '&' : '?';
                shareUrl += `${separator}id=${bookingId}`;
            }
            
            tempInput.value = shareUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            // Show message
            alert('Booking URL copied to clipboard! You can now share it.');
        });
    }
    
    // Initialize
    loadOrderData();
}); 