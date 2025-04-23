const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true
});

// Helper function to format date for display
const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
        // Assuming date is already a Date object or string like 'YYYY-MM-DD'
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
    } catch (e) {
        return date; // Return original if formatting fails
    }
};

// GET /api/merchant/bookings - Fetch bookings for merchant view
router.get('/bookings', async (req, res) => {
    // Use a large number (e.g., > 1000) to signify 'all' items per page
    const requestedLimit = parseInt(req.query.limit) || 5;
    const isRequestingAll = requestedLimit > 1000; // Check if 'all' was requested
    const limit = isRequestingAll ? 100000 : requestedLimit; // Set a very high DB limit for 'all', or use requested
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    const { status, dateRange, search, hotelId = 6 } = req.query;

    console.log('Fetching merchant bookings with filters:', { status, dateRange, search, page, limit: isRequestingAll ? 'all' : limit, hotelId });

    try {
        const currentHotelId = parseInt(hotelId);
        let whereClauses = ['rt.hotel_id = :hotelId']; 
        let params = { hotelId: currentHotelId };

        // Status filter
        if (status && status !== 'all') {
            whereClauses.push('b.status = :status');
            params.status = status;
        }

        // Date range filter
        if (dateRange && dateRange !== 'all') {
            const today = new Date();
            let startDate, endDate;
            switch (dateRange) {
                case 'today':
                    startDate = new Date(today.setHours(0, 0, 0, 0));
                    endDate = new Date(today.setHours(23, 59, 59, 999));
                    break;
                case 'week':
                    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                    startDate = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
                    const lastDayOfWeek = new Date(firstDayOfWeek);
                    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
                    endDate = new Date(lastDayOfWeek.setHours(23, 59, 59, 999));
                    break;
                case 'month':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
            }
            if (startDate && endDate) {
                whereClauses.push('b.check_in_date BETWEEN :startDate AND :endDate');
                params.startDate = startDate.toISOString().split('T')[0];
                params.endDate = endDate.toISOString().split('T')[0];    
            }
        }

        // Search filter
        if (search) {
            whereClauses.push('(b.booking_id LIKE :searchQuery OR CONCAT(u.first_name, " ", u.last_name) LIKE :searchQuery)');
            params.searchQuery = `%${search}%`;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Construct LIMIT clause only if not requesting 'all'
        const limitClause = isRequestingAll ? '' : 'LIMIT :limit OFFSET :offset';
        if (!isRequestingAll) {
            params.limit = limit;
            params.offset = offset;
        }

        // Query for bookings
        const bookingsQuery = `
            SELECT
                b.id, b.booking_id, CONCAT(u.first_name, ' ', u.last_name) AS guest_name,
                b.check_in_date, b.check_out_date, rt.name AS room_type,
                b.amount, b.status, b.payment_status, b.created_at
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN room_types rt ON b.room_type_id = rt.id
            ${whereSql}
            ORDER BY b.created_at DESC
            ${limitClause} 
        `;

        console.log('Bookings Query:', bookingsQuery);
        console.log('Bookings Params:', params);

        const [bookings] = await pool.query(bookingsQuery, params);

        // Query for total count (needed regardless of limit)
        const countQuery = `
            SELECT COUNT(*) as totalCount
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN room_types rt ON b.room_type_id = rt.id
            ${whereSql}
        `;
        const countParams = { ...params };
        delete countParams.limit; // Remove limit/offset for total count
        delete countParams.offset;

        console.log('Count Query:', countQuery);
        console.log('Count Params:', countParams);

        const [countResult] = await pool.query(countQuery, countParams);
        const totalBookings = countResult[0].totalCount;
        
        // Calculate total pages based on the *actual* limit used for the response
        const responseLimit = isRequestingAll ? totalBookings : limit; // If all, limit is total items
        const calculatedTotalPages = isRequestingAll ? 1 : Math.ceil(totalBookings / limit);

        // Query for summary counts
        const summaryQuery = `
            SELECT status, COUNT(*) as count
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN room_types rt ON b.room_type_id = rt.id
            ${whereSql}
            GROUP BY status
        `;
        const [summaryResults] = await pool.query(summaryQuery, countParams);
        const summary = { total: totalBookings, confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
        summaryResults.forEach(row => {
            const statusKey = row.status.toLowerCase();
            if (summary.hasOwnProperty(statusKey)) {
                summary[statusKey] = row.count;
            }
        });

        // Format bookings data
        const formattedBookings = bookings.map(b => ({
            ...b,
            check_in_date: formatDate(b.check_in_date),
            check_out_date: formatDate(b.check_out_date),
            formatted_amount: `$${parseFloat(b.amount).toFixed(2)}`
        }));

        res.json({
            success: true,
            bookings: formattedBookings,
            pagination: {
                currentPage: isRequestingAll ? 1 : page, // Always page 1 if showing all
                totalPages: calculatedTotalPages,
                totalItems: totalBookings,
                limit: responseLimit // Reflect the actual limit used
            },
            summary: summary,
            filters: { status, dateRange, search, hotelId: currentHotelId } 
        });

    } catch (error) {
        console.error('Error fetching merchant bookings:', error);
        res.status(500).json({ success: false, message: 'Server error fetching bookings' });
    }
});

// PUT /api/merchant/hotels/:id - Update hotel information
router.put('/hotels/:id', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.id);
        const { name, star_rating, location, address, description } = req.body;
        
        console.log(`Updating hotel ${hotelId} with data:`, req.body);
        
        // Validate required fields
        if (!name || !star_rating || !location || !address) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name, star_rating, location, and address are required' 
            });
        }
        
        // Update hotel in database
        const updateQuery = `
            UPDATE hotels 
            SET name = ?, star_rating = ?, location = ?, address = ?, description = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await pool.query(updateQuery, [
            name, 
            star_rating, 
            location, 
            address, 
            description || '', 
            hotelId
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Hotel with ID ${hotelId} not found`
            });
        }
        
        // Fetch updated hotel data
        const [hotels] = await pool.query(
            'SELECT * FROM hotels WHERE id = ?',
            [hotelId]
        );
        
        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Hotel with ID ${hotelId} not found`
            });
        }
        
        res.json({
            success: true,
            message: 'Hotel information updated successfully',
            hotel: hotels[0]
        });
        
    } catch (error) {
        console.error('Error updating hotel information:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating hotel information' 
        });
    }
});

// GET /api/merchant/hotels/:id - Get hotel information
router.get('/hotels/:id', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.id);
        
        // Fetch hotel data
        const [hotels] = await pool.query(
            'SELECT * FROM hotels WHERE id = ?',
            [hotelId]
        );
        
        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Hotel with ID ${hotelId} not found`
            });
        }
        
        res.json({
            success: true,
            hotel: hotels[0]
        });
        
    } catch (error) {
        console.error('Error fetching hotel information:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching hotel information' 
        });
    }
});

