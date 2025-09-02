import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import {
  InstantSearch,
  Configure,
  connectStateResults,
  connectHits,
  Highlight,
  connectSearchBox,
  RefinementList,
  RangeInput,
  SortBy,
  Stats,
  ClearRefinements,
  connectRefinementList,
  connectCurrentRefinements
} from 'react-instantsearch-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'instantsearch.css/themes/satellite.css';

// Add custom CSS for Arabic layout and mobile responsiveness
const arabicStyles = `
  * {
    font-family: 'Segoe UI', 'Cairo', 'Tajawal', 'Amiri', sans-serif;
  }
  
  .arabic-layout {
    direction: rtl;
    text-align: right;
    font-family: 'Segoe UI', 'Tahoma', 'Cairo', 'Tajawal', 'Amiri', 'Arial', sans-serif;
  }

  * {
    font-family: 'Segoe UI', 'Tahoma', 'Cairo', 'Tajawal', 'Amiri', 'Arial', sans-serif;
  }

  /* Enhanced RTL Support */
  .arabic-layout input,
  .arabic-layout textarea,
  .arabic-layout select {
    text-align: right;
    direction: rtl;
  }

  .arabic-layout .search-input {
    text-align: right;
    direction: rtl;
    padding: 16px 50px 16px 20px;
  }

  .arabic-layout .search-button {
    right: auto;
    left: 12px;
  }

  .rtl-input {
    direction: rtl;
    text-align: right;
  }

  .rtl-input::placeholder {
    text-align: right;
  }
  
  .custom-marker-icon {
    background: none !important;
    border: none !important;
  }
  
  .custom-marker-icon svg {
    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
  }
  
  .search-input {
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    font-size: 16px;
    color: #1f2937;
    transition: all 0.3s ease;
  }
  
  .search-input::placeholder {
    color: #9ca3af;
  }
  
  .search-input:focus {
    border-color: #3b82f6;
    background: white;
    color: #1f2937;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    outline: none;
  }
  
  .project-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
  }
  
  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.15);
  }

  /* Modern Property Card Styles */
  .modern-property-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #f0f0f0;
  }

  .modern-property-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .modern-property-card:hover .card-image {
    transform: scale(1.02);
    transition: transform 0.3s ease;
  }

  .modern-property-card:hover .property-title {
    color: #3b82f6;
    transition: color 0.2s ease;
  }

  .card-image-container {
    position: relative;
    width: 100%;
    height: 220px;
    background: #f8f9fa;
    overflow: hidden;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    background: #f3f4f6;
  }

  .placeholder-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }

  .favorite-icon {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }

  .favorite-icon:hover {
    color: #ef4444;
    background: white;
    transform: scale(1.1);
  }

  .favorite-icon.favorited {
    color: #ef4444;
    background: white;
  }

  .favorite-icon.favorited:hover {
    color: #dc2626;
  }

  .status-badge-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    backdrop-filter: blur(4px);
  }

  .card-content {
    padding: 16px;
  }

  .property-type {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
    font-weight: 500;
  }

  .property-price {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
    direction: rtl;
    text-align: right;
    font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
  }

  .property-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .property-location {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }

  .property-location::before {
    content: "📍";
    margin-left: 4px;
    margin-right: 0;
  }

  .property-details {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #6b7280;
  }

  .detail-icon {
    width: 14px;
    height: 14px;
    color: #9ca3af;
  }

  .developer-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
  }

  .developer-logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: cover;
  }

  .developer-name {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  .property-features {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .feature-tag {
    font-size: 10px;
    color: #4b5563;
    background: #f3f4f6;
    padding: 3px 8px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }
  
  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .status-construction {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fca5a5;
  }
  
  .status-soon {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fed7aa;
  }
  
  .status-sold {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #86efac;
  }
  
  .mobile-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  @media (min-width: 768px) {
    .mobile-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  @media (min-width: 1024px) {
    .mobile-grid {
      grid-template-columns: 300px 1fr;
    }
  }

  /* Properties Grid Layout */
  .properties-container {
    width: 100%;
  }

  .properties-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .results-count {
    font-weight: 600;
    color: #1f2937;
    font-size: 16px;
  }

  /* Responsive Grid Layout */
  @media (min-width: 640px) {
    .properties-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .properties-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 1280px) {
    .properties-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (min-width: 1536px) {
    .properties-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  
  .map-container {
    height: 400px;
  }
  
  @media (min-width: 768px) {
    .map-container {
      height: 500px;
    }
  }
  
  .ishraqa-header {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: white;
  }
  
  .results-container {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  @media (min-width: 768px) {
    .results-container {
      max-height: 70vh;
    }
  }

  .results-section {
    background: transparent;
  }

  /* Modern Header Styles */
  .modern-header {
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .header-title {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }

  .header-subtitle {
    color: #6b7280;
    font-size: 14px;
  }

  .language-toggle {
    padding: 6px 12px;
    background: #f3f4f6;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .language-toggle:hover {
    background: #e5e7eb;
  }

  .signup-btn {
    padding: 8px 16px;
    background: #000;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .signup-btn:hover {
    background: #1f2937;
  }

  .search-section {
    margin-top: 20px;
  }

  .search-title {
    font-size: 16px;
    color: #1f2937;
    text-align: center;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .filter-btn {
    padding: 10px 16px;
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
  }

  .filter-btn:hover {
    background: #e5e7eb;
  }

  .navigation-tabs {
    display: flex;
    gap: 8px;
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;
    padding: 16px 0;
  }

  .nav-tab {
    padding: 8px 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    color: #6b7280;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .nav-tab:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  .nav-tab.active {
    background: #1f2937;
    color: white;
    border-color: #1f2937;
  }

  /* Main Content Styles */
  .main-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px 24px;
    background: #f8f9fa;
    min-height: calc(100vh - 200px);
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    background: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .results-tabs {
    display: flex;
    gap: 8px;
  }

  .results-tab {
    padding: 8px 16px;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    color: #6b7280;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .results-tab.active {
    background: #1f2937;
    color: white;
  }

  .results-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stats-display {
    color: #4b5563;
  }

  .stats-text {
    font-size: 14px;
    font-weight: 500;
  }

  .sort-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sort-dropdown {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #4b5563;
    font-size: 13px;
    cursor: pointer;
  }

  .sort-dropdown:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .map-view {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  /* Filter Toggle Button */
  .filter-toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
  }

  .filter-toggle-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .filter-toggle-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .filter-icon {
    width: 20px;
    height: 20px;
  }

  /* Filter Panel Modal Styles */
  .filter-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
  }

  .filter-panel {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
    transition: right 0.3s ease;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    direction: rtl;
  }

  .filter-panel.visible {
    right: 0;
  }

  .filter-panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%);
    min-height: 80px;
  }

  .filter-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .clear-filters-button {
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .clear-filters-button:hover {
    background: #dc2626;
  }

  .filter-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  .filter-group {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f3f4f6;
  }

  .filter-group:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .filter-subtitle {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-subtitle::before {
    content: "▸";
    color: #6b7280;
    font-size: 14px;
  }

  /* Custom Refinement List Styles */
  .custom-refinement-list,
  .boolean-refinement-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .refinement-item-label,
  .boolean-refinement-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.2s ease;
    font-size: 14px;
  }

  .refinement-item-label:hover,
  .boolean-refinement-item:hover {
    background: #f9fafb;
  }

  .refinement-checkbox,
  .boolean-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .refinement-checkbox:checked,
  .boolean-checkbox:checked {
    background: #3b82f6;
    border-color: #3b82f6;
  }

  .refinement-text,
  .boolean-label {
    color: #374151;
    font-weight: 500;
    flex: 1;
    text-align: right;
  }

  .refinement-count,
  .boolean-count {
    background: #e5e7eb;
    color: #6b7280;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    min-width: 24px;
    text-align: center;
  }

  .show-more-button {
    background: none;
    border: 1px solid #d1d5db;
    color: #6b7280;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    margin-top: 12px;
    transition: all 0.2s ease;
    width: 100%;
  }

  .show-more-button:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .filter-panel-footer {
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .show-results-button {
    width: 100%;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .show-results-button:hover {
    background: #2563eb;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .filter-panel {
      width: 100vw;
      right: -100vw;
    }

    .filter-panel-header {
      padding: 16px 20px;
      min-height: 70px;
    }

    .filter-title {
      font-size: 18px;
    }

    .filter-panel-content {
      padding: 16px 20px;
    }

    .filter-group {
      margin-bottom: 24px;
      padding-bottom: 16px;
    }

    .filter-subtitle {
      font-size: 15px;
      margin-bottom: 12px;
    }

    .filter-panel-footer {
      padding: 16px 20px;
    }
  }
`;

