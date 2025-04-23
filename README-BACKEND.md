# Hotel Booking System - Backend

This is the backend for the Online Hotel Booking System. It provides API endpoints for searching hotels, viewing hotel details, and managing bookings.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Configure the database connection in `.env` file:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=hotel_booking
   ```

3. Set up the database with sample data:
   ```
   node db_setup.js
   ```

4. Start the server:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Search Hotels

- **URL**: `/api/hotels/search`
- **Method**: `GET`
- **Query Parameters**:
  - `location` (required): Location to search for hotels
  - `rooms` (optional): Number of rooms needed
  - `checkIn` (required): Check-in date in format YYYY/MM/DD
  - `checkOut` (required): Check-out date in format YYYY/MM/DD
  - `sortBy` (optional): Field to sort results by. Options: `price`, `rating`
  - `sortOrder` (optional): Order to sort results. Options: `asc`, `desc`, `high-to-low`, `low-to-high`
- **Success Response**:
  ```json
  {
    "success": true,
    "results": {
      "hotels": [
        {
          "id": 1,
          "name": "Grand Hotel Luxe",
          "star_rating": 5,
          "location": "London, UK",
          "address": "123 Luxury Street, London, UK",
          "description": "Experience unparalleled luxury...",
          "min_price": 199.99,
          "starting_price": 199.99,
          "main_image": "hotel1.jpg",
          "available_room_types": 3,
          "nights": 6,
          "price_per_night": 199.99,
          "total_price": 1199.94,
          "formatted_total_price": "$1199.94"
        },
        // more hotels...
      ],
      "search_info": {
        "location": "London",
        "check_in": "2023/10/12",
        "check_out": "2023/10/18",
        "rooms": "2 Rooms",
        "total_results": 3,
        "sort": {
          "by": "rating",
          "order": "desc"
        }
      }
    }
  }
  ```

### Get Hotel Details

- **URL**: `/api/hotels/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Hotel ID
- **Query Parameters**:
  - `checkIn` (optional): Check-in date in format YYYY/MM/DD
  - `checkOut` (optional): Check-out date in format YYYY/MM/DD
- **Success Response**:
  ```json
  {
    "success": true,
    "hotel": {
      "id": 1,
      "name": "Grand Hotel Luxe",
      "star_rating": 5,
      "location": "London, UK",
      "address": "123 Luxury Street, London, UK",
      "description": "Experience unparalleled luxury...",
      "min_price": 199.99,
      "min_price_per_night": 199.99,
      "formatted_min_price": "$199.99",
      "total_min_price": 599.97,
      "formatted_total_min_price": "$599.97",
      "nights": 3,
      "main_image": "hotel1.jpg",
      "rating_info": {
        "reviews_count": 24,
        "avg_rating": 4.8
      },
      "images": [
        {
          "id": 1,
          "hotel_id": 1,
          "image_path": "hotel1.jpg",
          "is_main": 1
        },
        // more images...
      ],
      "room_types": [
        {
          "id": 1,
          "hotel_id": 1,
          "name": "Standard Room",
          "price": 199.99,
          "formatted_price": "$199.99",
          "formatted_total_price": "$599.97",
          "description": "Comfortable room with essential amenities...",
          "capacity": "1-2 Guests",
          "amenities": "Free Wi-Fi, TV, Air Conditioning",
          "amenities_list": ["Free Wi-Fi", "TV", "Air Conditioning"],
          "available_rooms": 10,
          "image_path": "hotel.jpg"
        },
        // more room types...
      ]
    }
  }
  ```

### Get Room Type Details

