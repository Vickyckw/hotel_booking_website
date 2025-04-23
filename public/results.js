document.addEventListener('DOMContentLoaded', function() {
    // Load search parameters from sessionStorage
    const loadSearchParameters = () => {
        const location = sessionStorage.getItem('searchLocation') || '';
        const rooms = sessionStorage.getItem('searchRooms') || '';
        const checkIn = sessionStorage.getItem('searchCheckIn') || '';
        const checkOut = sessionStorage.getItem('searchCheckOut') || '';
        
        // Set values in the form
        document.getElementById('location-input').value = location;
        
        const checkInInput = document.getElementById('checkin-input');
        if (checkInInput) checkInInput.value = checkIn;
        
        const checkOutInput = document.getElementById('checkout-input');
        if (checkOutInput) checkOutInput.value = checkOut;
        
        // Set room selection
        const roomsSelect = document.getElementById('rooms-select');
        if (roomsSelect) {
            for (let i = 0; i < roomsSelect.options.length; i++) {
                if (roomsSelect.options[i].text === rooms) {
                    roomsSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Populate search result count
        const searchResults = JSON.parse(sessionStorage.getItem('searchResults') || '{"hotels":[],"search_info":{}}');
        const resultsCount = document.querySelector('.results-count');
        if (resultsCount) {
            resultsCount.textContent = `${searchResults.search_info.total_results || 0} hotels found`;
        }
        
        // Set sort selects to match the saved sort options if they exist
        if (searchResults.search_info && searchResults.search_info.sort) {
            const { by, order } = searchResults.search_info.sort;
            
            // Set price sort dropdown
            if (by === 'price') {
                const priceSort = document.getElementById('price-sort');
                if (priceSort) {
                    if (order === 'asc' || order === 'low-to-high') {
                        priceSort.value = 'low-to-high';
                    } else if (order === 'desc' || order === 'high-to-low') {
                        priceSort.value = 'high-to-low';
                    }
                }
            }
            
            // Set rating sort dropdown
            if (by === 'rating') {
                const ratingSort = document.getElementById('rating-sort');
                if (ratingSort) {
                    if (order === 'asc' || order === 'low-to-high') {
                        ratingSort.value = 'low-to-high';
                    } else if (order === 'desc' || order === 'high-to-low') {
                        ratingSort.value = 'high-to-low';
                    }
                }
            }
        }
        
        // Display hotel results
        displayHotelResults(searchResults.hotels || []);
    };
    
    // Function to display hotel results
    const displayHotelResults = (hotels) => {
        const hotelListingsContainer = document.querySelector('.hotel-listings');
        if (!hotelListingsContainer) return;
        
        // Clear existing hotel listings
        hotelListingsContainer.innerHTML = '';
        
        if (hotels.length === 0) {
            hotelListingsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No hotels found matching your criteria. Please try another search.</p>
                </div>
            `;
            return;
        }
        
        // Create hotel cards
        hotels.forEach(hotel => {
            const hotelCard = document.createElement('div');
            hotelCard.className = 'hotel-card';
            hotelCard.dataset.hotelId = hotel.id;
            hotelCard.dataset.price = hotel.total_price;
            hotelCard.dataset.rating = hotel.star_rating;
            
            // Create hotel card content
            hotelCard.innerHTML = `
                <div class="hotel-image">
                    <img src="${hotel.main_image || 'hotel1.jpg'}" alt="${hotel.name}" onerror="this.src='hotel1.jpg'">
                </div>
                <div class="hotel-info">
                    <h3 class="hotel-name">${hotel.name}</h3>
                    <div class="hotel-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${hotel.location}</span>
                    </div>
                    <div class="hotel-info-row">
                        <div class="hotel-rating">
                            ${getStarRating(hotel.star_rating)}
                            <span>${hotel.star_rating}.0</span>
                        </div>
                        <div class="hotel-distance">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>0.8 km from center</span>
                        </div>
                    </div>
                </div>
                <div class="hotel-price">
                    <div class="price-label">Price</div>
                    <div class="price-value">${hotel.formatted_total_price}</div>
                    <div class="price-night">${hotel.nights} nights</div>
                    <button class="view-details-btn" data-hotel-id="${hotel.id}">View Details</button>
                </div>
            `;
            
            hotelListingsContainer.appendChild(hotelCard);
        });
        
        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const hotelId = this.getAttribute('data-hotel-id');
                // Store selected hotel ID
                sessionStorage.setItem('selectedHotelId', hotelId);
                // Navigate to hotel details page
                window.location.href = `hotel-details.html?id=${hotelId}`;
            });
        });
    };
    
    // Helper function to generate star rating HTML
    const getStarRating = (rating) => {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    };
    
    // Call the function to load search parameters and display results
    loadSearchParameters();
    
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
        
        // Configure the date picker to appear below the input by default
        datePicker.style.top = (dateInput.offsetHeight + 5) + 'px';
        
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
            if (datePicker.style.display === 'block') {
                datePicker.style.display = 'none';
            } else {
                datePicker.style.display = 'block';
                
                // Ensure the calendar appears below the input field
                datePicker.style.top = (dateInput.offsetHeight + 5) + 'px';
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
    
    // Function to perform search with current parameters
    const performSearch = (additionalParams = {}) => {
        // Get all search parameters
        const location = document.getElementById('location-input').value;
        const roomsSelect = document.getElementById('rooms-select');
        const rooms = roomsSelect.options[roomsSelect.selectedIndex]?.text || '';
        const checkIn = document.getElementById('checkin-input').value;
        const checkOut = document.getElementById('checkout-input').value;
        
        // Check if all fields are filled
        if (!location || !checkIn || !checkOut) {
            alert('Please fill in all search fields');
            return;
        }
        
        // Show loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('loading-indicator');
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        document.querySelector('.search-bar-section').appendChild(loadingElement);
        
        // Extract the number from the rooms text (e.g., "2 Rooms" -> "2")
        const roomsNumber = rooms.split(' ')[0];
        
        // Build URL with parameters
        let searchUrl = `/api/hotels/search?location=${encodeURIComponent(location)}&rooms=${roomsNumber}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`;
        
        // Add additional parameters if provided
        if (additionalParams.sortBy && additionalParams.sortOrder) {
            searchUrl += `&sortBy=${additionalParams.sortBy}&sortOrder=${additionalParams.sortOrder}`;
        }
        
        // Make API request to the backend
        fetch(searchUrl)
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
                    
                    // Update results count
                    const resultsCount = document.querySelector('.results-count');
                    if (resultsCount) {
                        resultsCount.textContent = `${data.results.search_info.total_results || 0} hotels found`;
                    }
                    
                    // Display hotel results
                    displayHotelResults(data.results.hotels || []);
                    
                    // Remove loading indicator
                    loadingElement.remove();
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
    };
    
    // Search button event
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
    }
    
    // Sort options event handlers
    const priceSort = document.getElementById('price-sort');
    if (priceSort) {
    priceSort.addEventListener('change', function() {
            // Reset the rating sort
            const ratingSort = document.getElementById('rating-sort');
            if (ratingSort) {
                ratingSort.selectedIndex = 0;
            }
            
            // Perform search with price sort
            performSearch({
                sortBy: 'price',
                sortOrder: this.value
            });
        });
    }
    
    const ratingSort = document.getElementById('rating-sort');
    if (ratingSort) {
    ratingSort.addEventListener('change', function() {
            // Reset the price sort
            const priceSort = document.getElementById('price-sort');
            if (priceSort) {
                priceSort.selectedIndex = 0;
            }
            
            // Perform search with rating sort
            performSearch({
                sortBy: 'rating',
                sortOrder: this.value
            });
        });
    }
    
    // Pagination button handlers
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Skip if it's the active button or the next button
            if (this.classList.contains('active') || this.classList.contains('next')) {
                return;
            }
            
            // Remove active class from all buttons
            paginationBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // In a real app, this would load the corresponding page
            // For demo purposes, we'll just scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
    
    // Next button handler
    const nextBtn = document.querySelector('.pagination-btn.next');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            // Find current active page
            const activePage = document.querySelector('.pagination-btn.active');
            if (activePage && activePage.nextElementSibling && 
                !activePage.nextElementSibling.classList.contains('next')) {
                // Simulate click on next page
                activePage.nextElementSibling.click();
            }
        });
    }
    
    // Function to sort hotels (client-side sorting - used as fallback when API fails)
    function sortHotels(criterion, order) {
        const hotelCards = Array.from(document.querySelectorAll('.hotel-card'));
        const hotelListings = document.querySelector('.hotel-listings');
        
        // Sort the hotel cards
        hotelCards.sort((a, b) => {
            let valueA, valueB;
            
            if (criterion === 'price') {
                // Extract price values from data attribute
                valueA = parseFloat(a.dataset.price);
                valueB = parseFloat(b.dataset.price);
            } else if (criterion === 'rating') {
                // Extract rating values from data attribute
                valueA = parseFloat(a.dataset.rating);
                valueB = parseFloat(b.dataset.rating);
            }
            
            // Determine sort order
            if (order === 'low-to-high') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        });
        
        // Remove all hotel cards from the DOM
        hotelCards.forEach(card => card.remove());
        
        // Re-append them in the sorted order
        hotelCards.forEach(card => hotelListings.appendChild(card));
    }
}); 