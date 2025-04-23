document.addEventListener('DOMContentLoaded', function() {
    // Change Account button event
    const changeAccountBtn = document.querySelector('.change-account-btn');
    if (changeAccountBtn) {
        changeAccountBtn.addEventListener('click', function() {
            console.log('Change Account button clicked');
            // Redirect to login page
            window.location.href = 'login.html';
        });
    } else {
        console.log('Change Account button not found');
    }
    
    // Handle date picker functionality
    const dateInputWrappers = document.querySelectorAll('.date-input-wrapper');
    
    dateInputWrappers.forEach(wrapper => {
        const dateInput = wrapper.querySelector('.date-input');
        const datePicker = wrapper.querySelector('.date-picker');
        const days = wrapper.querySelectorAll('.days div:not(.prev-month-day):not(.next-month-day)');
        const prevMonthDays = wrapper.querySelectorAll('.prev-month-day');
        const nextMonthDays = wrapper.querySelectorAll('.next-month-day');
        const clearButton = wrapper.querySelector('.clear-date');
        const todayButton = wrapper.querySelector('.today-date');
        const prevMonthButton = wrapper.querySelector('.prev-month');
        const nextMonthButton = wrapper.querySelector('.next-month');
        const currentMonthDisplay = wrapper.querySelector('.current-month');
        
        // Check if this date picker is inside the index page search section
        const isIndexSearchSection = wrapper.closest('.search-section');

        // Initial position setup based on context
        if (isIndexSearchSection) {
            // Position above for index search section
            datePicker.style.bottom = (dateInput.offsetHeight + 5) + 'px';
            datePicker.style.top = 'auto'; // Ensure top is not set
        } else {
            // Default position below for other pages
            datePicker.style.top = (dateInput.offsetHeight + 5) + 'px';
            datePicker.style.bottom = 'auto'; // Ensure bottom is not set
        }
        
        // Show/hide date picker
        dateInput.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Hide all other date pickers
            document.querySelectorAll('.date-picker').forEach(picker => {
                if (picker !== datePicker) {
                    picker.style.display = 'none';
                }
            });
            
            // Toggle this date picker
            const isCurrentlyVisible = datePicker.style.display === 'block';
            datePicker.style.display = isCurrentlyVisible ? 'none' : 'block';
            
            // Re-apply position when showing, based on context
            if (!isCurrentlyVisible) {
                if (isIndexSearchSection) {
                    datePicker.style.bottom = (dateInput.offsetHeight + 5) + 'px';
                    datePicker.style.top = 'auto'; 
                } else {
                    datePicker.style.top = (dateInput.offsetHeight + 5) + 'px';
                    datePicker.style.bottom = 'auto';
                }
            }
        });
        
        // Handle day selection
        days.forEach(day => {
            day.addEventListener('click', function() {
                // Remove selected class from all days
                days.forEach(d => d.classList.remove('selected'));
                
                // Add selected class to clicked day
                this.classList.add('selected');
                
                // Get current month and year from the display
                const [year, month] = currentMonthDisplay.textContent.split(' ');
                
                // Update input value with selected date
                dateInput.value = `${year}/${getMonthNumber(month)}/${this.textContent.trim()}`;
                
                // Hide date picker after selection
                datePicker.style.display = 'none';
            });
        });
        
        // Handle previous/next month days
        prevMonthDays.forEach(day => {
            day.addEventListener('click', function() {
                // Go to previous month and select this day
                // (simplified - in a real implementation, this would update the calendar)
                alert('Would navigate to previous month');
            });
        });
        
        nextMonthDays.forEach(day => {
            day.addEventListener('click', function() {
                // Go to next month and select this day
                // (simplified - in a real implementation, this would update the calendar)
                alert('Would navigate to next month');
            });
        });
        
        // Clear button
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                dateInput.value = '';
                datePicker.style.display = 'none';
            });
        }
        
        // Today button
        if (todayButton) {
            todayButton.addEventListener('click', function() {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                
                dateInput.value = `${year}/${month}/${day}`;
                datePicker.style.display = 'none';
            });
        }
        
        // Previous month button
        if (prevMonthButton) {
            prevMonthButton.addEventListener('click', function() {
                // Simplified - would navigate to previous month
                alert('Would navigate to previous month');
            });
        }
        
        // Next month button
        if (nextMonthButton) {
            nextMonthButton.addEventListener('click', function() {
                // Simplified - would navigate to next month
                alert('Would navigate to next month');
            });
        }
    });
    
    // Helper function to get month number from name
    function getMonthNumber(monthName) {
        const months = {
            'January': '01',
            'February': '02',
            'March': '03',
            'April': '04',
            'May': '05',
            'June': '06',
            'July': '07',
            'August': '08',
            'September': '09',
            'October': '10',
            'November': '11',
            'December': '12'
        };
        return months[monthName] || '01';
    }
    
    // Close date picker when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.date-input-wrapper')) {
            document.querySelectorAll('.date-picker').forEach(picker => {
                picker.style.display = 'none';
            });
        }
    });
    
    // Search button event
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.addEventListener('click', function() {
        // Get all search parameters
        const location = document.querySelector('.search-input').value;
        const roomsSelect = document.querySelector('.search-select');
        const rooms = roomsSelect.options[roomsSelect.selectedIndex]?.text || '';
        const checkIn = document.querySelectorAll('.date-input')[0].value;
        const checkOut = document.querySelectorAll('.date-input')[1].value;
        
        // Check if all fields are filled
        if (!location || roomsSelect.selectedIndex === 0 || !checkIn || !checkOut) {
            alert('Please fill in all search fields');
            return;
        }
        
        // Show loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('loading-indicator');
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        document.querySelector('.search-section').appendChild(loadingElement);
        
        // Extract the number from the rooms text (e.g., "2 Rooms" -> "2")
        const roomsNumber = rooms.split(' ')[0];
        
        // Make API request to the backend
        fetch(`/api/hotels/search?location=${encodeURIComponent(location)}&rooms=${roomsNumber}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Store search parameters and results in sessionStorage
                    sessionStorage.setItem('searchLocation', location);
                    sessionStorage.setItem('searchRooms', rooms);
                    sessionStorage.setItem('searchCheckIn', checkIn);
                    sessionStorage.setItem('searchCheckOut', checkOut);
                    sessionStorage.setItem('searchResults', JSON.stringify(data.results));
                    
                    // Redirect to results page
                    window.location.href = 'results.html';
                } else {
                    // Handle error
                    alert(data.message || 'Error performing search. Please try again.');
                    loadingElement.remove();
                }
            })
            .catch(error => {
                console.error('Error searching hotels:', error);
                alert('Error connecting to server. Please try again later.');
                loadingElement.remove();
            });
    });

    const itemsPerPageSelectEl = document.getElementById('itemsPerPageSelect');

    // Global state
    let currentFilters = { /* ... */ };
    let currentPage = 1;
    let itemsPerPage = (itemsPerPageSelectEl.value === 'all') ? 99999 : (parseInt(itemsPerPageSelectEl.value) || 99999); // Default to 'all'
    itemsPerPageSelectEl.value = itemsPerPage > 1000 ? 'all' : itemsPerPage.toString(); // Set dropdown to 'all' if using large number
    let totalPages = 1;

    // Function to update summary cards
    function updateSummaryCards(summary, totalItems) { // Accept totalItems from pagination
        if (!summary) return;
        document.querySelector('.bookings-summary .summary-card:nth-child(1) .summary-value').textContent = totalItems || 0;
        document.querySelector('.bookings-summary .summary-card:nth-child(2) .summary-value').textContent = summary.confirmed || 0;
        document.querySelector('.bookings-summary .summary-card:nth-child(3) .summary-value').textContent = summary.pending || 0;
        document.querySelector('.bookings-summary .summary-card:nth-child(4) .summary-value').textContent = summary.completed || 0;
        document.querySelector('.bookings-summary .summary-card:nth-child(5) .summary-value').textContent = summary.cancelled || 0;
    }

    // Modify loadBookings to pass totalItems to updateSummaryCards
    async function loadBookings(page = 1, filters = {}) {
        // ... (fetch logic) ...
            if (data.success) {
                console.log('Received data:', data);
                populateTable(data.bookings);
                updateSummaryCards(data.summary, data.pagination.totalItems); // Pass totalItems
                updatePagination(data.pagination);
            } // ...
    }

    // Initial load - uses the updated itemsPerPage default
    loadBookings(currentPage, currentFilters);
}); 