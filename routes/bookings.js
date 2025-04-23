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
  // 禁用连接池的预处理语句缓存，以解决某些MySQL驱动问题
  namedPlaceholders: true
});

// Test database connection on startup
(async () => {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    
    // 明确检查当前连接的数据库
    const [dbResult] = await connection.query('SELECT DATABASE() as current_db');
    console.log('当前连接的数据库:', dbResult[0]?.current_db);
    
    // Test querying the database
    const [rows] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', rows.map(row => Object.values(row)[0]).join(', '));
    
    // 检查数据库中现有的预订记录数量
    const [bookingCount] = await connection.query('SELECT COUNT(*) as count FROM bookings');
    console.log('当前数据库中的预订记录数量:', bookingCount[0]?.count);
    
    // 获取最新的预订记录
    const [latestBooking] = await connection.query('SELECT * FROM bookings ORDER BY id DESC LIMIT 1');
    if (latestBooking.length > 0) {
      console.log('最新的预订记录ID:', latestBooking[0].id);
      console.log('最新的预订记录booking_id:', latestBooking[0].booking_id);
    } else {
      console.log('数据库中没有预订记录');
    }
    
    // Test if the bookings table exists
    const [bookingTables] = await connection.query("SHOW TABLES LIKE 'bookings'");
    if (bookingTables.length === 0) {
      console.error('WARNING: bookings table does not exist in the database!');
    } else {
      console.log('bookings table exists');
      
      // Check the structure of the bookings table
      const [bookingColumns] = await connection.query('DESCRIBE bookings');
      console.log('bookings table columns:', bookingColumns.map(col => col.Field).join(', '));
    }
    
    connection.release();
  } catch (error) {
    console.error('DATABASE CONNECTION ERROR:', error);
    console.error('Please check your database credentials and make sure the MySQL server is running.');
  }
})();

// Generate a unique booking ID
const generateBookingId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `BK-${dateStr}-${randomNum}`;
};

