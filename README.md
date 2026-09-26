# StockSense

StockSense is a modern Inventory Management System designed to help businesses manage products, warehouses, stock levels, and inventory movements from a centralized platform.

It replaces manual registers, spreadsheets, and scattered inventory tracking with a structured and real-time inventory workflow.

## About

StockSense connects products, warehouses, locations, and inventory operations in one application.

Users can manage products, monitor stock availability, receive incoming inventory, process deliveries, transfer stock between locations, perform inventory adjustments, and track all inventory movements through a unified stock ledger.

The system also provides dashboard insights and stock alerts to help users monitor inventory levels efficiently.

## Key Features

- User authentication and session management
- Inventory dashboard with key stock metrics
- Product creation and management
- SKU and category-based product organization
- Reorder level management
- Warehouse and location management
- Stock availability by location
- Incoming stock receipts
- Delivery management with Pick, Pack and Validate workflow
- Internal stock transfers
- Inventory adjustments
- Unified stock ledger
- Low-stock and out-of-stock alerts
- Search and dynamic filtering
- Real-time inventory updates
- Responsive desktop and mobile interface
- Input validation and inventory consistency checks

## Inventory Flow

```text
Products
   ↓
Warehouses & Locations
   ↓
Receipts / Deliveries / Transfers / Adjustments
   ↓
Inventory Updates
   ↓
Stock Ledger
   ↓
Dashboard & Alerts
Technology Stack
React
TypeScript
Vite
Tailwind CSS
Supabase
PostgreSQL
Supabase Authentication
Supabase Realtime
Lucide React
Getting Started
Prerequisites
Node.js
npm
Supabase project
Installation
git clone https://github.com/Varshini13-jm/Stock_Sense.git
cd Stock_Sense
npm install
Environment Variables

Create a .env.local file in the project root:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Do not commit .env.local or expose private Supabase credentials.

Run the Application
npm run dev
