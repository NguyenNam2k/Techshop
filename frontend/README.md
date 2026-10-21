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

The frontend will be available at http://localhost:5173

The frontend is configured to proxy API requests to http://localhost:3000/api, so make sure the backend is running on that port.

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
│   ├── assets/           # Static assets
│   ├── components/       # Reusable components
│   │   └── pdp/          # Product Detail Page components
│   │       ├── ProductGallery.jsx
│   │       ├── VariantSelector.jsx
│   │       ├── ProductSpecsTable.jsx
│   │       └── AddToCartSection.jsx
│   ├── pages/            # Page components
│   │   └── ProductDetailPage.jsx
│   ├── services/         # Service layers (API clients)
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind imports
├── public/               # Static files served directly
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── package.json          # Dependencies and scripts
```

## Design System

### Colors (Cyberpunk Dark Theme)
- Background: Slate-900 (#0f172a)
- Accent: Cyber-cyan (#06b6d4)
- Accent: Neon-violet (#8b5cf6)
- Text: Slate-200 (#e2e8f0) to Slate-500 (#64748b)

### Typography
- Headings: Plus Jakarta Sans (default)
- Body/Mono: JetBrains Mono (for technical specs)

## Components

### ProductGallery
- High-resolution image viewport with zoom hover effect
- Horizontal thumbnail carousel with angle badges
- Smooth transitions between images

### VariantSelector
- Color swatch chips with color codes
- Technical specification version buttons
- Real-time variant information display

### ProductSpecsTable
- Clean 2-column key-value table
- Grouped specification sections
- Monospace font for technical accuracy

### AddToCartSection
- Numeric quantity counter (1-stock limit)
- Add to Cart and Buy Now buttons
- Live stock status indicators
- Disabled states for out-of-stock items

## API Integration

The frontend communicates with the backend API at `/api/products/:identifier` where identifier can be either a product ID (integer) or slug (string).

Example endpoints:
- GET `/api/products/1` - Get product by ID
- GET `/api/products/mechanical-keyboard-rgb` - Get product by slug

## Environment Variables

- `VITE_API_URL`: Base URL for API requests (defaults to http://localhost:3000/api)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile and desktop