// API endpoint to create a new booking
router.post('/', async (req, res) => {
  console.log('POST /api/bookings endpoint hit');
  console.log('Request body:', JSON.stringify(req.body));
  
  try {
    const {
      first_name,
      last_name,
      email,
      phone_code,
      phone,
      room_type_id,
      check_in,
      check_out,
      base_fare,
      discount = 0,
      taxes,
      service_fee,
      total_amount
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !room_type_id || !check_in || !check_out || !total_amount) {
      console.log('Missing required fields:', { first_name, last_name, email, room_type_id, check_in, check_out, total_amount });
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      });
    }

    // Log connection attempt
    console.log('Attempting to connect to database...');
    
    // Start a transaction
    let connection;
    try {
      connection = await pool.getConnection();
      console.log('Database connection established');
      
      await connection.beginTransaction();
      console.log('Transaction started');

      // Check if user exists or create a new one
      let userId;
      console.log('Checking if user exists:', email);
      
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      console.log('Existing users query result:', JSON.stringify(existingUsers));

      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log('Existing user found, ID:', userId);
        
        // Update user information
        await connection.query(
          'UPDATE users SET first_name = ?, last_name = ?, phone_code = ?, phone = ?, updated_at = NOW() WHERE id = ?',
          [first_name, last_name, phone_code, phone, userId]
        );
        console.log('User information updated');
      } else {
        // Create a new user
        console.log('Creating new user:', { first_name, last_name, email });
        const [newUser] = await connection.query(
          'INSERT INTO users (first_name, last_name, email, phone_code, phone) VALUES (?, ?, ?, ?, ?)',
          [first_name, last_name, email, phone_code, phone]
        );
        userId = newUser.insertId;
        console.log('New user created, ID:', userId);
      }

      // Generate a unique booking ID
      const bookingId = generateBookingId();
      console.log('Generated booking ID:', bookingId);

      // Format dates for MySQL
      try {
        console.log('Original date strings:', { check_in, check_out });
        const checkInDate = new Date(check_in.replace(/\//g, '-'));
        const checkOutDate = new Date(check_out.replace(/\//g, '-'));
        const formattedCheckIn = checkInDate.toISOString().split('T')[0];
        const formattedCheckOut = checkOutDate.toISOString().split('T')[0];
        console.log('Formatted dates:', { formattedCheckIn, formattedCheckOut });
        
        // Validate room_type_id exists
        console.log('Checking if room_type_id exists:', room_type_id);
        const [roomTypeCheck] = await connection.query(
          'SELECT id FROM room_types WHERE id = ?',
          [room_type_id]
        );
        
        if (roomTypeCheck.length === 0) {
          console.error('Room type ID does not exist:', room_type_id);
          throw new Error(`Room type ID ${room_type_id} does not exist`);
        }
        console.log('Room type exists, proceeding with booking');
        
        // Create the booking - with detailed error logging
        try {
          console.log('Preparing to insert booking with values:', {
            bookingId,
            userId,
            room_type_id,
            formattedCheckIn,
            formattedCheckOut,
            total_amount,
            base_fare,
            discount: discount || 0,
            taxes: taxes || 0,
            service_fee: service_fee || 0
          });
          
          // 在插入预订记录时，明确指定数据库名称
          const insertSql = `
            INSERT INTO \`${process.env.DB_NAME || 'db_booking'}\`.bookings 
              (booking_id, user_id, room_type_id, check_in_date, check_out_date, 
              amount, base_fare, discount, taxes, service_fee, status, payment_status) 
            VALUES 
              ('${bookingId}', ${userId}, ${room_type_id}, '${formattedCheckIn}', '${formattedCheckOut}', 
              ${total_amount}, ${base_fare}, ${discount || 0}, ${taxes || 0}, ${service_fee || 0}, 'Confirmed', 'Paid')
          `;
          
          console.log('Direct SQL query:', insertSql);
          
          const [booking] = await connection.query(insertSql);
          console.log('Booking successfully inserted, result:', booking);

          // Update room availability (decrease available rooms)
          console.log('Updating room availability for room type:', room_type_id);

          // 首先检查当前的可用房间数量
          const [currentRooms] = await connection.query(
            `SELECT available_rooms FROM room_types WHERE id = ${room_type_id}`
          );
          console.log('Current available rooms:', currentRooms[0]?.available_rooms);

          // 如果可用房间数量大于0，则减少1
          if (currentRooms[0]?.available_rooms > 0) {
            // 使用直接SQL更新可用房间数量
            const updateRoomSql = `
              UPDATE room_types 
              SET available_rooms = available_rooms - 1 
              WHERE id = ${room_type_id} AND available_rooms > 0
            `;
            console.log('Room update SQL:', updateRoomSql);
            
            const [updateResult] = await connection.query(updateRoomSql);
            console.log('Room availability updated, result:', updateResult);
            
            // 验证更新是否生效
            const [verifyRooms] = await connection.query(
              `SELECT available_rooms FROM room_types WHERE id = ${room_type_id}`
            );
            console.log('Updated available rooms:', verifyRooms[0]?.available_rooms);
            
            if (currentRooms[0]?.available_rooms === verifyRooms[0]?.available_rooms) {
              console.warn('警告: 房间可用数量似乎没有更新!');
            } else {
              console.log('房间可用数量成功从', currentRooms[0]?.available_rooms, '更新为', verifyRooms[0]?.available_rooms);
            }
          } else {
            console.warn('警告: 房间类型', room_type_id, '没有可用房间!');
          }

          // Get room type and hotel details for response
          console.log('Fetching room and hotel details');
          const [roomTypes] = await connection.query(
            `SELECT rt.*, h.name as hotel_name, h.address as hotel_address
             FROM room_types rt
             JOIN hotels h ON rt.hotel_id = h.id
             WHERE rt.id = ?`,
            [room_type_id]
          );
          console.log('Room and hotel details fetched');

          // Commit the transaction
          console.log('Attempting to commit transaction...');
          await connection.commit();
          console.log('Transaction committed successfully');
          
          // 手动执行一个额外的提交并强制同步
          await connection.query('COMMIT');
          console.log('Executed additional COMMIT statement');
          
          // 验证记录是否真的插入
          const [verification] = await connection.query(`SELECT * FROM bookings WHERE booking_id = '${bookingId}'`);
          if (verification.length > 0) {
            console.log('验证成功: 记录已确认存在于数据库中', verification[0]);
          } else {
            console.error('验证失败: 记录未在数据库中找到!');
            throw new Error('数据库验证失败 - 记录未能插入');
          }
          
          // 释放连接
          connection.release();
          console.log('Connection released');

          // Format response
          const bookingDetails = {
            booking_id: bookingId,
            first_name,
            last_name,
            email,
            check_in: check_in,
            check_out: check_out,
            hotel_name: roomTypes[0]?.hotel_name || 'Hotel',
            hotel_address: roomTypes[0]?.hotel_address || '',
            room_type_name: roomTypes[0]?.name || 'Room',
            amount: total_amount,
            formatted_amount: `$${parseFloat(total_amount).toFixed(2)}`,
            status: 'Confirmed'
          };

          console.log('Sending successful response with booking details:', bookingDetails);
          // Return success response
          return res.json({
            success: true,
            message: 'Booking created successfully',
            booking: bookingDetails
          });
        } catch (insertError) {
          console.error('Error inserting booking:', insertError);
          throw insertError;
        }
      } catch (dateError) {
        console.error('Error processing dates:', dateError);
        throw dateError;
      }
    } catch (txError) {
      // Rollback in case of error
      console.error('Error in transaction, rolling back:', txError);
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      throw txError;
    }
  } catch (error) {
    console.error('Error creating booking:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while creating booking: ' + error.message
    });
  }
});

