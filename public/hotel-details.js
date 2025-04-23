document.addEventListener('DOMContentLoaded', function() {
    // Get hotel ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get('id') || sessionStorage.getItem('selectedHotelId');
    
    if (!hotelId) {
        alert('Hotel ID not found. Redirecting to search page.');
        window.location.href = 'index.html';
        return;
    }
    
    // Load search parameters from sessionStorage
    const location = sessionStorage.getItem('searchLocation') || '';
    const checkInDate = sessionStorage.getItem('searchCheckIn') || '';
    const checkOutDate = sessionStorage.getItem('searchCheckOut') || '';
    
    // Set the dates in the booking form
    const checkInElement = document.getElementById('check-in-date');
    const checkOutElement = document.getElementById('check-out-date');
    
    if (checkInElement) checkInElement.textContent = checkInDate;
    if (checkOutElement) checkOutElement.textContent = checkOutDate;
    
    // Calculate number of nights
    if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate.replace(/\//g, '-'));
        const checkOut = new Date(checkOutDate.replace(/\//g, '-'));
        
        if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            const nightsElement = document.getElementById('nights-count');
            if (nightsElement) nightsElement.textContent = nights;
        }
    }
    
    // Show loading spinner
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading hotel details...';
        mainContent.appendChild(loadingSpinner);
    }
    
    // Fetch hotel details from API
    fetch(`/api/hotels/${hotelId}?checkIn=${encodeURIComponent(checkInDate)}&checkOut=${encodeURIComponent(checkOutDate)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch hotel details');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayHotelDetails(data.data || data.hotel);
            } else {
                throw new Error(data.message || 'Failed to load hotel details');
            }
        })
        .catch(error => {
            console.error('Error fetching hotel details:', error);
            alert('Error loading hotel details. Please try again later.');
            // Remove loading spinner
            const spinner = document.querySelector('.loading-spinner');
            if (spinner) spinner.remove();
        });
    
    // Function to display hotel details
    function displayHotelDetails(hotel) {
        console.log("Received hotel data:", hotel); // 添加日誌

        if (!hotel) {
            console.error("Hotel data is undefined or null");
            alert('Error: Received invalid hotel data');
            const spinner = document.querySelector('.loading-spinner');
            if (spinner) spinner.remove();
            return;
        }

        // Set hotel name
        const hotelNameElement = document.querySelector('.hotel-name');
        if (hotelNameElement) hotelNameElement.textContent = hotel.name;
        
        // Set hotel rating
        const ratingElement = document.querySelector('.hotel-rating');
        if (ratingElement) {
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < hotel.star_rating) {
                    starsHtml += '<i class="fas fa-star"></i>';
                } else {
                    starsHtml += '<i class="far fa-star"></i>';
                }
            }
            ratingElement.innerHTML = starsHtml + `<span>${hotel.star_rating}.0</span>`;
        }
        
        // Set hotel location
        const locationElement = document.querySelector('.hotel-location span');
        if (locationElement) {
            // 使用完整地址，而不僅僅是城市
            locationElement.textContent = hotel.address || hotel.location;
        }
        
        // Set distance (如果有的話)
        const distanceElement = document.querySelector('.distance-text');
        if (distanceElement) {
            const distance = hotel.distance_from_center || '800m';
            distanceElement.textContent = `${distance} from center`;
        }
        
        // 設置價格
        const priceElement = document.querySelector('.hotel-price .price-value');
        if (priceElement) {
            const price = hotel.min_price_per_night || hotel.min_price || 240;
            priceElement.innerHTML = `$${parseFloat(price).toFixed(2)}<span>/night</span>`;
        }
        
        // Set hotel description
        const descriptionElement = document.querySelector('.hotel-description');
        if (descriptionElement) descriptionElement.textContent = hotel.description;
        
        // Set hotel overview text
        const overviewTextElement = document.querySelector('.overview-text');
        if (overviewTextElement) overviewTextElement.textContent = hotel.description;
        
        // Set hotel images
        const galleryElement = document.querySelector('.hotel-gallery');
        if (galleryElement && hotel.images && hotel.images.length > 0) {
            // 主圖
            const mainImageDiv = galleryElement.querySelector('.gallery-main');
            if (mainImageDiv) {
                const mainImagePath = typeof hotel.images[0] === 'object' ? hotel.images[0].image_path : hotel.images[0];
                mainImageDiv.innerHTML = `<img src="${mainImagePath}" alt="${hotel.name}" onerror="this.src='hotel.jpg'">`;
            }
            
            // 網格圖片
            const galleryGrid = galleryElement.querySelector('.gallery-grid');
            if (galleryGrid) {
                let gridHtml = '';
                // 使用第2-5張圖片（如果有的話）
                const gridImages = hotel.images.slice(1, 5);
                
                // 如果有足夠圖片，使用它們；否則使用默認圖片
                if (gridImages.length >= 4) {
                    for (let i = 0; i < 4; i++) {
                        const imagePath = typeof gridImages[i] === 'object' ? gridImages[i].image_path : gridImages[i];
                        gridHtml += `<div class="gallery-item"><img src="${imagePath}" alt="${hotel.name}" onerror="this.src='hotel${i+1}.jpg'"></div>`;
                    }
                } else {
                    // 沒有足夠的圖片，使用默認圖片填充
                    for (let i = 0; i < 4; i++) {
                        if (i < gridImages.length) {
                            const imagePath = typeof gridImages[i] === 'object' ? gridImages[i].image_path : gridImages[i];
                            gridHtml += `<div class="gallery-item"><img src="${imagePath}" alt="${hotel.name}" onerror="this.src='hotel${i+1}.jpg'"></div>`;
                        } else {
                            gridHtml += `<div class="gallery-item"><img src="hotel${i+1}.jpg" alt="${hotel.name}"></div>`;
                        }
                    }
                }
                galleryGrid.innerHTML = gridHtml;
            }
        } else if (galleryElement) {
            console.log("No images found or gallery element not found");
            // If no images, use default
            const mainImageDiv = galleryElement.querySelector('.gallery-main');
            if (mainImageDiv) {
                mainImageDiv.innerHTML = `<img src="hotel.jpg" alt="${hotel.name}">`;
            }
            
            const galleryGrid = galleryElement.querySelector('.gallery-grid');
            if (galleryGrid) {
                galleryGrid.innerHTML = `
                    <div class="gallery-item"><img src="hotel1.jpg" alt="${hotel.name}"></div>
                    <div class="gallery-item"><img src="hotel2.jpg" alt="${hotel.name}"></div>
                    <div class="gallery-item"><img src="hotel3.jpg" alt="${hotel.name}"></div>
                    <div class="gallery-item"><img src="hotel4.jpg" alt="${hotel.name}"></div>
                `;
            }
        }
        
        // Set room types - 為每個房型使用不同圖片
        const roomsContainer = document.querySelector('.rooms-container');
        if (roomsContainer && hotel.room_types && hotel.room_types.length > 0) {
            let roomsHtml = '';
            
            // 為每個房型分配不同的預設圖片
            const defaultRoomImages = ['hotel1.jpg', 'hotel2.jpg', 'hotel3.jpg', 'hotel4.jpg', 'hotel.jpg'];
            
            hotel.room_types.forEach((room, index) => {
                // 選擇默認圖片 (輪流使用)
                const defaultImage = defaultRoomImages[index % defaultRoomImages.length];
                
                roomsHtml += `
                    <div class="room-card" data-room-id="${room.id}">
                        <div class="room-image">
                            <img src="${room.image_path || defaultImage}" alt="${room.name}" onerror="this.src='${defaultImage}'">
                        </div>
                        <div class="room-details">
                            <h3 class="room-name">${room.name}</h3>
                            <p class="room-capacity">${room.capacity}</p>
                            <p class="room-description">${room.description || 'No description available.'}</p>
                            <div class="room-amenities">
                                <strong>Amenities:</strong> ${room.amenities || 'Basic amenities included.'}
                            </div>
                        </div>
                        <div class="room-booking">
                            <div class="room-price">$${parseFloat(room.price).toFixed(2)} <span>per night</span></div>
                            <div class="rooms-available">${room.available_rooms} rooms available</div>
                            <button class="book-now-btn" data-room-id="${room.id}" data-room-name="${room.name}" data-room-price="${room.price}">Book Now</button>
                        </div>
                    </div>
                `;
            });
            
            roomsContainer.innerHTML = roomsHtml;
            
            // Add event listeners to Book Now buttons
            document.querySelectorAll('.book-now-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const roomId = this.getAttribute('data-room-id');
                    const roomName = this.getAttribute('data-room-name');
                    const roomPrice = this.getAttribute('data-room-price');
                    
                    // Store booking information
                    sessionStorage.setItem('selectedHotelId', hotelId);
                    sessionStorage.setItem('selectedHotelName', hotel.name);
                    sessionStorage.setItem('selectedHotelAddress', hotel.address);
                    sessionStorage.setItem('selectedRoomId', roomId);
                    sessionStorage.setItem('selectedRoomName', roomName);
                    sessionStorage.setItem('selectedRoomPrice', roomPrice);
                    
                    // Calculate total price
                    const checkIn = new Date(checkInDate.replace(/\//g, '-'));
                    const checkOut = new Date(checkOutDate.replace(/\//g, '-'));
                    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                    const totalPrice = parseFloat(roomPrice) * nights;
                    
                    sessionStorage.setItem('bookingNights', nights);
                    sessionStorage.setItem('bookingTotalPrice', totalPrice.toFixed(2));
            
                    // Navigate to booking page
                    window.location.href = 'booking.html';
                });
            });
        } else {
            console.log("No room types found or rooms container not found", {
                roomsContainer: !!roomsContainer,
                roomTypes: hotel.room_types
            });
            
            if (roomsContainer) {
                roomsContainer.innerHTML = '<div class="no-rooms">No rooms available at this time.</div>';
            }
        }
        
        // Remove loading spinner
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
    }
}); 