// Inject Arabic styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = arabicStyles;
  document.head.appendChild(styleSheet);
}

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom marker icons based on status
const createCustomIcon = (status) => {
  let color = '#3b82f6';
  let iconSymbol = '🏠';
  
  if (status) {
    if (status.includes('قيد الإنشاء') || status.includes('Under Construction')) {
      color = '#dc2626';
      iconSymbol = '🏗️';
    } else if (status.includes('قريباً البيع') || status.includes('Selling Soon')) {
      color = '#d97706';
      iconSymbol = '🔜';
    } else if (status.includes('مباع بالكامل') || status.includes('SOLD OUT')) {
      color = '#16a34a';
      iconSymbol = '✅';
    } else if (status.includes('للبيع')) {
      color = '#059669';
      iconSymbol = '🏠';
    }
  }

  const svgIcon = `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2C9.383 2 4 7.383 4 14c0 8.5 12 22 12 22s12-13.5 12-22c0-6.617-5.383-12-12-12z" 
            fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <text x="16" y="18" text-anchor="middle" fill="white" font-size="10" font-family="Arial">${iconSymbol}</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
    className: 'custom-marker-icon'
  });
};

// Environment variables with fallbacks
const API_KEY = process.env.REACT_APP_API_KEY || 'def456abc789ghi012jkl345mno678pqr901stu234vwx567yza890bcd123efg456';
const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://flipped.spicydonut.biz';
const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true';

// Debug logging helper
const debugLog = (...args) => {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
};

// Simple, clean search client - best practices implementation
const searchClient = {
  search(requests) {
    console.log('🔍 SEARCH TRIGGERED:', {
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
      requests: requests.map(r => ({
        indexName: r.indexName,
        query: r.params?.query,
        page: r.params?.page,
        facetFilters: r.params?.facetFilters
      }))
    });
    
    const request = requests[0];
    if (!request) {
      return Promise.resolve({ results: [] });
    }
    const query = request.params.query || '';
    const facetFilters = request.params.facetFilters || [];
    const page = request.params.page || 0;
    const hitsPerPage = request.params.hitsPerPage || 20;
    const [indexName, ...sortParts] = request.indexName.split(':');
    const sort = sortParts.length ? sortParts.join(':') : 'created_at:desc';
    
    // Build filters from facetFilters
    const filters = facetFilters.flat().map(f => {
      if (Array.isArray(f)) {
        return `(${f.map(val => {
          const [key, value] = val.split(':');
          return `${key} = "${value}"`;
        }).join(' OR ')})`;
      } else {
        const [key, value] = f.split(':');
        return `${key} = "${value}"`;
      }
    }).join(' AND ');

    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('index', indexName);
    url.searchParams.set('offset', page * hitsPerPage);
    url.searchParams.set('limit', hitsPerPage);
    url.searchParams.set('facets', '*');
    url.searchParams.set('sort', sort);
    
    if (filters) {
      url.searchParams.set('filters', filters);
    }

    debugLog('Search request:', { query, page, hitsPerPage, filters });

    return fetch(url.toString(), {
      headers: { 'x-api-key': API_KEY }
    })
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
    .then(data => {
      if (!data.success || !data.data) {
        throw new Error('Invalid API response');
      }

      const responseData = data.data;
      const hits = responseData.hits || [];
      const nbHits = responseData.nbHits || hits.length;
      const facetDistribution = responseData.facetDistribution || {};

      return {
        results: [{
          hits: hits.map(hit => ({
            ...hit,
            _geo: hit._geo || (hit.lat && hit.lng ? { lat: parseFloat(hit.lat), lng: parseFloat(hit.lng) } : null),
            objectID: hit.primary_key || hit.id || `hit_${Math.random()}`,
            _highlightResult: hit._formatted ? Object.fromEntries(
              Object.entries(hit._formatted).map(([key, value]) => [key, { value }])
            ) : {}
          })),
          nbHits,
          facets: facetDistribution,
          page,
          nbPages: Math.ceil(nbHits / hitsPerPage),
          hitsPerPage,
          processingTimeMS: responseData.processingTimeMS || 0,
          query,
          params: JSON.stringify(request.params || {}),
          exhaustiveNbHits: true,
          search_id: `search_${Date.now()}`,
          indexNameForTracking: indexName,
          appliedFiltersForTracking: facetFilters
        }]
      };
    })
    .catch(error => {
      console.error('Search error:', error);
      return {
        results: [{
          hits: [],
          nbHits: 0,
          facets: {},
          page: 0,
          nbPages: 0,
          hitsPerPage,
          processingTimeMS: 0,
          query,
          params: '',
          exhaustiveNbHits: true,
          search_id: `error_${Date.now()}`,
          indexNameForTracking: indexName,
          appliedFiltersForTracking: facetFilters
        }]
      };
    });
  }
};

// Riyadh coordinates
const RIYADH_LAT = 24.7136;
const RIYADH_LNG = 46.6753;

// Distance calculation function
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d.toFixed(1);
}

// Price formatting function
const formatPrice = (hit) => {
  const price = hit.price_after_tax || hit.price_before_tax;
  if (price) {
    return `${price.toLocaleString('ar-SA')} ريال`;
  }
  return null;
};

// Function to get proper image URL
const getImageUrl = (attachment, projectId) => {
  if (!attachment) return null;
  
  // If it's already a full URL, use it
  if (attachment.url && attachment.url.startsWith('http')) {
    return attachment.url;
  }
  
  // If it's a path like "projects/1f1af417-7e66-4258-b3f8-a57a27867570/6gjDoA7sDMYNXYS8gHiZozPRqnzqBSL7jqWXtzJH.jpg"
  if (attachment.url && attachment.url.startsWith('projects/')) {
    return `https://repm.ams3.digitaloceanspaces.com/${attachment.url}`;
  }
  
  // If it's just a filename with project ID
  if (attachment.filename && projectId) {
    return `https://repm.ams3.digitaloceanspaces.com/projects/${projectId}/${attachment.filename}`;
  }
  
  return attachment.thumbnail || attachment.url || null;
};

