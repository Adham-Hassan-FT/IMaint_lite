# IMaint Lite - Maintenance Management System (C014)

## Overview

IMaint Lite is a comprehensive maintenance management system designed to streamline equipment tracking, work order management, and preventive maintenance workflows. This mobile-first application provides robust features for inventory management, asset tracking, preventive maintenance scheduling, and work order processing.

![IMaint Lite Dashboard](./attached_assets/imaint-lite-screenshot.png)

## Additional Documentation

This project includes several in-depth documentation files:

- **[PROJECT_DOCUMENT_C014.md](./PROJECT_DOCUMENT_C014.md)** - Overview of the problem addressed, solution architecture, and implementation impact
- **[FEATURES_AND_ACHIEVEMENTS_C014.md](./FEATURES_AND_ACHIEVEMENTS_C014.md)** - Detailed description of implemented features and technical achievements
- **[TECHNICAL_GUIDE_C014.md](./TECHNICAL_GUIDE_C014.md)** - Technical documentation for setup, deployment, and development 
- **[POTENTIAL_IMPROVEMENTS_C014.md](./POTENTIAL_IMPROVEMENTS_C014.md)** - Future enhancement roadmap including entity deletion, pagination, and code organization

Please refer to these documents for a comprehensive understanding of the project's scope, implementation details, and future directions.

## Features

### Core Functionality

- **Work Order Management**
  - Complete work order lifecycle management
  - Create, assign, schedule, track, and close work orders
  - Labor and parts tracking with cost calculations
  - Priority-based scheduling and assignment
  - Status tracking with filtering capabilities

- **Asset Management**
  - Comprehensive asset registry with detailed information
  - Asset categorization and type classification
  - Maintenance history tracking
  - QR code/barcode integration for quick access

- **Inventory Control**
  - Track parts and supplies with stock levels
  - Reorder point notifications
  - Part categorization
  - Cost tracking and usage history
  - Integration with work orders

- **Preventive Maintenance**
  - Schedule recurring maintenance tasks
  - Automated work order generation
  - Calendar-based visualization
  - Status tracking (upcoming, due, overdue)
  - Frequency configuration options

- **Mobile-First Design**
  - Responsive interface optimized for all device sizes
  - Touch-friendly controls
  - Accessible design patterns
  - Progressive web app capabilities

### Additional Features

- **User Management**
  - Role-based access control (Admin, Manager, Technician, Requester, Viewer)
  - Profile management
  - Activity tracking

- **Work Requests**
  - Request submission system
  - Approval workflow
  - Conversion to work orders

- **Reporting**
  - Equipment downtime analysis
  - Maintenance cost reporting
  - Inventory usage trends
  - Work order completion metrics

## Technical Architecture

IMaint Lite is built using a modern technology stack:

- **Frontend**:
  - React with TypeScript
  - TailwindCSS for styling
  - shadcn/ui component library
  - React Query for data fetching
  - React Hook Form for form handling
  - Wouter for routing

- **Backend**:
  - Node.js with Express
  - TypeScript for type safety
  - RESTful API architecture

- **Database**:
  - PostgreSQL relational database
  - Drizzle ORM for database interactions

- **Authentication**:
  - Session-based authentication with Passport.js
  - Role-based access control

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd imaint-lite
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/imaint
   PORT=5000
   NODE_ENV=development
   ```

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

### Default Login Credentials

- **Admin User**:
  - Username: admin
  - Password: admin123

- **Technician**:
  - Username: tech1
  - Password: tech123

## Usage Guide

### Work Order Management

1. Navigate to the "Work Orders" section from the sidebar
2. Click "Create Work Order" to add a new work order
3. Fill in the required details including title, description, priority, and type
4. Assign to a technician if needed
5. Add labor entries and parts as work progresses
6. Update status as the work order moves through its lifecycle

### Asset Management

1. Navigate to the "Assets" section from the sidebar
2. Browse the list of assets or search by asset number
3. Click on an asset to view its details
4. Use the "Add Asset" button to register new equipment
5. View maintenance history and assigned work orders

### Inventory Management

1. Navigate to the "Inventory" section from the sidebar
2. Browse items by category or search by part number
3. Click on an item to view details including stock levels
4. Use the "Add Item" button to register new inventory items
5. Track usage through work order part assignments

### Preventive Maintenance

1. Navigate to the "Maintenance" section from the sidebar
2. View the maintenance calendar or list
3. Click "Schedule Maintenance" to create new maintenance tasks
4. Configure frequency, asset assignments, and other details
5. Generate work orders from maintenance schedules

## Development Notes

### Project Structure

- `/client` - Frontend React application
  - `/src/components` - UI components
  - `/src/pages` - Page components
  - `/src/hooks` - Custom React hooks
  - `/src/lib` - Utility functions

- `/server` - Backend Express application
  - `/routes.ts` - API routes
  - `/storage.ts` - Data storage implementation
  - `/index.ts` - Main entry point

- `/shared` - Shared code between client and server
  - `/schema.ts` - Database schema and types

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run db:push` - Push schema changes to database

## Troubleshooting

### Common Issues

- **Database Connection Issues**: Verify your PostgreSQL credentials and ensure the database is running.
- **Missing Dependencies**: Run `npm install` to ensure all dependencies are installed.
- **Port Conflicts**: If port 5000 is in use, update the PORT value in your .env file.

## License

[MIT License](LICENSE)

## Acknowledgements

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons from [Lucide](https://lucide.dev/)
- Date handling with [date-fns](https://date-fns.org/)