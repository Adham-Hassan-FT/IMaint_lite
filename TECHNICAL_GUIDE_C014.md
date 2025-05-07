# IMaint Lite Technical Guide (C014)

This document provides detailed technical information for running, developing, and deploying the IMaint Lite maintenance management system.

## System Requirements

### Development Environment

- Node.js v16 or later
- npm v7 or later
- PostgreSQL 12 or later
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Production Environment

- Any Node.js hosting platform (AWS, Azure, DigitalOcean, Heroku, etc.)
- PostgreSQL database
- Domain name (optional)
- SSL certificate (recommended)

## Installation Instructions

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd imaint-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/imaint
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=yoursessionsecrethere
   ```

4. **Initialize the database**
   First, ensure PostgreSQL is running and you have created a database named 'imaint'
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up environment variables in your production environment**
   ```
   DATABASE_URL=postgresql://username:password@host:port/imaint
   PORT=5000
   NODE_ENV=production
   SESSION_SECRET=yoursecureproductionsecret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## Database Schema

The application uses a relational database with the following main entities:

- **Users**: System users with role-based permissions
- **Assets**: Maintainable equipment and facilities 
- **AssetTypes**: Categories for assets
- **InventoryItems**: Parts and supplies used in maintenance
- **InventoryCategories**: Categories for inventory items
- **WorkOrders**: Tasks assigned to maintenance personnel
- **WorkOrderTypes**: Categories for work orders
- **WorkOrderLabor**: Labor hours recorded against work orders
- **WorkOrderParts**: Parts used in work orders
- **WorkRequests**: Maintenance requests that can be converted to work orders
- **PreventiveMaintenance**: Scheduled recurring maintenance tasks
- **PmTechnicians**: Technicians assigned to preventive maintenance
- **PmWorkOrders**: Work orders generated from preventive maintenance
- **Notifications**: System notifications for users

## Application Structure

### Frontend

The frontend is a React application with the following structure:

- `/client/src/components`: Reusable UI components
  - `/ui`: Basic UI components from shadcn/ui
  - `/layout`: Layout components (Header, Sidebar, etc.)
  - `/workorder`: Work order related components
  - `/asset`: Asset related components
  - `/inventory`: Inventory related components
  - `/maintenance`: Preventive maintenance components
  - `/report`: Reporting components

- `/client/src/pages`: Page components for each main section
  - `Dashboard.tsx`: Main dashboard view
  - `WorkOrders.tsx`: Work order management
  - `Assets.tsx`: Asset management
  - `Inventory.tsx`: Inventory management
  - `Maintenance.tsx`: Preventive maintenance
  - `Reports.tsx`: Reporting and analytics
  - `Login.tsx`: Authentication

- `/client/src/hooks`: Custom React hooks
  - `use-toast.ts`: Toast notification hook
  - `use-notifications.ts`: System notifications hook

- `/client/src/lib`: Utility functions
  - `queryClient.ts`: React Query configuration
  - `utils.ts`: Shared utility functions

### Backend

The backend is a Node.js Express application with the following structure:

- `/server/index.ts`: Main entry point
- `/server/routes.ts`: API route definitions
- `/server/storage.ts`: Data storage implementation
- `/server/vite.ts`: Vite development server configuration

### Shared Code

- `/shared/schema.ts`: Database schema definitions shared between client and server

## API Endpoints

The application exposes the following main API endpoints:

### Authentication
- `POST /api/auth/login`: Login with username and password
- `POST /api/auth/logout`: Log out current user
- `GET /api/auth/me`: Get current user information

### Users
- `GET /api/users`: List all users
- `GET /api/users/:id`: Get user by ID
- `POST /api/users`: Create new user
- `PUT /api/users/:id`: Update user

### Assets
- `GET /api/assets`: List all assets
- `GET /api/assets/details`: List assets with related details
- `GET /api/assets/:id`: Get asset by ID
- `GET /api/assets/details/:id`: Get asset with details by ID
- `POST /api/assets`: Create new asset
- `PUT /api/assets/:id`: Update asset

### Asset Types
- `GET /api/asset-types`: List all asset types
- `POST /api/asset-types`: Create new asset type

