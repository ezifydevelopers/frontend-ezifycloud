// Location field component for item form

import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Map } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Column } from '@/types/workspace';

interface LocationFieldProps {
  column: Column;
  fieldName: string;
  control: any;
  errors: any;
}

export const LocationField: React.FC<LocationFieldProps> = ({
  column,
  fieldName,
  control,
  errors,
}) => {
  const isRequired = column.required || false;
  const error = errors[fieldName];
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  return (
    <Controller
      name={fieldName}
      control={control}
      rules={{ required: isRequired ? `${column.name} is required` : false }}
      render={({ field }) => {
        const locationValue = field.value;
        let address = '';
        let coordinates: { lat: number; lng: number } | null = null;

        if (locationValue) {
          if (typeof locationValue === 'string') {
            try {
              const parsed = JSON.parse(locationValue);
              address = parsed.address || '';
              if (parsed.lat && parsed.lng) {
                coordinates = { lat: parsed.lat, lng: parsed.lng };
              }
            } catch {
              address = locationValue;
            }
          } else if (typeof locationValue === 'object') {
            const loc = locationValue as { address?: string; lat?: number; lng?: number };
            address = loc.address || '';
            if (loc.lat && loc.lng) {
              coordinates = { lat: loc.lat, lng: loc.lng };
            }
          }
        }

        const handleAddressChange = (newAddress: string) => {
          const locationData: { address?: string; lat?: number; lng?: number } = {};
          if (newAddress) locationData.address = newAddress;
          if (coordinates) {
            locationData.lat = coordinates.lat;
            locationData.lng = coordinates.lng;
          }
          field.onChange(Object.keys(locationData).length > 0 ? locationData : null);
        };

        const handleMapClick = () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const newCoordinates = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                const locationData: { address?: string; lat?: number; lng?: number } = {
                  ...(address ? { address } : {}),
                  ...newCoordinates,
                };
                field.onChange(locationData);
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
          const locationData: { address?: string; lat?: number; lng?: number } = {
            ...(address ? { address } : {}),
            lat,
            lng,
          };
          field.onChange(locationData);
          setMapDialogOpen(false);
        };

        return (
          <div className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              <Input
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Enter address or location"
                className={error ? 'border-destructive' : ''}
              />
              {coordinates && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMapClick}
              >
                <Map className="h-4 w-4 mr-2" />
                Pick on Map
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}

            {/* Map Picker Dialog */}
            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select Location</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="h-96 bg-slate-100 rounded-md flex items-center justify-center">
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
                              handleMapSelect(lat, coordinates?.lng || 0);
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
                              handleMapSelect(coordinates?.lat || 0, lng);
                            }
                          }}
                          placeholder="Longitude"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (coordinates) {
                            handleMapSelect(coordinates.lat, coordinates.lng);
                          }
                        }}
                      >
                        Use These Coordinates
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      }}
    />
  );
};

