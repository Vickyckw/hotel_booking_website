document.addEventListener('DOMContentLoaded', function() {
    // 添加CSS樣式使下拉框寬度與搜索框一致
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        #statusFilter, #dateFilter {
            width: 100%; /* 使下拉框填滿它們的容器 */
            min-width: 100%; /* 確保最小寬度也是100% */
            box-sizing: border-box; /* 確保padding和border不會增加總寬度 */
            height: 44px; /* 統一高度 */
            border-radius: 4px; /* 圓角邊框 */
            padding: 0 10px; /* 內邊距 */
            border: 1px solid #ccc; /* 邊框顏色 */
            font-size: 16px; /* 字體大小 */
        }
        .filter-group {
            flex: 1; /* 讓所有過濾器組占據相等的空間 */
            margin-right: 15px; /* 增加間距 */
        }
        .filter-group:last-child {
            margin-right: 0; /* 最後一個不需要右邊距 */
        }
        .bookings-filter {
            display: flex; /* 讓過濾器在一行顯示 */
            align-items: flex-end; /* 底部對齊 */
            margin-bottom: 20px; /* 添加底部間距 */
        }
        #searchBooking {
            width: 100%; /* 使搜索框填滿容器 */
            height: 44px; /* 統一高度 */
            box-sizing: border-box; /* 確保padding和border不會增加總寬度 */
            border-radius: 4px 0 0 4px; /* 只有左側圓角 */
            padding: 0 10px; /* 內邊距 */
            border: 1px solid #ccc; /* 邊框顏色 */
            border-right: none; /* 移除右邊框 */
            font-size: 16px; /* 字體大小 */
        }
        .search-input-wrapper {
            display: flex;
            width: 100%;
        }
        .search-btn {
            height: 44px;
            min-width: 44px; /* 最小寬度 */
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
            border: 1px solid #ccc; /* 邊框顏色 */
            background-color: #4CAF50; /* 綠色背景 */
            color: white; /* 白色文字 */
            cursor: pointer; /* 鼠標指針 */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .search-btn:hover {
            background-color: #45a049; /* 懸停時較暗的綠色 */
        }
        .filter-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
    `;
    document.head.appendChild(styleEl);
    
    // Get references to filter elements first
    const statusFilterEl = document.getElementById('statusFilter');
    const dateFilterEl = document.getElementById('dateFilter');
    const searchInputEl = document.getElementById('searchBooking');
    const searchBtnEl = document.querySelector('.filter-group .search-btn'); // More specific selector
    const itemsPerPageSelectEl = document.getElementById('itemsPerPageSelect');
    
    // Global state for filters and pagination
    let currentFilters = {
        status: 'all',
        dateRange: 'all',
        search: '',
        hotelId: 6
    };
    let currentPage = 1;
    let itemsPerPage = (itemsPerPageSelectEl?.value === 'all') ? 99999 : (parseInt(itemsPerPageSelectEl?.value) || 5); // Default to 5
    let totalPages = 1;

    // Initialize date pickers (if needed, e.g., for custom date range)
    // initDatePickers(); 

    // Set initial dropdown values from currentFilters
    if (statusFilterEl) statusFilterEl.value = currentFilters.status;
    if (dateFilterEl) dateFilterEl.value = currentFilters.dateRange;
    if (itemsPerPageSelectEl) itemsPerPageSelectEl.value = itemsPerPage > 1000 ? 'all' : itemsPerPage.toString();
    
    // Add event listeners for filter changes
    if (statusFilterEl) {
        statusFilterEl.addEventListener('change', () => { currentFilters.status = statusFilterEl.value; applyFiltersAndLoad(); });
    }
    
    if (dateFilterEl) {
        dateFilterEl.addEventListener('change', () => { currentFilters.dateRange = dateFilterEl.value; applyFiltersAndLoad(); });
    }
    
    if (searchInputEl) {
        searchInputEl.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
                currentFilters.search = searchInputEl.value.trim();
                applyFiltersAndLoad();
            }
        });
    }
    
    if (searchBtnEl) {
        searchBtnEl.addEventListener('click', () => { 
            if (searchInputEl) {
                currentFilters.search = searchInputEl.value.trim();
                applyFiltersAndLoad();
            }
        });
    }
    
    // Add event listener for items per page change
    if (itemsPerPageSelectEl) {
        itemsPerPageSelectEl.addEventListener('change', () => {
            const selectedValue = itemsPerPageSelectEl.value;
            itemsPerPage = (selectedValue === 'all') ? 99999 : parseInt(selectedValue);
            applyFiltersAndLoad();
        });
    }
    
    // Add event listeners for export and print buttons
    const exportBtn = document.getElementById('exportBookings');
    const printBtn = document.getElementById('printBookings');
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
    if (printBtn) printBtn.addEventListener('click', printBookings);   

    // Function to apply filters and reload data for the first page
    function applyFiltersAndLoad() {
        showLoading(true);
        
        // Get current filter values from the correct elements
        const status = statusFilterEl?.value || 'all';
        const dateRange = dateFilterEl?.value || 'all';
        const searchQuery = searchInputEl?.value?.trim() || '';
        const hotelId = currentFilters.hotelId || 6; // Default to hotel ID 6
        
        // Update current filters object
        currentFilters = {
            status: status,
            dateRange: dateRange,
            search: searchQuery,
            hotelId: hotelId
        };
        
        // Update URL with filter parameters
        const url = new URL(window.location);
        url.searchParams.set('status', status);
        url.searchParams.set('dateRange', dateRange);
        if (searchQuery) url.searchParams.set('search', searchQuery);
        else url.searchParams.delete('search');
        url.searchParams.set('hotelId', hotelId);
        
        // Update URL without refreshing page
        window.history.pushState({...currentFilters}, '', url.toString());
        
        // Reset to first page and load with updated filters
        currentPage = 1;
        loadBookings(currentPage, currentFilters);
    }

    // Function to fetch and display bookings
    async function loadBookings(page = 1, filters = {}) {
        // Read current values from filters before loading
        const hotelIdToLoad = filters.hotelId || 6; // Use filter's hotelId, default to 6
        console.log(`Loading bookings for page ${page} with limit ${itemsPerPage} and filters:`, { ...filters, hotelId: hotelIdToLoad });
        showLoading(true);

        const params = new URLSearchParams({
            page: page,
            limit: itemsPerPage, 
            hotelId: hotelIdToLoad, // Use the determined hotelId
            status: filters.status || 'all',
            dateRange: filters.dateRange || 'all',
            search: filters.search || ''
        });
        
        // Log the exact request URL
        const requestUrl = `/api/merchant/bookings?${params.toString()}`;
        console.log("Requesting URL:", requestUrl);

        try {
            const response = await fetch(requestUrl); // Use the constructed URL
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Response data:", data);

            if (data.success) {
                console.log('Received data:', data);
                // Update URL in browser history
                const currentUrl = new URL(window.location);
                
                // Set all filter parameters in URL
                currentUrl.searchParams.set('page', page);
                currentUrl.searchParams.set('hotelId', hotelIdToLoad);
                currentUrl.searchParams.set('status', filters.status || 'all');
                currentUrl.searchParams.set('dateRange', filters.dateRange || 'all');
                
                if (filters.search) currentUrl.searchParams.set('search', filters.search);
                else currentUrl.searchParams.delete('search');
                
                // Update URL without refreshing page
                try {
                    history.pushState({ ...filters, hotelId: hotelIdToLoad, page }, '', currentUrl.toString());
                } catch (e) {
                    console.error('Error updating URL history:', e);
                }
                
                populateTable(data.bookings);
                updateSummaryCards(data.summary, data.pagination.totalItems);
                updatePagination(data.pagination);
            } else {
                console.error('Failed to load bookings:', data.message);
                showError('Failed to load bookings. Please try again.');
                clearTableAndSummary(); // Clear table if load fails
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            showError('Error connecting to the server. Please try again later.');
            clearTableAndSummary(); // Clear table on connection error
        } finally {
            showLoading(false);
        }
    }

    // Function to populate the booking table
    function populateTable(bookings) {
        const tableBody = document.getElementById('bookingListBody');
        if (!tableBody) {
            console.error('Table body #bookingListBody not found!');
            return;
        }
        tableBody.innerHTML = ''; // Clear existing rows

        if (!bookings || bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No bookings found.</td></tr>';
            return;
        }

        bookings.forEach(booking => {
            try {
                // 獲取狀態和支付狀態，並確保它們是有效的字符串
                const statusClass = booking.status ? booking.status.toLowerCase().replace(/\s+/g, '-') : 'unknown';
                const paymentStatusClass = booking.payment_status ? booking.payment_status.toLowerCase().replace(/\s+/g, '-') : 'unknown';
                
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${booking.booking_id || 'N/A'}</td>
                    <td>${escapeHtml(booking.guest_name || 'N/A')}</td>
                    <td>${booking.check_in_date || 'N/A'}</td>
                    <td>${booking.check_out_date || 'N/A'}</td>
                    <td>${escapeHtml(booking.room_type || 'N/A')}</td>
                    <td>${booking.formatted_amount || booking.amount || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${escapeHtml(booking.status || 'Unknown')}</span></td>
                    <td><span class="status-badge ${paymentStatusClass}">${escapeHtml(booking.payment_status || 'Unknown')}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="table-action-btn download-btn" onclick="downloadBooking('${booking.booking_id}')" title="Download Booking PDF">
                                <i class="fas fa-download"></i>
                            </button>
                             <!-- Add other action buttons here if needed -->
                        </div>
                    </td>
                `;
            } catch (error) {
                console.error('Error creating booking row:', error, booking);
            }
        });
    }

    // Function to update summary cards
    function updateSummaryCards(summary, totalItems) {
        if (!summary) return;
        
        try {
            // 獲取每個摘要卡片，並添加錯誤處理
            const totalCard = document.querySelector('.bookings-summary .summary-card:nth-child(1) .summary-value');
            const confirmedCard = document.querySelector('.bookings-summary .summary-card:nth-child(2) .summary-value');
            const pendingCard = document.querySelector('.bookings-summary .summary-card:nth-child(3) .summary-value');
            const completedCard = document.querySelector('.bookings-summary .summary-card:nth-child(4) .summary-value');
            const cancelledCard = document.querySelector('.bookings-summary .summary-card:nth-child(5) .summary-value');
            
            // 安全地更新每個摘要卡片
            if (totalCard) totalCard.textContent = totalItems || 0;
            if (confirmedCard) confirmedCard.textContent = summary.confirmed || 0;
            if (pendingCard) pendingCard.textContent = summary.pending || 0;
            if (completedCard) completedCard.textContent = summary.completed || 0;
            if (cancelledCard) cancelledCard.textContent = summary.cancelled || 0;
        } catch (error) {
            console.error('Error updating summary cards:', error);
        }
    }

    // Function to update pagination controls
    function updatePagination(pagination) {
        if (!pagination) return;
        currentPage = pagination.currentPage;
        totalPages = pagination.totalPages;

        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) {
            console.error('Pagination container not found');
            return;
        }
        
        const prevBtn = paginationContainer.querySelector('.prev');
        const nextBtn = paginationContainer.querySelector('.next');
        if (!prevBtn || !nextBtn) {
            console.error('Pagination navigation buttons not found');
            return;
        }
        
        // Remove existing page number buttons
        paginationContainer.querySelectorAll('.pagination-btn:not(.prev):not(.next)').forEach(btn => btn.remove());

        // Add new page number buttons if totalPages > 1
        if (totalPages > 1) {
             // --- Logic to potentially limit number of visible page buttons --- 
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);

            if (currentPage <= 3) {
                endPage = Math.min(totalPages, 5);
            }
            if (currentPage >= totalPages - 2) {
                startPage = Math.max(1, totalPages - 4);
            }

            if (startPage > 1) {
                const firstBtn = document.createElement('button');
                firstBtn.classList.add('pagination-btn');
                firstBtn.textContent = '1';
                firstBtn.onclick = () => handlePaginationClick(1);
                paginationContainer.insertBefore(firstBtn, nextBtn);
                if (startPage > 2) {
                     const ellipsis = document.createElement('span');
                     ellipsis.textContent = '...';
                     ellipsis.classList.add('pagination-ellipsis');
                     paginationContainer.insertBefore(ellipsis, nextBtn);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.classList.add('pagination-btn');
                pageBtn.textContent = i;
                if (i === currentPage) {
                    pageBtn.classList.add('active');
                }
                pageBtn.onclick = () => handlePaginationClick(i);
                paginationContainer.insertBefore(pageBtn, nextBtn);
            }

            if (endPage < totalPages) {
                 if (endPage < totalPages - 1) {
                     const ellipsis = document.createElement('span');
                     ellipsis.textContent = '...';
                     ellipsis.classList.add('pagination-ellipsis');
                     paginationContainer.insertBefore(ellipsis, nextBtn);
                 }
                const lastBtn = document.createElement('button');
                lastBtn.classList.add('pagination-btn');
                lastBtn.textContent = totalPages;
                lastBtn.onclick = () => handlePaginationClick(totalPages);
                paginationContainer.insertBefore(lastBtn, nextBtn);
            }
        }

        // Enable/disable prev/next buttons
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
        
        // Check if the table footer exists
        const tableFooter = document.querySelector('.table-footer');
        if (!tableFooter) {
            console.error('Table footer not found');
            return;
        }
        
        // Hide pagination and itemsPerPage if only one page or less
        const shouldShowFooter = totalPages > 1 || pagination.totalItems > (parseInt(itemsPerPageSelectEl?.value) || 5) && itemsPerPageSelectEl?.value !== 'all';
        tableFooter.style.display = shouldShowFooter ? 'flex' : 'none';
        
        // Special case: always show itemsPerPage if 'all' is selected and there are items
        if (itemsPerPageSelectEl?.value === 'all' && pagination.totalItems > 0) {
             tableFooter.style.display = 'flex';
             paginationContainer.style.display = 'none'; // Hide page numbers when 'all' is selected
        } else if (totalPages <= 1) {
             paginationContainer.style.display = 'none';
        } else {
             paginationContainer.style.display = 'flex';
        }
    }
    
    // Make pagination click handler global or attach differently
    window.handlePaginationClick = function(page) {
        if (page === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (page === 'next' && currentPage < totalPages) {
            currentPage++;
        } else if (typeof page === 'number') {
            currentPage = page;
        }
        loadBookings(currentPage, currentFilters);
    }

    // Function to clear table and summary on error
    function clearTableAndSummary() {
        const tableBody = document.getElementById('bookingListBody');
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Error loading data.</td></tr>';
        updateSummaryCards({ total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 });
        updatePagination({ currentPage: 1, totalPages: 1, totalItems: 0, limit: itemsPerPage });
    }

    // Helper function to escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return unsafe
             .toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }
     
    // Function to show/hide loading indicator (basic example)
    function showLoading(isLoading) {
        let indicator = document.getElementById('loadingIndicator');
        if (isLoading) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'loadingIndicator';
                indicator.style.position = 'fixed';
                indicator.style.top = '50%';
                indicator.style.left = '50%';
                indicator.style.transform = 'translate(-50%, -50%)';
                indicator.style.padding = '10px 20px';
                indicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
                indicator.style.color = 'white';
                indicator.style.borderRadius = '5px';
                indicator.style.zIndex = '9999';
                indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                document.body.appendChild(indicator);
            }
            indicator.style.display = 'block';
            } else {
            if (indicator) {
                indicator.style.display = 'none';
            }
        }
    }
    
    // Function to show error messages (basic example)
    function showError(message) {
        alert(`Error: ${message}`); // Simple alert for now
    }

    // Check URL for parameters on initial load
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get hotelId from URL or use default
    const hotelIdFromUrl = urlParams.get('hotelId');
    if (hotelIdFromUrl && !isNaN(parseInt(hotelIdFromUrl))) {
        currentFilters.hotelId = parseInt(hotelIdFromUrl);
    }
    
    // Get other filter parameters from URL
    const statusFromUrl = urlParams.get('status');
    if (statusFromUrl) {
        currentFilters.status = statusFromUrl;
        if (statusFilterEl) {
            try {
                statusFilterEl.value = statusFromUrl;
            } catch (e) {
                console.error('Error setting status filter value:', e);
            }
        }
    }
    
    const dateRangeFromUrl = urlParams.get('dateRange');
    if (dateRangeFromUrl) {
        currentFilters.dateRange = dateRangeFromUrl;
        if (dateFilterEl) {
            try {
                dateFilterEl.value = dateRangeFromUrl;
            } catch (e) {
                console.error('Error setting date filter value:', e);
            }
        }
    }
    
    const searchFromUrl = urlParams.get('search');
    if (searchFromUrl) {
        currentFilters.search = searchFromUrl;
        if (searchInputEl) {
            try {
                searchInputEl.value = searchFromUrl;
            } catch (e) {
                console.error('Error setting search input value:', e);
            }
        }
    }
    
    // Get page from URL
    const pageFromUrl = urlParams.get('page');
    if (pageFromUrl && !isNaN(parseInt(pageFromUrl))) {
        currentPage = parseInt(pageFromUrl);
    }
    
    console.log(`Initial filters set from URL:`, currentFilters);
    
    // Ensure URL reflects current filters (add missing parameters)
    const initialUrl = new URL(window.location);
    initialUrl.searchParams.set('hotelId', currentFilters.hotelId);
    initialUrl.searchParams.set('status', currentFilters.status);
    initialUrl.searchParams.set('dateRange', currentFilters.dateRange);
    initialUrl.searchParams.set('page', currentPage);
    
    if (currentFilters.search) {
        initialUrl.searchParams.set('search', currentFilters.search);
    } else {
        initialUrl.searchParams.delete('search');
    }
    
    // Use replaceState to avoid adding to browser history
    try {
        history.replaceState({ ...currentFilters, page: currentPage }, '', initialUrl.toString());
    } catch (e) {
        console.error('Error updating URL:', e);
    }

    // Initial load - uses the values from URL or defaults
    loadBookings(currentPage, currentFilters);
});