- **URL**: `/api/room-types/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Room Type ID
- **Query Parameters**:
  - `checkIn` (optional): Check-in date in format YYYY/MM/DD
  - `checkOut` (optional): Check-out date in format YYYY/MM/DD
- **Success Response**:
  ```json
  {
    "success": true,
    "room_type": {
      "id": 1,
      "hotel_id": 1,
      "hotel_name": "Grand Hotel Luxe",
      "hotel_address": "123 Luxury Street, London, UK",
      "hotel_rating": 5,
      "name": "Standard Room",
      "price": 199.99,
      "formatted_price": "$199.99",
      "formatted_total_price": "$599.97",
      "nights": 3,
      "total_price": 599.97,
      "description": "Comfortable room with essential amenities...",
      "capacity": "1-2 Guests",
      "amenities": "Free Wi-Fi, TV, Air Conditioning",
      "amenities_list": ["Free Wi-Fi", "TV", "Air Conditioning"],
      "available_rooms": 10,
      "image_path": "hotel.jpg"
    }
  }
  ```

### Get Booking Details (Pre-booking)

- **URL**: `/api/booking/details`
- **Method**: `GET`
- **Query Parameters**:
  - `roomTypeId` (required): Room Type ID
  - `checkIn` (required): Check-in date in format YYYY/MM/DD
  - `checkOut` (required): Check-out date in format YYYY/MM/DD
- **Success Response**:
  ```json
  {
    "success": true,
    "booking_details": {
      "room_type_id": 1,
      "hotel_id": 1,
      "hotel_name": "Grand Hotel Luxe",
      "hotel_location": "London, UK",
      "room_type_name": "Standard Room",
      "capacity": "1-2 Guests",
      "check_in": "2023/10/12",
      "check_out": "2023/10/15",
      "nights": 3,
      "price_details": {
        "base_fare": 599.97,
        "formatted_base_fare": "$599.97",
        "discount_percent": 5,
        "discount": 30.00,
        "formatted_discount": "$30.00",
        "tax_percent": 12,
        "taxes": 68.40,
        "formatted_taxes": "$68.40",
        "service_fee_percent": 2,
        "service_fee": 11.40,
        "formatted_service_fee": "$11.40",
        "total_amount": 649.77,
        "formatted_total_amount": "$649.77"
      }
    }
  }
  ```

### Create Booking

- **URL**: `/api/bookings`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_code": "+1",
    "phone": "1234567890",
    "room_type_id": 1,
    "check_in": "2023/10/12",
    "check_out": "2023/10/15",
    "base_fare": 599.97,
    "discount": 30.00,
    "taxes": 68.40,
    "service_fee": 11.40,
    "total_amount": 649.77
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "booking": {
      "id": 123,
      "booking_id": "BK-20231012-1234",
      "hotel_name": "Grand Hotel Luxe",
      "hotel_address": "123 Luxury Street, London, UK",
      "room_type": "Standard Room",
      "check_in": "2023/10/12",
      "check_out": "2023/10/15",
      "guest_name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1 1234567890",
      "amount": 649.77,
      "status": "Confirmed"
    }
  }
  ```

### Get Booking Details

- **URL**: `/api/bookings/:bookingId`
- **Method**: `GET`
- **URL Parameters**:
  - `bookingId`: Booking ID (e.g., BK-20231012-1234)
- **Success Response**:
  ```json
  {
    "success": true,
    "booking": {
      "id": 123,
      "booking_id": "BK-20231012-1234",
      "user_id": 456,
      "room_type_id": 1,
      "check_in_date": "2023-10-12",
      "check_out_date": "2023-10-15",
      "amount": 649.77,
      "base_fare": 599.97,
      "discount": 30.00,
      "taxes": 68.40,
      "service_fee": 11.40,
      "status": "Confirmed",
      "payment_status": "Paid",
      "created_at": "2023-10-01T12:34:56Z",
      "updated_at": "2023-10-01T12:34:56Z",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone_code": "+1",
      "phone": "1234567890",
      "room_type_name": "Standard Room",
      "capacity": "1-2 Guests",
      "hotel_name": "Grand Hotel Luxe",
      "hotel_address": "123 Luxury Street, London, UK",
      "hotel_location": "London, UK",
      "nights": 3,
      "formatted_check_in": "October 12, 2023",
      "formatted_check_out": "October 15, 2023",
      "formatted_amount": "$649.77",
      "formatted_base_fare": "$599.97",
      "formatted_discount": "$30.00",
      "formatted_taxes": "$68.40",
      "formatted_service_fee": "$11.40",
      "guest_name": "John Doe"
    }
  }
  ```

### Cancel Booking

