// Location cell renderer - displays location address or coordinates

import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationCellProps {
  value: unknown;
  onClick: () => void;
}

export const LocationCell: React.FC<LocationCellProps> = ({ value, onClick }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  let displayText = '';
  let locationUrl = '';

  if (typeof value === 'string') {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(value);
      if (parsed.address) {
        displayText = parsed.address;
        locationUrl = parsed.address;
      } else if (parsed.lat && parsed.lng) {
        displayText = `${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`;
        locationUrl = `https://www.google.com/maps?q=${parsed.lat},${parsed.lng}`;
      }
    } catch {
      // Not JSON, treat as address string
      displayText = value;
      locationUrl = `https://www.google.com/maps/search/${encodeURIComponent(value)}`;
    }
  } else if (typeof value === 'object' && value !== null) {
    const location = value as { address?: string; lat?: number; lng?: number; coordinates?: [number, number] };
    if (location.address) {
      displayText = location.address;
      locationUrl = location.address;
    } else if (location.lat && location.lng) {
      displayText = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    } else if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      const [lng, lat] = location.coordinates;
      displayText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    }
  }

  if (!displayText) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div 
      className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      <MapPin className="h-4 w-4 text-muted-foreground" />
      {locationUrl ? (
        <a
          href={locationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate max-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          {displayText}
        </a>
      ) : (
        <span className="text-sm truncate max-w-[200px]">{displayText}</span>
      )}
    </div>
  );
};

