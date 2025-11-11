// Location cell editor - map picker or address input

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, X, Map } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LocationCellEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const LocationCellEditor: React.FC<LocationCellEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
}) => {
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed.address) {
            setAddress(parsed.address);
          }
          if (parsed.lat && parsed.lng) {
            setCoordinates({ lat: parsed.lat, lng: parsed.lng });
          }
        } catch {
          setAddress(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        const loc = value as { address?: string; lat?: number; lng?: number };
        if (loc.address) setAddress(loc.address);
        if (loc.lat && loc.lng) setCoordinates({ lat: loc.lat, lng: loc.lng });
      }
    }
  }, [value]);

  const handleSave = () => {
    if (address || coordinates) {
      const locationData: { address?: string; lat?: number; lng?: number } = {};
      if (address) locationData.address = address;
      if (coordinates) {
        locationData.lat = coordinates.lat;
        locationData.lng = coordinates.lng;
      }
      onChange(locationData);
    } else {
      onChange(null);
    }
    onSave();
  };

  const handleMapClick = () => {
    // Check if geolocation is available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMapDialogOpen(true);
        },
        () => {
          setMapDialogOpen(true);
        }
      );
    } else {
      setMapDialogOpen(true);
    }
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setMapDialogOpen(false);
  };

  return (
    <div className="p-2 space-y-2 min-w-[300px]">
      <div className="space-y-1">
        <Label className="text-xs">Address</Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address or location"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          autoFocus
        />
      </div>

      {coordinates && (
        <div className="text-xs text-muted-foreground">
          Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMapClick}
          className="flex-1"
        >
          <Map className="h-4 w-4 mr-2" />
          Pick on Map
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSave}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Simple Map Picker Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-96 bg-slate-100 rounded-md flex items-center justify-center">
              {/* Simple map interface - in production, use a proper map library like Leaflet or Google Maps */}
              <div className="text-center space-y-4">
                <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Map picker integration needed
                </p>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={coordinates?.lat || ''}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value);
                      if (!isNaN(lat)) {
                        setCoordinates({ lat, lng: coordinates?.lng || 0 });
                      }
                    }}
                    placeholder="Latitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={coordinates?.lng || ''}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value);
                      if (!isNaN(lng)) {
                        setCoordinates({ lat: coordinates?.lat || 0, lng });
                      }
                    }}
                    placeholder="Longitude"
                  />
                </div>
                <Button onClick={() => {
                  if (coordinates) {
                    handleMapSelect(coordinates.lat, coordinates.lng);
                  }
                }}>
                  Use These Coordinates
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