### Inventory
- `GET /api/inventory-items`: List all inventory items
- `GET /api/inventory-items/details`: List inventory items with details
- `GET /api/inventory-items/:id`: Get inventory item by ID
- `GET /api/inventory-items/details/:id`: Get inventory item with details by ID
- `POST /api/inventory-items`: Create new inventory item
- `PUT /api/inventory-items/:id`: Update inventory item

### Inventory Categories
- `GET /api/inventory-categories`: List all inventory categories
- `POST /api/inventory-categories`: Create new inventory category

### Work Orders
- `GET /api/work-orders`: List all work orders
- `GET /api/work-orders/details`: List work orders with details
- `GET /api/work-orders/:id`: Get work order by ID
- `GET /api/work-orders/details/:id`: Get work order with details by ID
- `POST /api/work-orders`: Create new work order
- `PUT /api/work-orders/:id`: Update work order
- `POST /api/work-orders/:id/labor`: Add labor to work order
- `POST /api/work-orders/:id/parts`: Add parts to work order

### Work Order Types
- `GET /api/work-order-types`: List all work order types
- `POST /api/work-order-types`: Create new work order type

### Work Requests
- `GET /api/work-requests`: List all work requests
- `GET /api/work-requests/details`: List work requests with details
- `GET /api/work-requests/:id`: Get work request by ID
- `GET /api/work-requests/details/:id`: Get work request with details by ID
- `POST /api/work-requests`: Create new work request
- `PUT /api/work-requests/:id`: Update work request
- `POST /api/work-requests/:id/convert`: Convert work request to work order

### Preventive Maintenance
- `GET /api/preventive-maintenance`: List all preventive maintenance schedules
- `GET /api/preventive-maintenance/details`: List preventive maintenance with details
- `GET /api/preventive-maintenance/:id`: Get preventive maintenance by ID
- `GET /api/preventive-maintenance/details/:id`: Get preventive maintenance with details by ID
- `POST /api/preventive-maintenance`: Create new preventive maintenance schedule
- `PUT /api/preventive-maintenance/:id`: Update preventive maintenance schedule
- `POST /api/preventive-maintenance/:id/technicians`: Assign technicians to PM
- `DELETE /api/preventive-maintenance/:id/technicians/:techId`: Remove technician from PM
- `POST /api/preventive-maintenance/:id/generate-work-orders`: Generate work orders from PM

### Notifications
- `GET /api/notifications`: Get notifications for current user
- `GET /api/notifications/unread-count`: Get count of unread notifications
- `POST /api/notifications/:id/read`: Mark notification as read
- `POST /api/notifications/:id/dismiss`: Dismiss notification
- `POST /api/notifications/read-all`: Mark all notifications as read

## Authentication and Authorization

The application uses session-based authentication with Passport.js. Users are assigned one of the following roles:

- **Admin**: Full system access
- **Manager**: Can manage work orders, assets, and users
- **Technician**: Can update work orders and record labor/parts
- **Requester**: Can create work requests and view their status
- **Viewer**: Read-only access to system data

## Development Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Run production build
- `npm run db:push`: Push schema changes to database
- `npm run db:studio`: Open Drizzle Studio for database management

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL is correct
   - Ensure database user has appropriate permissions

2. **Missing Dependencies**
   - Run `npm install` to ensure all dependencies are installed
   - Check for compatibility issues with Node.js version

3. **Port Conflicts**
   - If port 5000 is in use, update PORT in .env file
   - Check for other processes using the same port

4. **Authentication Issues**
   - Clear browser cookies and try logging in again
   - Check for SESSION_SECRET in environment variables

## Security Considerations

1. **Environment Variables**
   - Never commit .env files to version control
   - Use strong, unique SESSION_SECRET values

2. **Database Access**
   - Use limited-privilege database users
   - Implement connection pooling for production

3. **API Security**
   - All sensitive routes require authentication
   - Role-based authorization limits access to features

4. **Password Storage**
   - Passwords are hashed using bcrypt
   - Never store plaintext passwords

## Performance Optimization

1. **Database Queries**
   - Avoid N+1 query problems by using proper joins
   - Add indexes to frequently queried columns

2. **Frontend Performance**
   - Use React Query for efficient data fetching and caching
   - Implement pagination for large data sets

3. **Production Deployment**
   - Enable Node.js production mode
   - Implement proper caching strategies
   - Consider using a reverse proxy like Nginx

---

Document prepared by: C014  
Date: May 7, 2025