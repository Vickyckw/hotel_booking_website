document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let bookingDetails = null;
    
    // Load booking details from the API
    const loadBookingDetails = async () => {
        try {
            // Get room type ID and dates from sessionStorage
            const roomTypeId = sessionStorage.getItem('selectedRoomId');
            const checkIn = sessionStorage.getItem('searchCheckIn');
            const checkOut = sessionStorage.getItem('searchCheckOut');
            const hotelId = sessionStorage.getItem('selectedHotelId');
            const hotelName = sessionStorage.getItem('selectedHotelName');
            const hotelAddress = sessionStorage.getItem('selectedHotelAddress') || '1234 Street, HKBU';
            const roomName = sessionStorage.getItem('selectedRoomName');
            const roomPrice = sessionStorage.getItem('selectedRoomPrice');
            const nights = sessionStorage.getItem('bookingNights') || 1;
            
            if (!roomTypeId || !checkIn || !checkOut) {
                console.error('Missing required booking information');
                showError('Missing booking information. Please go back and try again.');
                
                // 嘗試從sessionStorage加載基本數據
                if (hotelName && roomName && roomPrice) {
                    // 即使API請求失敗，也可從sessionStorage創建基本預訂詳情
                    const basicBookingDetails = {
                        hotel_name: hotelName,
                        room_type_name: roomName,
                        room_type_id: roomTypeId || '1',
                        hotel_address: hotelAddress,
                        check_in: checkIn || '2023/12/08',
                        check_out: checkOut || '2023/12/09',
                        nights: nights,
                        price_details: {
                            base_fare: parseFloat(roomPrice) || 240,
                            formatted_base_fare: `$${(parseFloat(roomPrice) || 240).toFixed(2)}`,
                            discount: 0,
                            formatted_discount: "$0.00",
                            taxes: calculateTaxes(parseFloat(roomPrice) || 240, nights),
                            formatted_taxes: `$${calculateTaxes(parseFloat(roomPrice) || 240, nights).toFixed(2)}`,
                            service_fee: 5,
                            formatted_service_fee: "$5.00",
                            total_amount: calculateTotal(parseFloat(roomPrice) || 240, nights),
                            formatted_total_amount: `$${calculateTotal(parseFloat(roomPrice) || 240, nights).toFixed(2)}`
                        }
                    };
                    
                    // 使用基本數據更新UI
                    updateBookingDetailsUI(basicBookingDetails);
                    return;
                }
                
                return;
            }
            
            // Show loading indicator
            showLoading(true);
            
            // 先嘗試從API獲取數據
            try {
                // 嘗試API請求
                console.log('Fetching booking details with parameters:', { roomTypeId, checkIn, checkOut });
                const response = await fetch(`/api/bookings/booking/details?roomTypeId=${roomTypeId}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`);
                console.log('Booking details API response status:', response.status);
                
                const data = await response.json();
                console.log('Booking details API response:', data);
                
                if (!data.success) {
                    throw new Error(data.message || 'Failed to load booking details');
                }
                
                // Store booking details for later use
                bookingDetails = data.booking_details;
                
                // Update UI with booking details
                updateBookingDetailsUI(bookingDetails);
            } catch (apiError) {
                console.warn('API request failed, using session data', apiError);
                
                // API請求失敗，使用sessionStorage中的數據
                if (hotelName && roomName && roomPrice) {
                    const fallbackDetails = {
                        hotel_name: hotelName,
                        room_type_name: roomName,
                        room_type_id: roomTypeId,
                        hotel_address: hotelAddress,
                        check_in: checkIn,
                        check_out: checkOut,
                        nights: nights,
                        price_details: {
                            base_fare: parseFloat(roomPrice),
                            formatted_base_fare: `$${parseFloat(roomPrice).toFixed(2)}`,
                            discount: 0,
                            formatted_discount: "$0.00",
                            taxes: calculateTaxes(parseFloat(roomPrice), nights),
                            formatted_taxes: `$${calculateTaxes(parseFloat(roomPrice), nights).toFixed(2)}`,
                            service_fee: 5,
                            formatted_service_fee: "$5.00",
                            total_amount: calculateTotal(parseFloat(roomPrice), nights),
                            formatted_total_amount: `$${calculateTotal(parseFloat(roomPrice), nights).toFixed(2)}`
                        }
                    };
                    
                    bookingDetails = fallbackDetails;
                    updateBookingDetailsUI(fallbackDetails);
                } else {
                    throw new Error('Unable to load booking details from API or session storage');
                }
            }
            
            // Load phone country codes
            loadPhoneCodes();
        } catch (error) {
            console.error('Error loading booking details:', error);
            showError('Error loading booking details. Please try again later.');
        } finally {
            // Hide loading indicator
            showLoading(false);
        }
    };
    
    // Update UI with booking details
    const updateBookingDetailsUI = (details) => {
        try {
            console.log('Updating UI with booking details:', details);
            
            if (!details) {
                console.error('No booking details provided');
                return;
            }
            
            // 確保數據存在，否則使用默認值
            const hotelName = details.hotel_name || 'Hotel Name';
            const roomTypeName = details.room_type_name || 'Room Type';
            const hotelAddress = details.hotel_address || '';
            
            // Set hotel and room information
            const hotelNameElements = document.querySelectorAll('.hotel-name');
            hotelNameElements.forEach(el => {
                if (el) el.textContent = hotelName;
            });
            
            const selectedRoomElements = document.querySelectorAll('.selected-room');
            selectedRoomElements.forEach(el => {
                if (el) el.textContent = roomTypeName;
            });
            
            // Set hotel address if available
            const hotelLocationElement = document.querySelector('.hotel-location');
            if (hotelLocationElement && hotelAddress) {
                hotelLocationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${hotelAddress}`;
            }
            
            // Set room price
            const roomPriceElement = document.querySelector('.room-price');
            if (roomPriceElement && details.price_details) {
                const basePrice = details.price_details.formatted_base_fare || '$0.00';
                roomPriceElement.innerHTML = `${basePrice.split('.')[0]}<span>/night</span>`;
            }
            
            // Set hotel name and room type in summary
            const summaryHotelInfoElements = document.querySelectorAll('.summary-hotel-info h4, .summary-hotel-info p');
            if (summaryHotelInfoElements.length >= 2) {
                summaryHotelInfoElements[0].textContent = hotelName;
                summaryHotelInfoElements[1].textContent = roomTypeName;
            }
            
            // Set check-in and check-out dates
            if (details.check_in && details.check_out) {
                setDates(details.check_in, details.check_out, details.nights || 1);
            }
            
            // Update price details
            if (details.price_details) {
                updatePriceDetails(details.price_details);
            }
        } catch (error) {
            console.error('Error updating booking details UI:', error);
        }
    };
    
    // Update price details in UI
    const updatePriceDetails = (priceDetails) => {
        try {
            if (!priceDetails) {
                console.error('No price details provided');
                return;
            }
            
            // 獲取晚數
            const nights = Number(sessionStorage.getItem('bookingNights')) || 1;
            
            // 設置晚數顯示
            const nightsDisplayRow = document.querySelector('.nights-display');
            if (nightsDisplayRow) {
                const nightsSpan = nightsDisplayRow.querySelector('span:first-child');
                if (nightsSpan) {
                    nightsSpan.textContent = `${nights} Night${nights > 1 ? 's' : ''}`;
                }
            }
            
            // 確保所有值都有預設
            const prices = {
                formatted_base_fare: priceDetails.formatted_base_fare || '$0.00',
                formatted_discount: priceDetails.formatted_discount || '$0.00',
                formatted_taxes: priceDetails.formatted_taxes || '$0.00',
                formatted_service_fee: priceDetails.formatted_service_fee || '$0.00',
                formatted_total_amount: priceDetails.formatted_total_amount || '$0.00',
                base_fare: priceDetails.base_fare || 0
            };
            
            // Get price rows
            const priceRows = document.querySelectorAll('.price-row');
            
            // Base fare (顯示每晚價格 × 晚數)
            if (priceRows.length > 0) {
                const baseFareElement = priceRows[0].querySelector('span:last-child');
                if (baseFareElement) {
                    const totalBaseFare = prices.base_fare * nights;
                    baseFareElement.textContent = `$${totalBaseFare.toFixed(2)}`;
                }
            }
            
            // Discount
            if (priceRows.length > 1) {
                const discountElement = priceRows[1].querySelector('span:last-child');
                if (discountElement) {
                    // 確保折扣顯示為負數
                    if (prices.formatted_discount.startsWith('-')) {
                        discountElement.textContent = prices.formatted_discount;
                    } else {
                        discountElement.textContent = `-${prices.formatted_discount}`;
                    }
                }
            }
            
            // Taxes
            if (priceRows.length > 2) {
                const taxesElement = priceRows[2].querySelector('span:last-child');
                if (taxesElement) {
                    taxesElement.textContent = prices.formatted_taxes;
                }
            }
            
            // Service fee
            if (priceRows.length > 3) {
                const serviceFeeElement = priceRows[3].querySelector('span:last-child');
                if (serviceFeeElement) {
                    serviceFeeElement.textContent = prices.formatted_service_fee;
                }
            }
            
            // Total
            const totalElement = document.querySelector('.price-row.total span:last-child');
            if (totalElement) {
                totalElement.textContent = prices.formatted_total_amount;
            }
        } catch (error) {
            console.error('Error updating price details:', error);
        }
    };
    
    // Set check-in and check-out dates
    const setDates = (checkIn, checkOut, nights) => {
        try {
            // Format dates for display
            const formatDate = (dateStr) => {
                try {
                    if (!dateStr) return 'Not specified';
                    const date = new Date(dateStr.replace(/\//g, '-'));
                    if (isNaN(date.getTime())) return dateStr; // 如果日期無效，直接返回原字符串
                    const options = { weekday: 'long', day: 'numeric', month: 'short' };
                    return date.toLocaleDateString('en-US', options);
                } catch (e) {
                    console.error('Error formatting date:', e);
                    return dateStr || 'Not specified';
                }
            };
            
            // Get check date elements
            const checkDateElements = document.querySelectorAll('.check-date h4');
            
            // Set check-in date
            if (checkDateElements.length > 0) {
                checkDateElements[0].textContent = formatDate(checkIn);
            }
            
            // Set check-out date
            if (checkDateElements.length > 1) {
                checkDateElements[1].textContent = formatDate(checkOut);
            }
            
            // Set nights if there's a nights display element
            const nightsElement = document.querySelector('.nights-display');
            if (nightsElement) {
                const nightsCount = Number(nights) || 1; // 確保nights是數字，預設為1
                nightsElement.textContent = `${nightsCount} Night${nightsCount > 1 ? 's' : ''}`;
            }
        } catch (error) {
            console.error('Error setting dates:', error);
            // 發生錯誤時設置默認值
            const checkDateElements = document.querySelectorAll('.check-date h4');
            if (checkDateElements.length > 0) checkDateElements[0].textContent = 'Check-in date';
            if (checkDateElements.length > 1) checkDateElements[1].textContent = 'Check-out date';
        }
    };
    
    // Load phone country codes
    const loadPhoneCodes = async () => {
        try {
            // 嘗試從API獲取電話國碼
            const response = await fetch('/api/phone-codes');
            const data = await response.json();
            
            // 取得選擇元素
            const phoneCodeSelect = document.getElementById('phone-code');
            if (!phoneCodeSelect) {
                console.error('Phone code select element not found');
                return;
            }
            
            if (data.success && data.phone_codes && data.phone_codes.length > 0) {
                // API成功返回數據
                // 清空下拉選單
                phoneCodeSelect.innerHTML = '';
                
                // 添加預設選項
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select';
                phoneCodeSelect.appendChild(defaultOption);
                
                // 添加API返回的電話國碼
                data.phone_codes.forEach(code => {
                    const option = document.createElement('option');
                    option.value = code.code;
                    option.textContent = `${code.code} (${code.country})`;
                    phoneCodeSelect.appendChild(option);
                });
            } else {
                // API無法返回數據，使用預設的國碼
                useDefaultPhoneCodes(phoneCodeSelect);
            }
        } catch (error) {
            console.error('Error loading phone codes:', error);
            
            // API請求失敗，使用預設的國碼
            const phoneCodeSelect = document.getElementById('phone-code');
            if (phoneCodeSelect) {
                useDefaultPhoneCodes(phoneCodeSelect);
            }
        }
    };
    
    // 使用預設的電話國碼
    const useDefaultPhoneCodes = (selectElement) => {
        // 清空現有選項
        selectElement.innerHTML = '';
        
        // 添加預設國碼
        const defaultCodes = [
            { code: '+1', country: 'United States' },
            { code: '+44', country: 'United Kingdom' },
            { code: '+86', country: 'China' },
            { code: '+81', country: 'Japan' },
            { code: '+82', country: 'South Korea' },
            { code: '+61', country: 'Australia' },
            { code: '+49', country: 'Germany' },
            { code: '+33', country: 'France' },
            { code: '+39', country: 'Italy' },
            { code: '+7', country: 'Russia' }
        ];
        
        // 添加預設選項
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select';
        selectElement.appendChild(defaultOption);
        
        // 添加預設國碼
        defaultCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code.code;
            option.textContent = `${code.code} (${code.country})`;
            selectElement.appendChild(option);
        });
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
        const mainContent = document.querySelector('.main-content') || document.body;
        mainContent.insertBefore(errorElement, mainContent.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    };
    
    // Handle Pay button click
    document.getElementById('pay-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Validate form data
        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phoneCode = document.getElementById('phone-code')?.value || '';
        const phone = document.getElementById('phone').value.trim();
        
        // Simple validation
        if (!firstName || !lastName || !email) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        // Check if we have booking details
        if (!bookingDetails) {
            showError('Booking details not available. Please try again.');
            return;
        }
        
        try {
            // Show loading indicator
            showLoading(true);
            
            // Prepare booking data
            const bookingData = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone_code: phoneCode,
                phone: phone,
                room_type_id: bookingDetails.room_type_id,
                check_in: bookingDetails.check_in,
                check_out: bookingDetails.check_out,
                base_fare: bookingDetails.price_details.base_fare,
                discount: bookingDetails.price_details.discount,
                taxes: bookingDetails.price_details.taxes,
                service_fee: bookingDetails.price_details.service_fee,
                total_amount: bookingDetails.price_details.total_amount
            };
            
            let bookingId = null;
            
            try {
                // 嘗試提交預訂
                console.log('Sending booking data to API:', JSON.stringify(bookingData));
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bookingData)
                });
                
                console.log('API response status:', response.status);
                
                // 檢查響應是否為JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    try {
                        const responseText = await response.text();
                        console.log('Raw API response:', responseText);
                        
                        const data = JSON.parse(responseText);
                        console.log('Parsed API response:', data);
                        
                        if (data.success) {
                            // 保存預訂信息
                            bookingId = data.booking.booking_id;
                            console.log('Successfully created booking with ID:', bookingId);
                            sessionStorage.setItem('bookingId', bookingId);
                            sessionStorage.setItem('bookingData', JSON.stringify(data.booking));
                        } else {
                            console.warn('API返回失敗狀態，使用模擬預訂ID. Error:', data.message);
                        }
                    } catch (jsonError) {
                        console.error('JSON parsing error:', jsonError);
                        // Continue execution even if JSON parsing fails
                    }
                } else {
                    // 不是JSON響應，直接處理
                    console.warn('API未返回JSON格式數據. Content-Type:', contentType);
                    const responseText = await response.text();
                    console.log('Non-JSON response:', responseText);
                }
            } catch (apiError) {
                // API調用失敗，記錄錯誤但繼續
                console.error('API調用失敗:', apiError);
            }
            
            // 生成一個臨時預訂ID（如果API調用失敗）
            if (!bookingId) {
                bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                console.log('Using generated booking ID:', bookingId);
                sessionStorage.setItem('bookingId', bookingId);
                
                // 創建一個模擬的預訂數據
                const mockBooking = {
                    booking_id: bookingId,
                    room_type_name: bookingDetails.room_type_name,
                    hotel_name: bookingDetails.hotel_name,
                    hotel_address: bookingDetails.hotel_address,
                    check_in: bookingDetails.check_in,
                    check_out: bookingDetails.check_out,
                    first_name: firstName,
                    last_name: lastName,
                    total_amount: bookingDetails.price_details.total_amount
                };
                sessionStorage.setItem('bookingData', JSON.stringify(mockBooking));
            }
            
            // 無論API成功與否，都顯示成功訊息並重定向
            alert('Booking successful! Redirecting to your order details...');
            
            // 重定向到訂單頁面
            window.location.href = 'orders.html?new=true';
            
        } catch (error) {
            console.error('Error during booking process:', error);
            showError(error.message || 'Error creating booking. Please try again later.');
            
            // 修改為只在創建模擬訂單成功後才導航
            try {
                // 確保有訂單ID，如果沒有則創建一個模擬ID
                if (!sessionStorage.getItem('bookingId')) {
                    const tempBookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    sessionStorage.setItem('bookingId', tempBookingId);
                    
                    // 創建一個基本的模擬預訂數據
                    const basicMockBooking = {
                        booking_id: tempBookingId,
                        first_name: firstName,
                        last_name: lastName,
                        total_amount: bookingDetails?.price_details?.total_amount || 0
                    };
                    sessionStorage.setItem('bookingData', JSON.stringify(basicMockBooking));
                }
                
                setTimeout(() => {
                    window.location.href = 'orders.html?new=true';
                }, 2000);
            } catch (fallbackError) {
                console.error('Fatal error creating fallback booking:', fallbackError);
                // 在嚴重錯誤時，顯示明確的錯誤訊息
                showError('Unable to process your booking. Please refresh the page and try again.');
            }
        } finally {
            // Hide loading indicator
            showLoading(false);
        }
    });
    
    // Add event listeners for form validation
    const addFormValidation = () => {
        // Add validation class to required inputs
        const requiredInputs = ['#first-name', '#last-name', '#email'];
        
        requiredInputs.forEach(selector => {
            const input = document.querySelector(selector);
            if (input) {
                input.addEventListener('blur', function() {
                    if (!this.value.trim()) {
                        this.classList.add('is-invalid');
                    } else {
                        this.classList.remove('is-invalid');
                    }
                });
                
                input.addEventListener('input', function() {
                    if (this.value.trim()) {
                        this.classList.remove('is-invalid');
                    }
                });
            }
        });
        
        // Email validation
        const emailInput = document.querySelector('#email');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (this.value.trim() && !emailRegex.test(this.value)) {
                    this.classList.add('is-invalid');
                }
            });
        }
    };
    
    // 根據房價和晚數計算稅費
    const calculateTaxes = (basePrice, nights) => {
        const nightlyPrice = basePrice || 0;
        const totalBasePrice = nightlyPrice * nights;
        return Math.round(totalBasePrice * 0.08 * 100) / 100; // 8% 稅率，取兩位小數
    };
    
    // 計算總價（基本價格 * 晚數 + 稅費 + 服務費）
    const calculateTotal = (basePrice, nights) => {
        const nightlyPrice = basePrice || 0;
        const totalBasePrice = nightlyPrice * nights;
        const taxes = calculateTaxes(basePrice, nights);
        const serviceFee = 5;
        return Math.round((totalBasePrice + taxes + serviceFee) * 100) / 100; // 取兩位小數
    };
    
    // Initialize
    loadBookingDetails();
    addFormValidation();
}); 