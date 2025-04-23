-- MySQL Database Design

-- Create hotels table
CREATE TABLE hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    star_rating INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT,
    min_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create hotel images table
CREATE TABLE hotel_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Create room types table
CREATE TABLE room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    capacity VARCHAR(50) NOT NULL,
    amenities TEXT,
    available_rooms INT NOT NULL DEFAULT 0,
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_code VARCHAR(10),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    room_type_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    taxes DECIMAL(10, 2) DEFAULT 0,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    status ENUM('Confirmed', 'Pending', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    payment_status ENUM('Paid', 'Unpaid', 'Refunded') NOT NULL DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

-- Table Relationships Explanation

-- 1. hotels and hotel_images: One-to-Many relationship
--    - A hotel can have multiple images
--    - Foreign key hotel_id in hotel_images table references the id in hotels table

-- 2. hotels and room_types: One-to-Many relationship
--    - A hotel can have multiple room types
--    - Foreign key hotel_id in room_types table references the id in hotels table

-- 3. room_types and bookings: One-to-Many relationship
--    - A room type can have multiple bookings
--    - Foreign key room_type_id in bookings table references the id in room_types table

-- 4. users and bookings: One-to-Many relationship
--    - A user can have multiple bookings
--    - Foreign key user_id in bookings table references the id in users table 

-- Insert test data for hotels table
INSERT INTO hotels (name, star_rating, location, address, description, min_price) VALUES
('Grand Hotel Luxe', 5, 'London, UK', '123 Luxury Street, London, UK', 'Experience unparalleled luxury in the heart of London. Featuring elegant rooms, fine dining, and world-class amenities.', 199.99),
('Ocean View Resort', 4, 'Miami, USA', '456 Beachfront Avenue, Miami, FL, USA', 'A stunning beachfront resort with spectacular ocean views, multiple pools, and direct beach access.', 149.99),
('Mountain Retreat Lodge', 3, 'Aspen, USA', '789 Alpine Way, Aspen, CO, USA', 'Cozy mountain lodge perfect for ski enthusiasts and nature lovers. Close to ski slopes and hiking trails.', 129.99),
('City Center Inn', 3, 'New York, USA', '101 Broadway Street, New York, NY, USA', 'Affordable comfort in the heart of Manhattan. Walking distance to major attractions and shopping districts.', 109.99),
('Sunset Beach Hotel', 4, 'Bali, Indonesia', '202 Sunset Road, Kuta, Bali, Indonesia', 'Serene beachfront property with traditional Balinese architecture, spa services, and stunning sunset views.', 179.99);

-- Insert test data for hotel_images table
INSERT INTO hotel_images (hotel_id, image_path, is_main) VALUES
(1, 'hotel1_main.jpg', 1),
(1, 'hotel1_lobby.jpg', 0),
(1, 'hotel1_restaurant.jpg', 0),
(1, 'hotel1_suite.jpg', 0),
(2, 'hotel2_main.jpg', 1),
(2, 'hotel2_pool.jpg', 0),
(2, 'hotel2_beach.jpg', 0),
(3, 'hotel3_main.jpg', 1),
(3, 'hotel3_exterior.jpg', 0),
(3, 'hotel3_fireplace.jpg', 0),
(4, 'hotel4_main.jpg', 1),
(4, 'hotel4_room.jpg', 0),
(5, 'hotel5_main.jpg', 1),
(5, 'hotel5_pool.jpg', 0),
(5, 'hotel5_garden.jpg', 0);

-- Insert test data for room_types table
INSERT INTO room_types (hotel_id, name, price, description, capacity, amenities, available_rooms, image_path) VALUES
(1, 'Deluxe King Room', 199.99, 'Spacious room with king-sized bed, luxury linens, and marble bathroom. City views.', '1-2 Guests', 'Free Wi-Fi, 55" Smart TV, Air Conditioning, Mini Bar, Room Service, Safe', 5, 'deluxe_king.jpg'),
(1, 'Executive Suite', 299.99, 'Elegant suite with separate living area, king-sized bed, and premium amenities.', '1-2 Guests', 'Free Wi-Fi, 65" Smart TV, Air Conditioning, Mini Bar, Room Service, Safe, Jacuzzi, Lounge Access', 3, 'executive_suite.jpg'),
(1, 'Family Room', 349.99, 'Comfortable room with two queen beds, perfect for families or groups.', '2-4 Guests', 'Free Wi-Fi, 55" Smart TV, Air Conditioning, Mini Bar, Room Service, Safe, Connecting Rooms Available', 4, 'family_room.jpg'),
(2, 'Ocean View Room', 149.99, 'Comfortable room with breathtaking views of the Atlantic Ocean.', '1-2 Guests', 'Free Wi-Fi, Balcony, Air Conditioning, Mini Fridge, Coffee Maker, Safe', 8, 'ocean_view.jpg'),
(2, 'Beachfront Suite', 249.99, 'Luxurious suite with direct beach access and panoramic ocean views.', '1-3 Guests', 'Free Wi-Fi, Private Balcony, Air Conditioning, Mini Bar, Room Service, Safe, Jacuzzi', 4, 'beachfront_suite.jpg'),
(3, 'Standard Mountain Room', 129.99, 'Cozy room with rustic décor and mountain views.', '1-2 Guests', 'Free Wi-Fi, Fireplace, Coffee Maker, Heating, TV', 6, 'mountain_room.jpg'),
(3, 'Deluxe Cabin', 189.99, 'Standalone cabin with fireplace, kitchenette, and private porch.', '2-4 Guests', 'Free Wi-Fi, Full Kitchenette, Fireplace, TV, Private Porch, BBQ Grill', 3, 'deluxe_cabin.jpg'),
(4, 'Standard Queen Room', 109.99, 'Compact, comfortable room with queen bed in the heart of the city.', '1-2 Guests', 'Free Wi-Fi, TV, Air Conditioning, Coffee Maker', 10, 'queen_room.jpg'),
(4, 'Double Twin Room', 119.99, 'Practical room with two twin beds, ideal for friends or colleagues.', '1-2 Guests', 'Free Wi-Fi, TV, Air Conditioning, Coffee Maker', 8, 'twin_room.jpg'),
(5, 'Garden View Bungalow', 179.99, 'Traditional Balinese bungalow surrounded by lush tropical gardens.', '1-2 Guests', 'Free Wi-Fi, Air Conditioning, Outdoor Shower, Patio, Mini Bar', 6, 'garden_bungalow.jpg'),
(5, 'Beachfront Villa', 349.99, 'Luxurious villa with private pool and direct beach access.', '2-4 Guests', 'Free Wi-Fi, Private Pool, Air Conditioning, Full Kitchen, Outdoor Dining Area, Beach Access', 2, 'beachfront_villa.jpg');

-- Insert test data for users table
INSERT INTO users (first_name, last_name, email, phone_code, phone) VALUES
('John', 'Smith', 'john.smith@example.com', '+1', '2125551234'),
('Emma', 'Johnson', 'emma.johnson@example.com', '+44', '2071234567'),
('Michael', 'Williams', 'michael.williams@example.com', '+1', '3105559876'),
('Sophia', 'Brown', 'sophia.brown@example.com', '+61', '412345678'),
('James', 'Davis', 'james.davis@example.com', '+1', '4155552468'),
('Olivia', 'Miller', 'olivia.miller@example.com', '+49', '15212345678'),
('William', 'Wilson', 'william.wilson@example.com', '+86', '13812345678'),
('Charlotte', 'Taylor', 'charlotte.taylor@example.com', '+33', '612345678'),
('Daniel', 'Anderson', 'daniel.anderson@example.com', '+39', '3123456789'),
('Amelia', 'Thomas', 'amelia.thomas@example.com', '+81', '9012345678');

-- Insert test data for bookings table
INSERT INTO bookings (booking_id, user_id, room_type_id, check_in_date, check_out_date, amount, base_fare, discount, taxes, service_fee, status, payment_status) VALUES
('BK-20230601-1001', 1, 1, '2023-06-10', '2023-06-15', 1039.95, 999.95, 50.00, 70.00, 20.00, 'Completed', 'Paid'),
('BK-20230615-1002', 2, 4, '2023-06-20', '2023-06-25', 779.95, 749.95, 30.00, 45.00, 15.00, 'Completed', 'Paid'),
('BK-20230701-1003', 3, 7, '2023-07-05', '2023-07-10', 989.95, 949.95, 40.00, 60.00, 20.00, 'Completed', 'Paid'),
('BK-20230715-1004', 4, 10, '2023-07-20', '2023-07-25', 929.95, 899.95, 35.00, 50.00, 15.00, 'Completed', 'Paid'),
('BK-20230801-1005', 5, 2, '2023-08-10', '2023-08-13', 929.97, 899.97, 45.00, 55.00, 20.00, 'Completed', 'Paid'),
('BK-20230815-1006', 6, 5, '2023-08-20', '2023-08-23', 779.97, 749.97, 30.00, 45.00, 15.00, 'Completed', 'Paid'),
('BK-20230901-1007', 7, 8, '2023-09-05', '2023-09-10', 579.95, 549.95, 25.00, 40.00, 15.00, 'Confirmed', 'Paid'),
('BK-20230915-1008', 8, 11, '2023-09-20', '2023-09-27', 2484.93, 2449.93, 100.00, 100.00, 35.00, 'Cancelled', 'Refunded'),
('BK-20231001-1009', 9, 3, '2023-10-10', '2023-10-15', 1789.95, 1749.95, 90.00, 100.00, 30.00, 'Confirmed', 'Paid'),
('BK-20231015-1010', 10, 6, '2023-10-20', '2023-10-27', 1349.93, 1299.93, 65.00, 85.00, 30.00, 'Confirmed', 'Paid'),
('BK-20231101-1011', 1, 9, '2023-11-05', '2023-11-08', 369.97, 359.97, 15.00, 20.00, 5.00, 'Pending', 'Unpaid'),
('BK-20231115-1012', 2, 1, '2023-11-20', '2023-11-25', 1039.95, 999.95, 50.00, 70.00, 20.00, 'Pending', 'Unpaid'),
('BK-20231201-1013', 3, 4, '2023-12-10', '2023-12-15', 779.95, 749.95, 30.00, 45.00, 15.00, 'Pending', 'Unpaid'),
('BK-20231215-1014', 4, 7, '2023-12-20', '2023-12-27', 1399.93, 1329.93, 65.00, 100.00, 35.00, 'Pending', 'Unpaid'),
('BK-20240101-1015', 5, 10, '2024-01-05', '2024-01-10', 929.95, 899.95, 35.00, 50.00, 15.00, 'Confirmed', 'Paid'); 