- **URL**: `/api/bookings/:bookingId/cancel`
- **Method**: `POST`
- **URL Parameters**:
  - `bookingId`: Booking ID (e.g., BK-20231012-1234)
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Booking cancelled successfully",
    "refund": {
      "amount": 649.77,
      "formatted_amount": "$649.77",
      "estimated_days": "5-7 business days"
    }
  }
  ```

### Get Phone Country Codes

- **URL**: `/api/phone-codes`
- **Method**: `GET`
- **Success Response**:
  ```json
  {
    "success": true,
    "phone_codes": [
      { "code": "+1", "country": "United States/Canada" },
      { "code": "+44", "country": "United Kingdom" },
      { "code": "+86", "country": "China" },
      // more phone codes...
    ]
  }
  ```

## Feature Details

### Hotel Search and Filtering

The search functionality provides a robust way to find hotels matching specific criteria:

1. **Location Search**: Find hotels in specific locations
2. **Room Requirements**: Filter by required room capacity
3. **Date Availability**: Ensure hotels have available rooms for the specified dates
4. **Price Calculation**: Automatically calculate total price based on length of stay
5. **Result Count**: Display the total number of hotels matching the search criteria

### Sorting Options

Results can be sorted in different ways to help users find their preferred hotel:

1. **Price Sorting**: 
   - Low to High: Find the most affordable options first
   - High to Low: Find luxury options first

2. **Rating Sorting**:
   - High to Low: Find the highest rated hotels first
   - Low to High: Find hotels with lower ratings

The sorting is performed at the database level for optimal performance.

### Hotel Details Page

The hotel details API provides comprehensive information needed for the hotel details page:

1. **Basic Hotel Information**: Name, rating, location, address, and description
2. **Price Information**: 
   - Minimum price per night
   - Calculated total price based on stay duration
   - Formatted prices for display
3. **Image Gallery**: All hotel images with main image identified
4. **Available Room Types**: 
   - Complete details for each available room type
   - Pricing information (per night and total)
   - Room features and amenities
   - Availability status

### Room Details

The room type details API provides specific information about a selected room:

1. **Room Information**: Name, capacity, description, and amenities
2. **Hotel Context**: Information about the hotel the room belongs to
3. **Pricing**: 
   - Per night pricing
   - Total pricing based on stay duration
   - Formatted prices for display
4. **Availability**: Number of available rooms of this type

### Booking Management

The booking management features enable users to view, create and manage their bookings:

1. **Booking Creation**:
   - User information collection (name, email, phone)
   - Price calculation with breakdown (base fare, discount, taxes, service fee)
   - Automatic room availability management
   - Unique booking reference generation

2. **Booking Details**:
   - Complete booking information retrieval
   - Formatted dates and prices for display
   - Guest and hotel information

3. **Booking Cancellation**:
   - Ability to cancel a confirmed booking
   - Automatic room availability adjustment
   - Refund processing information
   - Status tracking of cancelled bookings

4. **Order Details Page Support**:
   - Provides all necessary data for the order details page
   - Supports booking sharing via URL
   - Enables PDF generation of booking details

### Merchant Order Management

The merchant order management features enable hotel owners and managers to oversee and manage all bookings for their properties:

1. **Booking List Management**:
   - View all bookings with filtering capabilities
   - Filter by booking status (Confirmed, Pending, Completed, Cancelled)
   - Filter by date range (Today, This Week, This Month, All)
   - Search by booking ID or guest name
   - Summary counts of bookings by status

2. **Booking Details**:
   - Comprehensive view of individual booking information
   - Complete guest details and contact information
   - Room, pricing, and stay information
   - Payment status tracking

3. **Data Export Capabilities**:
   - Export bookings to CSV format for record-keeping or analysis
   - Generate PDF reports with booking summaries and lists
   - Download individual booking details as PDF

4. **Reporting Functionality**:
   - View booking statistics and summaries
   - Track booking statuses across the property
   - Generate date-specific reports

## API Endpoints

### Merchant Order Management Endpoints

#### Get Merchant Bookings

- **URL**: `/api/merchant/bookings`
- **Method**: `GET`
- **Query Parameters**:
  - `hotelId` (optional): Hotel ID (defaults to 1)
  - `status` (optional): Filter by status (Confirmed, Pending, Completed, Cancelled, or 'all')
  - `dateRange` (optional): Filter by date range ('today', 'week', 'month', or 'all')
  - `search` (optional): Search term for booking ID or guest name
- **Success Response**:
  ```json
  {
    "success": true,
    "bookings": [
      {
        "id": 123,
        "booking_id": "BK-20231012-1234",
        "guest_name": "John Doe",
        "check_in_date": "Oct 12, 2023",
        "check_out_date": "Oct 15, 2023",
        "room_type": "Standard Room",
        "amount": 649.77,
        "formatted_amount": "$649.77",
        "status": "Confirmed",
        "payment_status": "Paid",
        "created_at": "2023-10-01T12:34:56Z"
      },
      // more bookings...
    ],
    "summary": {
      "total": 45,
      "confirmed": 25,
      "pending": 5,
      "completed": 10,
      "cancelled": 5
    },
    "filters": {
      "status": "all",
      "dateRange": "all",
      "search": ""
    }
  }
  ```

#### Get Merchant Booking Details

- **URL**: `/api/merchant/bookings/:bookingId`
- **Method**: `GET`
- **URL Parameters**:
  - `bookingId`: Booking ID (e.g., BK-20231012-1234)
- **Success Response**:
  ```json
  {
    "success": true,
    "booking": {
      "id": 123,
      "booking_id": "BK-20231012-1234",
      "guest_name": "John Doe",
      "email": "john.doe@example.com",
      "phone_code": "+1",
      "phone": "1234567890",
      "room_type_name": "Standard Room",
      "capacity": "1-2 Guests",
      "hotel_name": "Grand Hotel Luxe",
      "hotel_address": "123 Luxury Street, London, UK",
      "check_in_date": "October 12, 2023",
      "check_out_date": "October 15, 2023",
      "nights": 3,
      "amount": 649.77,
      "formatted_amount": "$649.77",
      "base_fare": 599.97,
      "formatted_base_fare": "$599.97", 
      "discount": 30.00,
      "formatted_discount": "$30.00",
      "taxes": 68.40,
      "formatted_taxes": "$68.40",
      "service_fee": 11.40,
      "formatted_service_fee": "$11.40",
      "status": "Confirmed",
      "payment_status": "Paid"
    }
  }
  ```

#### Export Bookings as CSV

- **URL**: `/api/merchant/bookings/export/csv`
- **Method**: `GET`
- **Query Parameters**:
  - `hotelId` (optional): Hotel ID (defaults to 1)
  - `status` (optional): Filter by status (Confirmed, Pending, Completed, Cancelled, or 'all')
  - `dateRange` (optional): Filter by date range ('today', 'week', 'month', or 'all')
  - `search` (optional): Search term for booking ID or guest name
- **Success Response**: CSV file download with booking data

#### Get Booking Report Data for PDF

- **URL**: `/api/merchant/bookings/report/pdf`
- **Method**: `GET`
- **Query Parameters**:
  - `hotelId` (optional): Hotel ID (defaults to 1)
  - `status` (optional): Filter by status (Confirmed, Pending, Completed, Cancelled, or 'all')
  - `dateRange` (optional): Filter by date range ('today', 'week', 'month', or 'all')
  - `search` (optional): Search term for booking ID or guest name
- **Success Response**:
  ```json
  {
    "success": true,
    "report": {
      "hotel": {
        "name": "Grand Hotel Luxe",
        "address": "123 Luxury Street, London, UK"
      },
      "summary": {
        "total": 45,
        "confirmed": 25,
        "pending": 5,
        "completed": 10,
        "cancelled": 5
      },
      "bookings": [
        {
          "booking_id": "BK-20231012-1234",
          "guest_name": "John Doe",
          "check_in_date": "Oct 12, 2023",
          "check_out_date": "Oct 15, 2023",
          "room_type": "Standard Room",
          "amount": "$649.77",
          "status": "Confirmed",
          "payment_status": "Paid"
        },
        // more bookings (limited to 100)...
      ],
      "filters": {
        "status": "all",
        "dateRange": "all",
        "search": ""
      },
      "reportDate": "October 20, 2023, 01:30 PM"
    }
  }
  ```

#### Get Booking PDF Data

- **URL**: `/api/merchant/bookings/:bookingId/pdf`
- **Method**: `GET`
- **URL Parameters**:
  - `bookingId`: Booking ID (e.g., BK-20231012-1234)
- **Success Response**:
  ```json
  {
    "success": true,
    "booking_data": {
      "id": 123,
      "booking_id": "BK-20231012-1234",
      "hotel_name": "Grand Hotel Luxe",
      "hotel_address": "123 Luxury Street, London, UK",
      "guest_name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1 1234567890",
      "room_type": "Standard Room",
      "capacity": "1-2 Guests",
      "check_in_date": "October 12, 2023",
      "check_out_date": "October 15, 2023",
      "nights": 3,
      "amount": "$649.77",
      "base_fare": "$599.97",
      "discount": "$30.00",
      "taxes": "$68.40",
      "service_fee": "$11.40",
      "status": "Confirmed",
      "payment_status": "Paid",
      "created_at": "October 1, 2023"
    }
  }
  ```

## Database Schema

The database schema is defined in `database.sql` and includes the following tables:

- `hotels`: Information about hotels
- `hotel_images`: Images for hotels
- `room_types`: Types of rooms available in hotels
- `users`: User account information
- `bookings`: Booking information

## Adding More Features

To expand this backend, consider implementing:

1. User authentication and authorization
2. Payment processing integration
3. Review and rating system
4. Admin panel for hotel management
5. Advanced filtering (amenities, hotel features, etc.)
6. Pagination for search results
7. Email notifications for booking confirmations and cancellations
8. Loyalty program or rewards system

## Error Handling

The API returns appropriate error messages with HTTP status codes:

- 400: Bad Request (missing or invalid parameters)
- 404: Not Found (resource not found)
- 500: Server Error (internal error)

## Security Considerations

For production deployment:

1. Implement proper authentication and authorization
2. Use HTTPS for all communication
3. Add rate limiting to prevent abuse
4. Validate and sanitize all user inputs
5. Use environment variables for sensitive information 