// Custom Hit Component for geo results - Modern Card Design (memoized for performance)
const Hit = memo(({ hit, onClick }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  
  if (!hit || typeof hit !== 'object') {
    console.error('Invalid hit object received:', hit);
    return null;
  }

  const distance = hit._geo ? 
    calculateDistance(RIYADH_LAT, RIYADH_LNG, hit._geo.lat, hit._geo.lng) : 
    'غير محدد';

  const getImageUrl = (hit) => {
    if (hit.media && hit.media.images && hit.media.images.length > 0) {
      return hit.media.images[0];
    }
    if (hit.media && hit.media.attachments && hit.media.attachments.length > 0) {
      return hit.media.attachments[0];
    }
    return null;
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  return (
    <div className="modern-property-card" onClick={onClick}>
      {/* Property Image with Overlay Elements */}
      <div className="card-image-container">
        {getImageUrl(hit) ? (
          <img 
            src={getImageUrl(hit)}
            alt={hit.title || hit.project?.name || 'عقار'}
            className="card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="card-placeholder">
            <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>لا توجد صورة</span>
          </div>
        )}
        
        {/* Heart/Favorite Icon */}
        <div 
          className={`favorite-icon ${isFavorited ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          title={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <svg width="20" height="18" viewBox="0 0 24 22" fill={isFavorited ? 'currentColor' : 'none'}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Status Badge */}
        {hit.status_label_ar && (
          <div className="status-badge-overlay">
            {hit.status_label_ar}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="card-content">
        {/* Property Type */}
        <div className="property-type">
          {hit.type_label_ar || 'نوع العقار'}
        </div>

        {/* Price */}
        {formatPrice(hit) && (
          <div className="property-price">
            {formatPrice(hit)}
          </div>
        )}

        {/* Property Title/Name */}
        <h3 className="property-title">
          {hit.title || hit.project_name || 'عقار غير مسمى'}
        </h3>

        {/* Location */}
        <div className="property-location">
          {hit.project_address || 'الموقع غير محدد'}
        </div>

        {/* Property Details */}
        <div className="property-details">
          <div className="detail-item">
            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M8 6l4-4 4 4v4H8V6z" />
            </svg>
            <span>{hit.bedrooms || 0}</span>
          </div>

          <div className="detail-item">
            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4h8l-4 4H8zM8 5l4 4H4l4-4z" />
            </svg>
            <span>{hit.bathrooms || 0}</span>
          </div>

          <div className="detail-item">
            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m6 0h4a1 1 0 011 1v4m0 6v4a1 1 0 01-1 1h-4m-6 0H4a1 1 0 01-1-1v-4" />
            </svg>
            <span>{hit.area_total_sqm ? `${hit.area_total_sqm} م²` : 'غير محدد'}</span>
          </div>
        </div>

        {/* Additional Features */}
        {(hit.is_furnished || hit.other_features) && (
          <div className="property-features">
            {hit.is_furnished && (
              <span className="feature-tag">🛋️ مفروش</span>
            )}
            {hit.other_features && (
              <span className="feature-tag">{hit.other_features}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// Clean Search Box Component - best practices
const SearchBoxComponent = memo(({ currentRefinement, refine, placeholder }) => {
  const [inputValue, setInputValue] = useState(currentRefinement);
  const debounceRef = useRef(null);

  // Sync with external refinement changes only when necessary
  useEffect(() => {
    if (currentRefinement !== inputValue) {
      setInputValue(currentRefinement);
    }
  }, [currentRefinement]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce search - 100ms as requested
    debounceRef.current = setTimeout(() => {
      refine(value);
    }, 100);
  }, [refine]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    refine(inputValue);
  }, [inputValue, refine]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="search"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-right"
        dir="rtl"
        autoComplete="off"
        spellCheck="false"
      />
      <button
        type="submit"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
});

const CustomSearchBox = connectSearchBox(SearchBoxComponent);

// Filter Icon Component
const FilterIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="filter-icon"
  >
    <path d="M18 5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 19H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 19H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.4142 3.58579C18.1953 4.36684 18.1953 5.63317 17.4142 6.41422C16.6332 7.19527 15.3668 7.19527 14.5858 6.41422C13.8047 5.63317 13.8047 4.36684 14.5858 3.58579C15.3668 2.80474 16.6332 2.80474 17.4142 3.58579" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.41422 10.5858C10.1953 11.3668 10.1953 12.6332 9.41422 13.4142C8.63317 14.1953 7.36684 14.1953 6.58579 13.4142C5.80474 12.6332 5.80474 11.3668 6.58579 10.5858C7.36684 9.80474 8.63317 9.80474 9.41422 10.5858" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.4142 17.5858C18.1953 18.3668 18.1953 19.6332 17.4142 20.4142C16.6332 21.1953 15.3668 21.1953 14.5858 20.4142C13.8047 19.6332 13.8047 18.3668 14.5858 17.5858C15.3668 16.8047 16.6332 16.8047 17.4142 17.5858" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Custom Clear Refinements Component
const CustomClearRefinements = connectCurrentRefinements(({ items, refine }) => {
  if (items.length === 0) return null;
  
  return (
    <button 
      className="clear-filters-button"
      onClick={() => refine(items)}
      aria-label="مسح جميع الفلاتر"
    >
      مسح الفلاتر
    </button>
  );
});

// Custom Refinement List for Boolean Values
const BooleanRefinementList = connectRefinementList(({ items, refine, transformLabels }) => (
  <div className="boolean-refinement-list">
    {items.map((item) => (
      <label key={item.label} className="boolean-refinement-item">
        <input
          type="checkbox"
          checked={item.isRefined}
          onChange={() => refine(item.value)}
          className="boolean-checkbox"
        />
        <span className="boolean-label">
          {transformLabels ? transformLabels(item.label) : item.label}
        </span>
        <span className="boolean-count">({item.count})</span>
      </label>
    ))}
  </div>
));

// Custom Standard Refinement List
const CustomRefinementList = connectRefinementList(({ items, refine, showMore, canToggleShowMore, toggleShowMore }) => (
  <div className="custom-refinement-list">
    {items.map((item) => (
      <label key={item.label} className="refinement-item-label">
        <input
          type="checkbox"
          checked={item.isRefined}
          onChange={() => refine(item.value)}
          className="refinement-checkbox"
        />
        <span className="refinement-text">{item.label}</span>
        <span className="refinement-count">({item.count})</span>
      </label>
    ))}
    {showMore && (
      <button
        className="show-more-button"
        disabled={!canToggleShowMore}
        onClick={toggleShowMore}
      >
        {canToggleShowMore ? 'عرض المزيد' : 'عرض أقل'}
      </button>
    )}
  </div>
));

// Filter Panel Component
const FilterPanel = connectStateResults(({ searchResults, isFilterPanelVisible, onClose }) => {
  const nbHits = searchResults?.nbHits || 0;
  
  const booleanLabels = {
    true: 'نعم',
    false: 'لا'
  };

  const furnishedLabels = {
    true: 'مفروش',
    false: 'غير مفروش'
  };

  const rentLabels = {
    true: 'متاح للإيجار',
    false: 'غير متاح للإيجار'
  };

  const purchaseLabels = {
    true: 'تم البيع',
    false: 'متاح للبيع'
  };

  return (
    <>
      {isFilterPanelVisible && <div className="filter-overlay" onClick={onClose} />}
      
      <div className={`filter-panel ${isFilterPanelVisible ? 'visible' : ''}`}>
        <div className="filter-panel-header">
          <h3 className="filter-title">🔍 الفلاتر</h3>
          <CustomClearRefinements />
        </div>
        
        <div className="filter-panel-content">
          {/* Property Status */}
          <div className="filter-group">
            <h4 className="filter-subtitle">حالة العقار</h4>
            <CustomRefinementList 
              attribute="status_label_ar" 
              limit={8}
              showMore={true}
            />
          </div>

          {/* Property Type */}
          <div className="filter-group">
            <h4 className="filter-subtitle">نوع العقار</h4>
            <CustomRefinementList 
              attribute="type_label_ar" 
              limit={6}
              showMore={true}
            />
          </div>

          {/* Bedrooms */}
          <div className="filter-group">
            <h4 className="filter-subtitle">عدد غرف النوم</h4>
            <CustomRefinementList 
              attribute="bedrooms" 
              limit={8}
            />
          </div>

          {/* Bathrooms */}
          <div className="filter-group">
            <h4 className="filter-subtitle">عدد الحمامات</h4>
            <CustomRefinementList 
              attribute="bathrooms" 
              limit={6}
            />
          </div>

          {/* Furnished */}
          <div className="filter-group">
            <h4 className="filter-subtitle">حالة الأثاث</h4>
            <BooleanRefinementList 
              attribute="is_furnished" 
              transformLabels={(label) => furnishedLabels[label] || label}
            />
          </div>

          {/* Available for Rent */}
          <div className="filter-group">
            <h4 className="filter-subtitle">متاح للإيجار</h4>
            <BooleanRefinementList 
              attribute="available_for_rent" 
              transformLabels={(label) => rentLabels[label] || label}
            />
          </div>

          {/* Purchase Completed */}
          <div className="filter-group">
            <h4 className="filter-subtitle">حالة الشراء</h4>
            <BooleanRefinementList 
              attribute="purchase_completed" 
              transformLabels={(label) => purchaseLabels[label] || label}
            />
          </div>

          {/* Status Source */}
          <div className="filter-group">
            <h4 className="filter-subtitle">مصدر الحالة</h4>
            <CustomRefinementList 
              attribute="status_source_code" 
              limit={5}
              showMore={true}
            />
          </div>

          {/* Data Source */}
          <div className="filter-group">
            <h4 className="filter-subtitle">مصدر البيانات</h4>
            <CustomRefinementList 
              attribute="source" 
              limit={5}
            />
          </div>
        </div>
        
        <div className="filter-panel-footer">
          <button className="show-results-button" onClick={onClose}>
            عرض {nbHits.toLocaleString('ar-SA')} نتيجة
          </button>
        </div>
      </div>
    </>
  );
});

// Map component
const MapWithBounds = memo(function MapWithBounds({ hits, onBoundsChange }) {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      onBoundsChange({
        topLeft: [sw.lat, sw.lng],
        bottomRight: [ne.lat, ne.lng]
      });
    };

    map.on('moveend', handleMoveEnd);
    return () => map.off('moveend', handleMoveEnd);
  }, [map, onBoundsChange]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hits
        .filter(hit => hit._geo && hit._geo.lat && hit._geo.lng)
        .map((hit, index) => (
          <Marker
            key={hit.objectID || index}
            position={[hit._geo.lat, hit._geo.lng]}
            icon={createCustomIcon(hit.status_label_ar)}
          >
            <Popup>
              <div className="p-3 max-w-sm arabic-layout">
                <h4 className="font-bold text-base mb-2">{hit.title || hit.project_name || 'مشروع غير مسمى'}</h4>
                
                {hit.media && hit.media.images && hit.media.images.length > 0 && (
                  <img 
                    src={hit.media.images[0]} 
                    alt={hit.title || 'مشروع'}
                    className="w-full h-32 object-cover rounded mb-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                <p className="text-sm text-gray-600 mb-2">
                  {hit.description ? hit.description.replace(/<[^>]*>/g, '') : 'لا يوجد وصف'}
                </p>
                
                {hit.project_address && (
                  <p className="text-xs text-gray-500 mb-2">
                    📍 {hit.project_address}
                  </p>
                )}
                
                {hit.status_label_ar && (
                  <div className="flex items-center mb-2">
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {hit.status_label_ar}
                    </span>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
                  <span>🛏️ {hit.bedrooms || 0} غرف</span>
                  <span>🚿 {hit.bathrooms || 0} حمام</span>
                  <span>📏 {hit.area_total_sqm || 0} م²</span>
                </div>
                
                {formatPrice(hit) && (
                  <p className="text-sm font-bold text-green-600 mb-2">
                    💰 {formatPrice(hit)}
                  </p>
                )}
                
                <p className="text-xs text-blue-600 font-medium">
                  📏 {calculateDistance(RIYADH_LAT, RIYADH_LNG, hit._geo.lat, hit._geo.lng)} كم من الرياض
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
});


// Simple Hits Component - use only connectHits to prevent double connection
const SimpleHits = connectHits(({ hits }) => {
  const handleHitClick = (hit) => {
    debugLog('Location clicked:', hit.name);
  };

  return (
    <div className="properties-container">
      <div className="text-sm text-gray-500 mb-6 text-center">
        <span className="results-count">{hits.length}</span> وحدة
      </div>
      
      <div className="properties-grid">
        {hits.map((hit, index) => (
          <Hit
            hit={hit}
            key={hit.objectID || index}
            onClick={() => handleHitClick(hit)}
          />
        ))}
      </div>
    </div>
  );
});

// Results Stats Component
const ResultsStats = connectStateResults(({ searchResults, isSearchStalled }) => {
  if (isSearchStalled) {
    return (
      <div className="flex items-center justify-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>جاري البحث...</span>
      </div>
    );
  }

  if (!searchResults) {
    return null;
  }

  const { nbHits, processingTimeMS, query } = searchResults;
  
  return (
    <div className="text-sm text-gray-500 text-center">
      تم العثور على {nbHits} {nbHits === 1 ? 'نتيجة' : 'نتيجة'}
      {query && ` عن "${query}"`}
      {processingTimeMS && ` في ${processingTimeMS} مللي ثانية`}
    </div>
  );
});

// Map component with hits from InstantSearch
const MapComponent = connectStateResults(({ searchResults }) => {
  const hits = searchResults ? searchResults.hits : [];
  
  const handleBoundsChange = useCallback((bounds) => {
    debugLog('Map bounds changed:', bounds);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 sticky top-32">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 text-center">
        🗺️ عرض الخريطة
      </h2>
      <div className="map-container rounded-xl overflow-hidden border-2 border-gray-100">
        <MapContainer
          center={[RIYADH_LAT, RIYADH_LNG]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <MapWithBounds 
            hits={hits} 
            onBoundsChange={handleBoundsChange}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        📍 مركز الخريطة: الرياض (24.7136, 46.6753)
      </p>
    </div>
  );
});

// Move these constants outside the component to prevent re-creation
const CONFIGURE_PROPS = {
  hitsPerPage: 20,
  attributesToRetrieve: ['*'],
  distinct: true,
  enablePersonalization: false
};

const SORT_BY_ITEMS = [
  { label: 'الأحدث', value: 'realestate_example:created_at:desc' },
  { label: 'السعر (الأقل)', value: 'realestate_example:price_after_tax:asc' },
  { label: 'السعر (الأعلى)', value: 'realestate_example:price_after_tax:desc' },
  { label: 'المساحة (الأكبر)', value: 'realestate_example:area_total_sqm:desc' },
  { label: 'المساحة (الأصغر)', value: 'realestate_example:area_total_sqm:asc' }
];

const SORT_BY_CLASS_NAMES = {
  root: 'sort-dropdown-root',
  select: 'sort-dropdown'
};

function App() {
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 arabic-layout">
      <InstantSearch searchClient={searchClient} indexName="realestate_example">
        <Configure {...CONFIGURE_PROPS} />

        {/* Header */}
        <header className="modern-header">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Top Header Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="header-title">
                  إشراقة
                </h1>
                <div className="header-subtitle">
                  عن إشراقة
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="language-toggle">
                  Eng
                </button>
                <button className="signup-btn">
                  أحرز موقعاً
                </button>
              </div>
            </div>

            {/* Search Section */}
            <div className="search-section">
              <div className="search-title">
                بيت قريب من المطار ومريح يا بندى 1.7 مليون ريال سعودي بيت قريب من المطار ومريح
              </div>
              
              <div className="flex gap-4 items-center mt-4">
                <div className="flex-1">
                  {/* SEARCH BOX TEMPORARILY DISABLED FOR DEBUGGING */}
                  {false && <CustomSearchBox placeholder="ابحث عن عقار، مشروع، أو موقع..." />}
                  <div className="p-4 border rounded text-center text-gray-500">Search disabled for debugging</div>
                </div>
                
                              {/* Filter Toggle */}
              <button
                className={`filter-toggle-btn ${isFilterPanelVisible ? 'active' : ''}`}
                onClick={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
                aria-label="Toggle filters"
              >
                <FilterIcon />
                <span>فلترة</span>
              </button>
              </div>

              {/* Navigation Tabs */}
              <div className="navigation-tabs">
                <button className="nav-tab">السعر</button>
                <button className="nav-tab">الموقع</button>
                <button className="nav-tab active">عدد الغرف</button>
                <button className="nav-tab">فيلا</button>
                <button className="nav-tab">مشاريع</button>
                <button className="nav-tab">وحدات</button>
                <button className="nav-tab">البيع</button>
                <button className="nav-tab">الرياض حدة</button>
                <button className="nav-tab">رياض حدة</button>
                <button 
                  onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                  className="nav-tab"
                >
                  {viewMode === 'grid' ? 'خريطة' : 'قائمة'}
                </button>
              </div>
            </div>
          </div>
        </header>


        {/* Filter Panel - TEMPORARILY DISABLED TO STOP INFINITE REQUESTS */}
        {false && <FilterPanel 
          isFilterPanelVisible={isFilterPanelVisible}
          onClose={() => setIsFilterPanelVisible(false)}
        />}

        {/* Main Content */}
        <main className="main-content">
          {/* Results Header */}
          <div className="results-header">
            <div className="results-tabs">
              <button className="results-tab">وحدة</button>
              <button className="results-tab active">مشاريع</button>
            </div>
            
            <div className="results-info">
              {/* TEMPORARILY DISABLED TO STOP INFINITE REQUESTS */}
              {false && <Stats 
                classNames={{
                  root: 'stats-display',
                  text: 'stats-text'
                }}
                translations={{
                  stats: (nbHits, processingTimeMS) => `${nbHits} وحدة`
                }}
              />}
              
              {false && <div className="sort-section">
                <SortBy 
                  defaultRefinement="realestate_example:created_at:desc"
                  items={SORT_BY_ITEMS}
                  classNames={SORT_BY_CLASS_NAMES}
                />
              </div>}
            </div>
          </div>

          {viewMode === 'map' ? (
            /* Map View - TEMPORARILY DISABLED */
            <div className="map-view">
              {false && <MapComponent />}
              <div className="p-8 text-center">Map view temporarily disabled for debugging</div>
            </div>
          ) : (
            /* Grid View */
            <div className="results-section">
              {/* TEMPORARILY DISABLED TO STOP INFINITE REQUESTS */}
              {false && <SimpleHits />}
              <div className="p-8 text-center">Results temporarily disabled for debugging</div>
            </div>
          )}
        </main>

      </InstantSearch>
    </div>
  );
}

export default App;