# Meilisearch React Geo App

A production-ready React application that demonstrates geospatial search capabilities using Meilisearch and interactive maps with Leaflet.js.

## 🌟 Features

- **Geospatial Search**: Search locations with distance-based sorting from Riyadh
- **Interactive Maps**: Leaflet.js powered maps with OpenStreetMap tiles
- **Real-time Filtering**: Dynamic search results with faceted filters
- **Distance Calculation**: Shows distance in kilometers from Riyadh for each result
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Map Interaction**: Click and drag to filter results by map bounds

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open Browser**
   Navigate to [http://localhost:5000](http://localhost:5000)

## 🛠 Technology Stack

- **Frontend**: React 19.1.0
- **Search**: Meilisearch with @meilisearch/instant-meilisearch
- **Maps**: Leaflet.js with react-leaflet
- **Styling**: Tailwind CSS (via CDN)
- **Search UI**: React InstantSearch components

## 🗺 Meilisearch Configuration

- **Host**: https://flipped.spicydonut.biz
- **Index**: ishraqa
- **Center Point**: Riyadh (24.7136, 46.6753)
- **Sorting**: Results sorted by proximity to Riyadh

## 📦 Available Scripts

- `npm start` - Start development server on port 5000
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (not recommended)

## 🌍 Map Features

- **Open Source**: Uses OpenStreetMap tiles (no API key required)
- **Interactive Markers**: Click markers to see location details
- **Bounds Filtering**: Move map to filter results by visible area
- **Distance Display**: Shows calculated distance from Riyadh center

## 🎨 UI Components

- Search box with instant results
- Filterable facets for categories and types
- Responsive card layout for search results
- Loading states and error handling
- Statistics display for search results

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop browsers
- Tablets
- Mobile devices

Built with Tailwind CSS utility classes for consistent styling and responsive behavior.