// Keep export/print functions (ensure they work with dynamic data or adjust as needed)
// These might need modification to use the current data from `currentFilters` or the DOM

// Function to download individual booking as PDF (placeholder - requires API call)
window.downloadBooking = function(bookingId) {
    console.log(`Downloading PDF for booking ID: ${bookingId}`);
    alert(`Generating PDF for booking ID: ${bookingId}. This needs backend integration.`);
    // In a real implementation, this would likely call a backend endpoint
    // e.g., fetch(`/api/merchant/bookings/${bookingId}/pdf-data`).then(...)
    // and then use jsPDF with the fetched data.
}

// Function to export booking list as Excel
function exportToExcel() {
    console.log('Exporting to Excel...');
    const table = document.getElementById('bookingsTable');
    // Ensure only visible rows are exported if table is filtered client-side (which it isn't currently)
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, 'booking_list.xlsx');
}

// Function to print booking summary and list (placeholder - requires API call)
function printBookings() {
    console.log('Printing report...');
    alert('Generating print report. This needs backend integration for accurate summary/filtered data.');
    // In a real implementation, this would fetch report data from the backend:
    // e.g., fetch(`/api/merchant/bookings/report/pdf-data?${/* pass current filters */}`).then(...)
    // and then use jsPDF to generate the report.
    // For a simple print of the current view (might be inaccurate due to pagination):
    // window.print(); 
} 