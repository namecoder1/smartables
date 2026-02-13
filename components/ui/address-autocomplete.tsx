"use client";

import { useEffect, useState } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useLoadScript } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  onAddressSelect?: (address: string, lat: number, lng: number, placeResult?: google.maps.GeocoderResult) => void;
  defaultValue?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  context?: 'onboarding' | 'default';
}

const libraries: ("places")[] = ["places"];

export function AddressAutocomplete({
  onAddressSelect,
  defaultValue = "",
  name = "address",
  required = false,
  placeholder = "Scrivi l'indirizzo...",
  context = 'default',
}: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  if (loadError) {
    return (
      <Input
        name={name}
        placeholder="Error loading maps"
        disabled
        className="cursor-not-allowed opacity-50"
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative">
        <Loader2 className="absolute left-3 h-4 w-4 animate-spin text-gray-500 top-2.5" />
        <Input
          placeholder={placeholder}
          disabled
          className="pl-9 cursor-not-allowed opacity-50"
        />
      </div>
    );
  }

  return (
    <PlacesAutocomplete
      onAddressSelect={onAddressSelect}
      defaultValue={defaultValue}
      name={name}
      required={required}
      placeholder={placeholder}
      context={context}
    />
  );
}

function PlacesAutocomplete({
  onAddressSelect,
  defaultValue,
  name,
  required,
  placeholder,
  context = 'default',
}: AddressAutocompleteProps) {
  const isOnboarding = context === 'onboarding';
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here if needed */
      componentRestrictions: { country: "it" },
    },
    debounce: 300,
    defaultValue,
  });

  const [isOpen, setIsOpen] = useState(false);

  // Update value if defaultValue changes externally
  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue, false);
    }
  }, [defaultValue, setValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    setIsOpen(false);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      if (onAddressSelect) {
        onAddressSelect(address, lat, lng, results[0]);
      }
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="relative">
      <MapPin className={cn(
        "absolute left-3 h-5 w-5",
        context === 'onboarding' ? 'top-3.5 text-black' : 'top-2 text-foreground'
      )} />
      <Input
        value={value}
        onChange={handleInput}
        disabled={!ready}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        placeholder={placeholder}
        className={cn(
          "pl-9",
          isOnboarding && "pl-10 h-12 text-lg text-black border-neutral-200 border-2 bg-white!"
        )}
        autoComplete="new-password"
        name={`${name}_search`}
        required={required}
        onKeyDown={(e) => {
          // Prevent form submission when pressing Enter
          if (e.key === "Enter") {
            e.preventDefault();
            // If there are suggestions, select the first one
            if (data.length > 0 && isOpen) {
              handleSelect(data[0].description);
            }
          }
        }}
      />
      <input type="hidden" name={name} value={value} />
      {status === "OK" && isOpen && (
        <ul className={cn(
          "absolute z-10 mt-2 rounded-xl max-h-60 w-full overflow-auto border-2 text-base border-primary! shadow-lg ring-4 ring-primary/40! ring-opacity-5 focus:outline-none sm:text-sm",
          isOnboarding ? "bg-white border-gray-200" : "bg-popover"
        )}>
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className={cn(
                "relative select-none py-2 pl-3 pr-9 cursor-pointer",
                isOnboarding ? "text-gray-900 hover:bg-gray-100" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="block truncate">{description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