// PATCH /api/merchant/room-types/:id/inventory - Update room type inventory
router.patch('/room-types/:id/inventory', async (req, res) => {
    try {
        const roomTypeId = parseInt(req.params.id);
        const { available_rooms } = req.body;
        
        console.log(`Updating inventory for room type ${roomTypeId} to ${available_rooms}`);
        
        // Validate input
        if (available_rooms === undefined || isNaN(parseInt(available_rooms)) || parseInt(available_rooms) < 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Available rooms must be a non-negative number' 
            });
        }
        
        const newInventory = parseInt(available_rooms);
        
        // Update room type inventory in database
        const updateQuery = `
            UPDATE room_types 
            SET available_rooms = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await pool.query(updateQuery, [newInventory, roomTypeId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Room type with ID ${roomTypeId} not found`
            });
        }
        
        res.json({
            success: true,
            message: 'Room inventory updated successfully',
            available_rooms: newInventory
        });
        
    } catch (error) {
        console.error('Error updating room inventory:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating room inventory' 
        });
    }
});

// GET /api/merchant/room-types/:hotel_id - Get room types for a hotel
router.get('/room-types/:hotel_id', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.hotel_id);
        
        // Fetch room types for the hotel
        const [roomTypes] = await pool.query(
            'SELECT * FROM room_types WHERE hotel_id = ? ORDER BY name',
            [hotelId]
        );
        
        res.json({
            success: true,
            room_types: roomTypes
        });
        
    } catch (error) {
        console.error('Error fetching room types:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching room types' 
        });
    }
});

