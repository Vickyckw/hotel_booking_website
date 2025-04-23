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
  queueLimit: 0
});

// API endpoint to search for hotels
router.get('/search', async (req, res) => {
  try {
    const { location, rooms, checkIn, checkOut, sortBy, sortOrder } = req.query;
    
    // Validate required parameters
    if (!location || !checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: location, checkIn, and checkOut are required' 
      });
    }
    
    // Parse dates and validate
    const checkInDate = new Date(checkIn.replace(/\//g, '-'));
    const checkOutDate = new Date(checkOut.replace(/\//g, '-'));
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format. Use YYYY/MM/DD format.' 
      });
    }
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check-out date must be after check-in date' 
      });
    }
    
    // Calculate number of nights
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // Format dates for MySQL query
    const formattedCheckIn = checkInDate.toISOString().split('T')[0];
    const formattedCheckOut = checkOutDate.toISOString().split('T')[0];
    
    // Determine required room capacity based on number of rooms
    let minRoomCapacity = 1;
    if (rooms && !isNaN(parseInt(rooms))) {
      minRoomCapacity = parseInt(rooms);
    }
    
    // Determine sort conditions based on parameters
    let orderByClause = 'h.star_rating DESC, starting_price ASC';
    
    if (sortBy && sortOrder) {
      // Validate sort parameters
      const validSortByValues = ['price', 'rating'];
      const validSortOrderValues = ['asc', 'desc', 'high-to-low', 'low-to-high'];
      
      if (validSortByValues.includes(sortBy.toLowerCase())) {
        let direction = 'ASC';
        
        // Map frontend sort order to SQL direction
        if (sortOrder.toLowerCase() === 'desc' || sortOrder.toLowerCase() === 'high-to-low') {
          direction = 'DESC';
        } else if (sortOrder.toLowerCase() === 'asc' || sortOrder.toLowerCase() === 'low-to-high') {
          direction = 'ASC';
        }
        
        // Set order by clause based on sort parameters
        if (sortBy.toLowerCase() === 'price') {
          orderByClause = `starting_price ${direction}`;
        } else if (sortBy.toLowerCase() === 'rating') {
          orderByClause = `h.star_rating ${direction}`;
        }
      }
    }
    
    // Query to find available hotels with room types that match criteria
    const query = `
      SELECT 
        h.id,
        h.name,
        h.star_rating,
        h.location,
        h.address,
        h.description,
        h.min_price,
        MIN(rt.price) AS starting_price,
        (SELECT hi.image_path FROM hotel_images hi WHERE hi.hotel_id = h.id AND hi.is_main = 1 LIMIT 1) AS main_image,
        COUNT(DISTINCT rt.id) AS available_room_types
      FROM 
        hotels h
      JOIN 
        room_types rt ON h.id = rt.hotel_id
      WHERE 
        h.location LIKE ? 
        AND rt.available_rooms > 0
        AND rt.capacity >= ?
      GROUP BY 
        h.id
      HAVING 
        available_room_types > 0
      ORDER BY 
        ${orderByClause}
    `;
    
    // Execute the query
    const [hotels] = await pool.query(query, [`%${location}%`, minRoomCapacity]);
    
    // Calculate total price for each hotel based on nights
    const hotelsWithPricing = hotels.map(hotel => {
      const totalPrice = parseFloat(hotel.starting_price) * nights;
      return {
        ...hotel,
        nights,
        price_per_night: parseFloat(hotel.starting_price),
        total_price: totalPrice,
        formatted_total_price: `$${totalPrice.toFixed(2)}`
      };
    });
    
    return res.json({
      success: true,
      results: {
        hotels: hotelsWithPricing,
        search_info: {
          location,
          check_in: checkIn,
          check_out: checkOut,
          rooms: rooms || '1 Room',
          total_results: hotelsWithPricing.length,
          sort: {
            by: sortBy || 'rating',
            order: sortOrder || 'desc'
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error searching hotels:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred while searching for hotels' 
    });
  }
});

// API endpoint to get hotel details
router.get('/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const { checkIn, checkOut } = req.query;
    
    // Parse dates if provided
    let nights = 1;
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn.replace(/\//g, '-'));
      const checkOutDate = new Date(checkOut.replace(/\//g, '-'));
      
      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
        nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      }
    }
    
    // Get hotel details
    const [hotels] = await pool.query(
      `SELECT 
        h.*,
        (SELECT MIN(price) FROM room_types WHERE hotel_id = h.id AND available_rooms > 0) AS min_price_per_night
      FROM 
        hotels h
      WHERE 
        h.id = ?`,
      [hotelId]
    );
    
    if (hotels.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hotel not found' 
      });
    }
    
    const hotel = hotels[0];
    
    // Get room types for the hotel
    const [roomTypes] = await pool.query(
      `SELECT 
        rt.*,
        (rt.price * ?) AS total_price
      FROM 
        room_types rt
      WHERE 
        rt.hotel_id = ? 
        AND rt.available_rooms > 0
      ORDER BY 
        rt.price ASC`,
      [nights, hotelId]
    );
    
    // Get hotel images
    const [images] = await pool.query(
      `SELECT 
        image_path,
        is_main
      FROM 
        hotel_images
      WHERE 
        hotel_id = ?
      ORDER BY 
        is_main DESC`,
      [hotelId]
    );
    
    // Format response
    return res.json({
      success: true,
      data: {
        ...hotel,
        price_per_night: parseFloat(hotel.min_price_per_night),
        total_price: parseFloat(hotel.min_price_per_night) * nights,
        nights,
        room_types: roomTypes.map(rt => ({
          ...rt,
          price: parseFloat(rt.price),
          total_price: parseFloat(rt.total_price)
        })),
        images: images.map(img => img.image_path)
      }
    });
    
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred while fetching hotel details' 
    });
  }
});

module.exports = router; 