// GET endpoint to fetch a booking by ID
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Get booking details
    const [bookings] = await pool.query(
      `SELECT b.*, u.first_name, u.last_name, u.email, u.phone_code, u.phone,
        rt.name as room_type_name, h.name as hotel_name, h.address as hotel_address
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN room_types rt ON b.room_type_id = rt.id
      JOIN hotels h ON rt.hotel_id = h.id
      WHERE b.booking_id = ?`,
      [bookingId]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = bookings[0];
    
    // Format response
    const bookingDetails = {
      booking_id: booking.booking_id,
      first_name: booking.first_name,
      last_name: booking.last_name,
      email: booking.email,
      phone_code: booking.phone_code,
      phone: booking.phone,
      hotel_name: booking.hotel_name,
      hotel_address: booking.hotel_address,
      room_type_name: booking.room_type_name,
      check_in: booking.check_in_date,
      check_out: booking.check_out_date,
      formatted_check_in: new Date(booking.check_in_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }),
      formatted_check_out: new Date(booking.check_out_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }),
      amount: booking.amount,
      formatted_amount: `$${parseFloat(booking.amount).toFixed(2)}`,
      status: booking.status
    };
    
    return res.json({
      success: true,
      booking: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching booking'
    });
  }
});

// POST endpoint to cancel a booking
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get booking details
      const [bookings] = await connection.query(
        'SELECT * FROM bookings WHERE booking_id = ?',
        [bookingId]
      );
      
      if (bookings.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      const booking = bookings[0];
      
      // Check if booking can be cancelled
      if (booking.status === 'Cancelled') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled'
        });
      }
      
      // Update booking status to cancelled
      await connection.query(
        'UPDATE bookings SET status = "Cancelled", payment_status = "Refunded", updated_at = NOW() WHERE booking_id = ?',
        [bookingId]
      );
      
      // Increase room availability
      await connection.query(
        'UPDATE room_types SET available_rooms = available_rooms + 1 WHERE id = ?',
        [booking.room_type_id]
      );
      
      // Commit the transaction
      await connection.commit();
      connection.release();
      
      // Calculate refund amount (full refund for now)
      const refundAmount = booking.amount;
      
      return res.json({
        success: true,
        message: 'Booking cancelled successfully',
        refund: {
          amount: refundAmount,
          formatted_amount: `$${parseFloat(refundAmount).toFixed(2)}`,
          estimated_days: '5-7 business days'
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while cancelling booking'
    });
  }
});

// GET endpoint for booking details needed for checkout page
router.get('/booking/details', async (req, res) => {
  try {
    const { roomTypeId, checkIn, checkOut } = req.query;
    
    // Validate required parameters
    if (!roomTypeId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: roomTypeId, checkIn, and checkOut are required'
      });
    }
    
    // Parse dates
    const checkInDate = new Date(checkIn.replace(/\//g, '-'));
    const checkOutDate = new Date(checkOut.replace(/\//g, '-'));
    
    // Calculate number of nights
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // Get room type and hotel details
    const [roomTypes] = await pool.query(
      `SELECT rt.*, h.name as hotel_name, h.address as hotel_address
       FROM room_types rt
       JOIN hotels h ON rt.hotel_id = h.id
       WHERE rt.id = ?`,
      [roomTypeId]
    );
    
    if (roomTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found'
      });
    }
    
    const roomType = roomTypes[0];
    
    // Calculate price details
    const basePrice = parseFloat(roomType.price);
    const taxes = Math.round(basePrice * nights * 0.08 * 100) / 100; // 8% tax
    const serviceFee = 5;
    const totalAmount = Math.round((basePrice * nights + taxes + serviceFee) * 100) / 100;
    
    // Format response
    const bookingDetails = {
      room_type_id: roomType.id,
      room_type_name: roomType.name,
      hotel_name: roomType.hotel_name,
      hotel_address: roomType.hotel_address,
      check_in: checkIn,
      check_out: checkOut,
      nights,
      price_details: {
        base_fare: basePrice,
        formatted_base_fare: `$${basePrice.toFixed(2)}`,
        discount: 0,
        formatted_discount: '$0.00',
        taxes,
        formatted_taxes: `$${taxes.toFixed(2)}`,
        service_fee: serviceFee,
        formatted_service_fee: `$${serviceFee.toFixed(2)}`,
        total_amount: totalAmount,
        formatted_total_amount: `$${totalAmount.toFixed(2)}`
      }
    };
    
    return res.json({
      success: true,
      booking_details: bookingDetails
    });
  } catch (error) {
    console.error('Error getting booking details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while getting booking details'
    });
  }
});

module.exports = router; 