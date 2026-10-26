# TechGear Frontend

This is the frontend for the TechGear PC Hardware Store project, built with React, Vite, and Tailwind CSS.

## Features

- Product Detail Page (PDP) with:
  - Interactive image gallery with zoom hover effect
  - Variant selector for colors and specifications
  - Dynamic price and stock updates
  - Technical specifications table
  - Add to cart and buy now functionality
  - Loading skeletons and error handling
  - Responsive design with cyberpunk dark aesthetic

## Getting Started

### Prerequisites

- Node.js v18.0.0 or higher
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000 (required for Google OAuth authorized JavaScript origins).

The frontend dev server is configured to proxy API requests to http://127.0.0.1:5000/api, so make sure the backend is running on port 5000.

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── catalog/
│   │   ├── common/
│   │   ├── manager/
│   │   ├── pc-build/
│   │   └── product-detail/
│   │       ├── ColorSelector.jsx
│   │       ├── ImageGallery.jsx
│   │       ├── PriceCard.jsx
│   │       ├── QuantitySelector.jsx
│   │       ├── SpecTable.jsx
│   │       └── StockBadge.jsx
│   ├── context/
│   ├── data/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## State Management

- `selectedColor`: Currently selected color variant
- `selectedSpecs`: Currently selected technical specifications
- `quantity`: Quantity to purchase
- `product`: Product data fetched from API
- `loading`: Loading state for API requests
- `error`: Error state for API requests

## Form Validation

- Quantity bounds checking (minimum 1, maximum available stock)
- Required specification selection before adding to cart
- Disabled states for out-of-stock items

## API Integration

The frontend communicates with the backend API at `/api/products/:identifier` where identifier can be either a product ID (integer) or slug (string).

Example endpoints:
- GET `/api/products/1` - Get product by ID
- GET `/api/products/mechanical-keyboard-rgb` - Get product by slug

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for API requests (leave blank for local Vite proxy forwarding to http://127.0.0.1:5000)
- `VITE_DEV_API_TARGET`: Local proxy target (defaults to http://127.0.0.1:5000)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile and desktop
