const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // Create connection without database first (to be able to create it)
  const initialConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  console.log('Connected to MySQL server');

  // Create database if it doesn't exist
  try {
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created or already exists`);

    // Close initial connection
    await initialConnection.end();
    
    // Create connection to the specific database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });
    
    console.log(`Connected to database ${process.env.DB_NAME}`);
    
    // Read and execute the SQL schema file
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    await connection.query(schemaSQL);
    console.log('Database schema created successfully');
    
    // Insert sample data
    await insertSampleData(connection);
    console.log('Sample data inserted successfully');
    
    // Close connection
    await connection.end();
    console.log('Database setup completed');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

async function insertSampleData(connection) {
  // Sample hotels
  const hotels = [
    {
      name: 'Grand Hotel Luxe',
      star_rating: 5,
      location: 'London, UK',
      address: '123 Luxury Street, London, UK',
      description: 'Experience unparalleled luxury in the heart of London with stunning city views and world-class amenities.',
      min_price: 199.99
    },
    {
      name: 'Seaside Resort & Spa',
      star_rating: 4,
      location: 'Miami, USA',
      address: '456 Beach Boulevard, Miami, FL, USA',
      description: 'A beautiful beachfront resort with stunning ocean views, multiple pools, and a full-service spa.',
      min_price: 149.99
    },
    {
      name: 'Urban Boutique Hotel',
      star_rating: 3,
      location: 'London, UK',
      address: '789 High Street, London, UK',
      description: 'A charming boutique hotel located in the bustling city center, perfect for business and leisure travelers.',
      min_price: 89.99
    },
    {
      name: 'Mountain View Lodge',
      star_rating: 4,
      location: 'Aspen, USA',
      address: '101 Mountain Road, Aspen, CO, USA',
      description: 'A cozy mountain retreat with breathtaking views, ski-in/ski-out access, and rustic-chic accommodations.',
      min_price: 129.99
    },
    {
      name: 'City Center Suites',
      star_rating: 3,
      location: 'London, UK',
      address: '202 Main Street, London, UK',
      description: 'Modern suites in the center of the city, offering convenience and comfort for extended stays.',
      min_price: 99.99
    }
  ];
  
  for (const hotel of hotels) {
    const [result] = await connection.query(
      'INSERT INTO hotels (name, star_rating, location, address, description, min_price) VALUES (?, ?, ?, ?, ?, ?)',
      [hotel.name, hotel.star_rating, hotel.location, hotel.address, hotel.description, hotel.min_price]
    );
    
    const hotelId = result.insertId;
    
    // Add hotel images
    await connection.query(
      'INSERT INTO hotel_images (hotel_id, image_path, is_main) VALUES (?, ?, ?)',
      [hotelId, `hotel${hotelId % 4 + 1}.jpg`, true]
    );
    
    // Add additional images
    for (let i = 1; i <= 3; i++) {
      await connection.query(
        'INSERT INTO hotel_images (hotel_id, image_path, is_main) VALUES (?, ?, ?)',
        [hotelId, `hotel${(hotelId + i) % 4 + 1}.jpg`, false]
      );
    }
    
    // Add room types for each hotel
    const roomTypes = [
      {
        name: 'Standard Room',
        price: hotel.min_price,
        description: 'Comfortable room with essential amenities for a pleasant stay.',
        capacity: '1-2 Guests',
        amenities: 'Free Wi-Fi, TV, Air Conditioning',
        available_rooms: 10,
        image_path: 'hotel.jpg'
      },
      {
        name: 'Deluxe Room',
        price: hotel.min_price * 1.5,
        description: 'Spacious room with premium amenities and enhanced comfort.',
        capacity: '2-3 Guests',
        amenities: 'Free Wi-Fi, TV, Air Conditioning, Mini Bar, Coffee Machine',
        available_rooms: 7,
        image_path: 'hotel.jpg'
      },
      {
        name: 'Suite',
        price: hotel.min_price * 2.5,
        description: 'Luxurious suite with separate living area and premium amenities.',
        capacity: '2-4 Guests',
        amenities: 'Free Wi-Fi, TV, Air Conditioning, Mini Bar, Coffee Machine, Room Service, Sitting Area',
        available_rooms: 5,
        image_path: 'hotel.jpg'
      }
    ];
    
    for (const roomType of roomTypes) {
      await connection.query(
        'INSERT INTO room_types (hotel_id, name, price, description, capacity, amenities, available_rooms, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [hotelId, roomType.name, roomType.price, roomType.description, roomType.capacity, roomType.amenities, roomType.available_rooms, roomType.image_path]
      );
    }
  }
  
  // Add sample users
  const users = [
    {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone_code: '+1',
      phone: '555-123-4567'
    },
    {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone_code: '+44',
      phone: '20-1234-5678'
    }
  ];
  
  for (const user of users) {
    await connection.query(
      'INSERT INTO users (first_name, last_name, email, phone_code, phone) VALUES (?, ?, ?, ?, ?)',
      [user.first_name, user.last_name, user.email, user.phone_code, user.phone]
    );
  }
}

// Run the setup function
setupDatabase().then(() => {
  console.log('Database setup completed successfully');
}).catch(err => {
  console.error('Failed to setup database:', err);
}); 