// GET /api/merchant/hotels/:hotel_id/room-types - Get room types for a specific hotel
router.get('/hotels/:hotel_id/room-types', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.hotel_id);
        
        console.log(`Fetching room types for hotel ID: ${hotelId}`);
        
        // Fetch room types for the hotel
        const [roomTypes] = await pool.query(
            'SELECT * FROM room_types WHERE hotel_id = ? ORDER BY name',
            [hotelId]
        );
        
        console.log(`Found ${roomTypes.length} room types for hotel ID: ${hotelId}`);
        
        res.json({
            success: true,
            room_types: roomTypes
        });
        
    } catch (error) {
        console.error('Error fetching room types:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching room types' 
        });
    }
});

// POST /api/merchant/hotels/:hotel_id/room-types - Create a new room type for a hotel
router.post('/hotels/:hotel_id/room-types', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.hotel_id);
        const { name, price, description, capacity, amenities, available_rooms, image_path } = req.body;
        
        console.log(`Creating new room type for hotel ID: ${hotelId}`, req.body);
        
        // Validate required fields
        if (!name || !price || isNaN(parseFloat(price))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name and valid price are required' 
            });
        }
        
        // Insert new room type into database
        const [result] = await pool.query(
            `INSERT INTO room_types (hotel_id, name, price, description, capacity, amenities, available_rooms, image_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                hotelId,
                name,
                parseFloat(price),
                description || '',
                capacity || '',
                amenities || '',
                available_rooms ? parseInt(available_rooms) : 0,
                image_path || null
            ]
        );
        
        // Get the newly created room type
        const [roomTypes] = await pool.query(
            'SELECT * FROM room_types WHERE id = ?',
            [result.insertId]
        );
        
        if (roomTypes.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Room type was created but could not be retrieved'
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Room type created successfully',
            room_type: roomTypes[0]
        });
        
    } catch (error) {
        console.error('Error creating room type:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error creating room type' 
        });
    }
});

// DELETE /api/merchant/hotels/:hotel_id/room-types/:id - Delete a room type
router.delete('/hotels/:hotel_id/room-types/:id', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.hotel_id);
        const roomTypeId = parseInt(req.params.id);
        
        console.log(`Deleting room type ID: ${roomTypeId} from hotel ID: ${hotelId}`);
        
        // Delete room type from database
        const [result] = await pool.query(
            'DELETE FROM room_types WHERE id = ? AND hotel_id = ?',
            [roomTypeId, hotelId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Room type with ID ${roomTypeId} not found for hotel ID ${hotelId}`
            });
        }
        
        res.json({
            success: true,
            message: 'Room type deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting room type:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error deleting room type' 
        });
    }
});

// PUT /api/merchant/hotels/:hotel_id/room-types/:id - Update a room type
router.put('/hotels/:hotel_id/room-types/:id', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.hotel_id);
        const roomTypeId = parseInt(req.params.id);
        const { name, price, description, capacity, amenities, available_rooms, image_path } = req.body;
        
        console.log(`Updating room type ID: ${roomTypeId} for hotel ID: ${hotelId}`, req.body);
        
        // Validate required fields
        if (!name || !price || isNaN(parseFloat(price))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name and valid price are required' 
            });
        }
        
        // Update room type in database
        const [result] = await pool.query(
            `UPDATE room_types 
             SET name = ?, price = ?, description = ?, capacity = ?, 
                 amenities = ?, available_rooms = ?, image_path = ?,
                 updated_at = NOW()
             WHERE id = ? AND hotel_id = ?`,
            [
                name,
                parseFloat(price),
                description || '',
                capacity || '',
                amenities || '',
                available_rooms ? parseInt(available_rooms) : 0,
                image_path || null,
                roomTypeId,
                hotelId
            ]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Room type with ID ${roomTypeId} not found for hotel ID ${hotelId}`
            });
        }
        
        // Get the updated room type
        const [roomTypes] = await pool.query(
            'SELECT * FROM room_types WHERE id = ?',
            [roomTypeId]
        );
        
        if (roomTypes.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Room type was updated but could not be retrieved'
            });
        }
        
        res.json({
            success: true,
            message: 'Room type updated successfully',
            room_type: roomTypes[0]
        });
        
    } catch (error) {
        console.error('Error updating room type:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating room type' 
        });
    }
});

module.exports = router; 