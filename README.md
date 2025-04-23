# Online Hotel Booking System

A responsive web interface for an online hotel booking system.

## Setup Instructions

1. Clone this repository to your local machine
2. Add the following image files to the root directory:
   - `building.jpg` - Main building image for the homepage
   - `hotel1.jpg`, `hotel2.jpg`, `hotel3.jpg`, `hotel4.jpg` - Hotel images for search results
   - `hotel.jpg` - Main hotel image for the hotel details page
3. Open `index.html` in your web browser

## Pages

### Customer Interfaces

#### Page 1: Home / Search Page (`index.html`)
- Main landing page with search functionality
- Allows users to input location, check-in/out dates, and number of rooms
- Beautiful responsive design with a modern UI

#### Page 2: Results Page (`results.html`)
- Displays search results of hotels matching the criteria
- Shows 5 hotels per page with images, details, prices, and ratings
- Includes sorting options for price and rating
- Provides pagination to navigate through multiple pages of results
- Responsive design that adapts to various screen sizes

#### Page 3: Hotel Details Page (`hotel-details.html`)
- Detailed view of a specific hotel with comprehensive information
- Features a photo gallery with multiple hotel images
- Displays hotel overview and description
- Lists available room types with pricing
- Allows users to select and book specific room types
- Responsive layout that adapts to different screen sizes

#### Page 4: Booking Page (`booking.html`)
- Final step in the booking process for confirming hotel reservations
- Displays selected room information and price
- Shows hotel details and check-in/check-out dates
- Provides forms for guest information and contact details
- Includes a price breakdown with base fare, taxes, and fees
- Features a prominent "Pay" button to complete the booking
- Responsive design that works on all device sizes

#### Page 5: Order Details Page (`orders.html`)
- Confirmation page showing the complete booking details
- Displays hotel information and total price
- Shows check-in and check-out dates
- Contains reservation details including guest name and room type
- Includes check-in/out times and room number information
- Provides the reservation order number and barcode
- Features action buttons for sharing, downloading, and cancellation
- Responsive design with adaptive layout for all screen sizes

### Merchant Interfaces

#### Page 6: Hotel Information Management (`merchant-hotel.html`)
- Interface for managing hotel details and room offerings
- Allows editing of basic hotel information (name, rating, location, description)
- Provides tools for managing hotel images (uploading, organizing, removing)
- Features a section for managing room types, their details, and availability
- Includes comprehensive room type management:
  - Adding new room types with name, price, description, capacity, and amenities
  - Editing existing room types with real-time updates
  - Deleting room types no longer offered
- Includes inventory control for updating room availability
- Responsive design that maintains usability across device sizes

#### Page 7: Bookings Management (`merchant-bookings.html`)
- Comprehensive bookings management interface
- Displays booking metrics and summaries by status (confirmed, pending, completed, cancelled)
- Includes filtering options by status, date range, and search terms
- Features a detailed bookings table with comprehensive information
- Provides actions for viewing booking details and downloading booking information
- Includes pagination for navigating through multiple bookings
- Export and print functionality for record-keeping
- Fully responsive design with thoughtful mobile adaptations

## Features

- Responsive design that adapts to different screen sizes
- Interactive form elements for selecting location, rooms, and dates
- Dynamic date pickers for check-in and check-out dates
- Search functionality to find hotel options
- Hotel cards with detailed information (rating, distance, price)
- Sorting functionality by price and rating
- Pagination system
- Photo gallery with grid layout
- Room selection and booking capability
- Data persistence between pages using sessionStorage
- Modern UI with elegant styling
- Merchant interfaces for hotel management:
  - Room type management (add/edit/delete)
  - Inventory control
  - Booking management
- Export and print functionality
- Clean and intuitive user experience for both customers and merchants

## Technology Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- CSS Grid and Flexbox for layouts
- Font Awesome icons
- Google Fonts (Inria Sans and Inter)
- SessionStorage for data persistence

## System Flow

1. User inputs search criteria on the home page
2. Upon clicking search, the data is stored and user is redirected to the results page
3. Results page displays matching hotels with sorting capabilities
4. User can click on "View Details" to see more information about a specific hotel
5. Hotel details page shows comprehensive information about the selected hotel
6. User can select a room type and click "Book Now" to proceed to booking
7. Booking page allows users to review their selection, enter personal information, and complete payment
8. Upon successful payment, user is redirected to the order details page
9. Order details page displays the complete reservation information and provides management options

### Merchant Flow
1. Hotel owner/manager logs in to the system
2. Hotel information can be updated through the hotel management interface
3. Room types can be added, edited, or deleted through intuitive modal forms
4. Room inventory can be managed through the same interface
5. Bookings can be viewed, filtered, and managed through the bookings interface
6. Reports can be exported for business analysis and record-keeping

## Future Enhancements

- Login page implementation
- Booking confirmation page
- Filtering options for search results
- User account management
- Payment integration
- Reviews and ratings system
- Map integration for hotel locations
- Mobile application

## License

This project is for demonstration purposes only. 