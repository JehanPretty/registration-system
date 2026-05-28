import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { Search, MapPin, Loader2, Navigation, Check } from "lucide-react";

// --- HELPERS ---

const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const MapEvents = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
};

// --- MAIN COMPONENT ---

const MapAddressPicker = ({ onSelect, initialQuery = "" }) => {
    const [search, setSearch] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState([14.5995, 120.9842]); // Manila Default
    const [zoom, setZoom] = useState(13);
    const [addressDetails, setAddressDetails] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const searchTimeout = useRef(null);

    // Search logic (Nominatim)
    useEffect(() => {
        if (search.length < 3) {
            setSuggestions([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&addressdetails=1&limit=5`);
                const data = await res.json();
                setSuggestions(data);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        }, 800);

        return () => clearTimeout(searchTimeout.current);
    }, [search]);

    const handleSelectSuggestion = (item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setPosition([lat, lon]);
        setZoom(16);
        setSuggestions([]);
        setSearch(item.display_name);
        setAddressDetails(item.address);
    };

    const handleMapClick = async (latlng) => {
        setPosition([latlng.lat, latlng.lng]);
        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`);
            const data = await res.json();
            setAddressDetails(data.address);
            setSearch(data.display_name);
        } catch (err) {
            console.error("Reverse geocode error:", err);
        } finally {
            setLoading(false);
        }
    };

    const confirmSelection = () => {
        if (!addressDetails) return;

        // Map Nominatim fields to our internal Address Hierarchy
        const mapped = {
            country: addressDetails.country || "",
            state: addressDetails.state || addressDetails.province || addressDetails.region || "",
            city: addressDetails.city || addressDetails.town || addressDetails.municipality || addressDetails.village || "",
            barangay: addressDetails.suburb || addressDetails.neighbourhood || addressDetails.village || "",
            street: addressDetails.road || addressDetails.street || "",
            zipcode: addressDetails.postcode || "",
            fullAddress: search
        };

        if (onSelect) onSelect(mapped);
    };

    return (
        <div className="flex flex-col h-[500px] w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xl relative">
            {/* Search Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[1000] space-y-2">
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search any place in the world..."
                        className="w-full pl-11 pr-12 py-3.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl text-sm font-bold text-[#1a234b] outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                    )}
                </div>

                {suggestions.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelectSuggestion(item)}
                                className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-start gap-4 border-b border-slate-50 last:border-0"
                            >
                                <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-[#1a234b] line-clamp-1">{item.display_name.split(',')[0]}</p>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 font-medium italic">{item.display_name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <MapContainer 
                    center={position} 
                    zoom={zoom} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap center={position} />
                    <Marker position={position} />
                    <MapEvents onLocationSelect={handleMapClick} />
                </MapContainer>

                {/* Confirm Overlay */}
                <div className="absolute bottom-6 left-6 right-6 z-[1000] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/95 backdrop-blur-md p-4 rounded-[28px] border border-slate-100 shadow-2xl flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-black text-blue-600 mb-1 flex items-center gap-2">
                                <Navigation className="w-3 h-3" /> Selected Point
                            </h4>
                            <p className="text-xs font-bold text-[#1a234b] line-clamp-1">
                                {loading ? "Fetching address..." : (search || "Tap on map to pick")}
                            </p>
                        </div>
                        <button
                            onClick={confirmSelection}
                            disabled={loading || !addressDetails}
                            className={`shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95
                                ${addressDetails ? 'bg-[#1a234b] text-white shadow-blue-900/20 hover:scale-105' : 'bg-slate-100 text-slate-300'}`}
                        >
                            <Check className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapAddressPicker;
