import React, { useState, useEffect, useRef } from 'react';
import {
  InstantSearch,
  Configure,
  connectStateResults,
  connectHits,
  Highlight,
  connectSearchBox,
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
  let iconSymbol = '🏗️';
  
  if (status) {
    const statusCode = status.code || status.ar || status.en || status;
    
    if (statusCode.includes('Under_Construction') || statusCode.includes('قيد الإنشاء')) {
      color = '#dc2626';
      iconSymbol = '🏗️';
    } else if (statusCode.includes('Soon_Sale') || statusCode.includes('قريباً البيع')) {
      color = '#d97706';
      iconSymbol = '🔜';
    } else if (statusCode.includes('Completed') || statusCode.includes('مباع بالكامل') || statusCode.includes('SOLD OUT')) {
      color = '#16a34a';
      iconSymbol = '✅';
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

// Custom search client that only sends q and index parameters
const searchClient = {
  search(requests) {
    const request = requests[0];
    const query = request.params.query || '';
    const [indexName] = request.indexName.split(':');
    
    const url = new URL(`${BASE_URL}/search`);
    if (query) {
      url.searchParams.set('q', query);
    }
    url.searchParams.set('index', indexName);

    debugLog('Simple API request URL:', url.toString());

    return fetch(url.toString(), {
      headers: {
        'x-api-key': API_KEY
      }
    })
      .then(res => {
        if (!res.ok) {
          console.error('Fetch error:', res.status, res.statusText);
          return res.text().then(text => { 
            console.error('Fetch error body:', text);
            throw new Error(`HTTP error ${res.status}`); 
          });
        }
        return res.json();
      })
      .then(data => {
        debugLog('Raw API response:', data);
        
        let responseData;
        if (data.success && data.data) {
          responseData = data.data;
        } else {
          throw new Error('Invalid API response structure');
        }

        const hits = responseData.hits || [];
        debugLog(`Processing ${hits.length} hits`);

        return {
          results: [
            {
              hits: hits.map(hit => {
                const transformedHighlightResult = {};
                if (hit._formatted) {
                  for (const key in hit._formatted) {
                    if (Object.prototype.hasOwnProperty.call(hit._formatted, key)) {
                      transformedHighlightResult[key] = { value: hit._formatted[key] };
                    }
                  }
                }

                const geoData = {};
                if (hit.lat && hit.lng) {
                  geoData._geo = {
                    lat: parseFloat(hit.lat),
                    lng: parseFloat(hit.lng)
                  };
                } else if (hit.long && hit.lat) {
                  geoData._geo = {
                    lat: parseFloat(hit.lat),
                    lng: parseFloat(hit.long)
                  };
                }

                return {
                  ...hit,
                  ...geoData,
                  objectID: hit.id || hit.object_key || String(Math.random()),
                  _highlightResult: transformedHighlightResult,
                  category: hit.status?.ar || hit.status?.en || 'غير محدد',
                  type: hit.district?.ar || hit.district?.en || 'غير محدد',
                  status: hit.status?.ar || 'غير محدد',
                };
              }),
              nbHits: hits.length,
              facets: {},
              page: 0,
              nbPages: 1,
              hitsPerPage: hits.length,
              processingTimeMS: 0,
              query,
              params: '',
              exhaustiveNbHits: true,
              search_id: data.requestId || `search_${Date.now()}`,
              indexNameForTracking: indexName,
              appliedFiltersForTracking: null,
            }
          ]
        };
      })
      .catch(error => {
        console.error('Error in searchClient:', error);
        const originalRequest = requests && requests[0];
        const queryFromRequest = (originalRequest && originalRequest.params && originalRequest.params.query) || '';
        const baseIndexNameFromRequest = (originalRequest && originalRequest.indexName) ? originalRequest.indexName.split(':')[0] : 'ishraqa';

        return {
          results: [{
            hits: [],
            nbHits: 0,
            facets: {},
            page: 0,
            nbPages: 0,
            hitsPerPage: 0,
            processingTimeMS: 0,
            query: queryFromRequest,
            params: '',
            exhaustiveNbHits: true,
            search_id: `error_search_id_${Date.now()}`,
            indexNameForTracking: baseIndexNameFromRequest,
            appliedFiltersForTracking: null,
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

// Custom Hit Component for geo results
const Hit = ({ hit, onClick }) => {
  if (!hit || typeof hit !== 'object') {
    console.error('Invalid hit object received:', hit);
    return null;
  }

  const distance = hit._geo ? 
    calculateDistance(RIYADH_LAT, RIYADH_LNG, hit._geo.lat, hit._geo.lng) : 
    'غير محدد';

  const getStatusClass = (status) => {
    if (!status) return 'status-badge';
    const statusText = status.ar || status.en || status;
    if (statusText.includes('قيد الإنشاء') || statusText.includes('Under Construction')) return 'status-badge status-construction';
    if (statusText.includes('قريباً البيع') || statusText.includes('Selling Soon')) return 'status-badge status-soon';
    if (statusText.includes('مباع بالكامل') || statusText.includes('SOLD OUT')) return 'status-badge status-sold';
    return 'status-badge';
  };


  return (
    <div className="project-card p-4 mb-4 cursor-pointer" onClick={onClick}>
      {/* Project Image */}
      {hit.attachments && hit.attachments.length > 0 && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img 
            src={getImageUrl(hit.attachments[0], hit.id)} 
            alt={hit.name || 'مشروع'}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {hit.name ? <Highlight attribute="name" hit={hit} tagName="mark" /> : 'مشروع غير مسمى'}
      </h3>
      
      {/* Status */}
      {hit.status && (
        <div className="mb-3">
          <span className={getStatusClass(hit.status)}>
            {hit.status.ar || hit.status.en || hit.status}
          </span>
        </div>
      )}
      
      {/* Location */}
      <p className="text-gray-600 mb-3 flex items-center">
        <span className="ml-2">📍</span>
        {hit.description ? 
          hit.description.replace(/<[^>]*>/g, '') : 
          hit.location || 'الموقع غير محدد'
        }
      </p>

      {/* Organization */}
      {hit.organization && (
        <p className="text-sm text-gray-500 mb-3 flex items-center">
          <span className="ml-2">🏢</span>
          {hit.organization.name}
        </p>
      )}

      {/* Project Details */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
        {hit.apartments_count && (
          <div className="flex items-center">
            <span className="ml-1">🏠</span>
            <span>{hit.apartments_count} وحدة</span>
          </div>
        )}
        {hit.progress_bar && (
          <div className="flex items-center">
            <span className="ml-1">⚡</span>
            <span>{hit.progress_bar}% مكتمل</span>
          </div>
        )}
      </div>

      {/* District and Distance */}
      <div className="flex justify-between items-center text-sm">
        {hit.district && (
          <span className="text-gray-500">
            {hit.district.ar || hit.district.en}
          </span>
        )}
        <span className="text-blue-600 font-medium">
          {distance} كم من الرياض
        </span>
      </div>
    </div>
  );
};

// Custom Search Box Component with debouncing
const InstantSearchBoxComponent = ({ currentRefinement, refine, placeholder }) => {
  const [inputValue, setInputValue] = useState(currentRefinement);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(currentRefinement);
  }, [currentRefinement]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onChange = (event) => {
    const newValue = event.currentTarget.value;
    setInputValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Immediate search for empty values, debounced for others
    if (newValue === '') {
      refine(newValue);
    } else {
      // Debounce search by 300ms for faster response
      timeoutRef.current = setTimeout(() => {
        refine(newValue);
      }, 300);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    refine(inputValue);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const onReset = () => {
    setInputValue('');
    refine('');
  };

  return (
    <div className="w-full">
      <form
        role="search"
        className="relative"
        noValidate
        onSubmit={onSubmit}
        onReset={onReset}
      >
        <input
          ref={inputRef}
          className="search-input w-full"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={placeholder}
          spellCheck="false"
          type="search"
          value={inputValue}
          onChange={onChange}
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>
    </div>
  );
};

const CustomSearchBox = connectSearchBox(InstantSearchBoxComponent);

// Map component
function MapWithBounds({ hits, onBoundsChange }) {
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
            icon={createCustomIcon(hit.status)}
          >
            <Popup>
              <div className="p-3 max-w-sm arabic-layout">
                <h4 className="font-bold text-base mb-2">{hit.name || 'مشروع غير مسمى'}</h4>
                
                {hit.attachments && hit.attachments.length > 0 && (
                  <img 
                    src={getImageUrl(hit.attachments[0], hit.id)} 
                    alt={hit.name || 'مشروع'}
                    className="w-full h-32 object-cover rounded mb-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                <p className="text-sm text-gray-600 mb-2">
                  {hit.description ? hit.description.replace(/<[^>]*>/g, '') : hit.location || 'لا يوجد وصف'}
                </p>
                
                {hit.organization && (
                  <p className="text-xs text-gray-500 mb-2">
                    🏢 {hit.organization.name}
                  </p>
                )}
                
                {hit.status && (
                  <div className="flex items-center mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      hit.status.color === 'red' ? 'bg-red-100 text-red-800' :
                      hit.status.color === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      hit.status.color === 'green' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {hit.status.ar || hit.status.en}
                    </span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                  {hit.apartments_count && (
                    <span>🏠 {hit.apartments_count} وحدة</span>
                  )}
                  {hit.progress_bar && (
                    <span>⚡ {hit.progress_bar}% مكتمل</span>
                  )}
                </div>
                
                {hit.district && (
                  <p className="text-xs text-gray-500 mb-2">
                    📍 {hit.district.ar || hit.district.en}
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
}

// Simple Hits Component
const SimpleHitsComponent = ({ hits }) => {
  const handleHitClick = (hit) => {
    debugLog('Location clicked:', hit.name);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-4 text-center">
        عرض {hits.length} {hits.length === 1 ? 'نتيجة' : 'نتيجة'}
      </div>
      
      {hits.map((hit, index) => (
        <Hit
          hit={hit}
          key={hit.objectID || index}
          onClick={() => handleHitClick(hit)}
        />
      ))}
    </div>
  );
};

// Connected Hits with state management
const ConnectedHits = connectStateResults(({ searchResults }) => {
  const hits = searchResults ? searchResults.hits : [];
  return <SimpleHitsComponent hits={hits} />;
});

const SimpleHits = connectHits(ConnectedHits);

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
  
  const handleBoundsChange = (bounds) => {
    debugLog('Map bounds changed:', bounds);
  };

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

function App() {

  return (
    <div className="min-h-screen bg-gray-50 arabic-layout">
      <InstantSearch searchClient={searchClient} indexName="ishraqa">
        <Configure />

        {/* Header */}
        <header className="ishraqa-header shadow-lg sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                🏢 مساكن إشراقة العقارية
              </h1>
              <p className="text-blue-100 text-sm md:text-base">
                اكتشف مشاريعنا العقارية في الرياض
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto mb-4">
              <CustomSearchBox placeholder="ابحث عن المشاريع القريبة من الرياض..." />
            </div>
            
            <div className="text-center">
              <ResultsStats />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mobile-grid">
            
            {/* Search Results */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 text-center">
                  📋 نتائج البحث
                </h2>
                <div className="results-container">
                  <SimpleHits />
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="order-1 lg:order-2">
              <MapComponent />
            </div>
          </div>
        </div>

      </InstantSearch>
    </div>
  );
}

export default App;