import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Location {
  id: string;
  organization_id: string;
  name: string;
  [key: string]: any;
}

interface LocationState {
  locations: Location[];
  selectedLocationId: string | null;
  setLocations: (locations: Location[]) => void;
  selectLocation: (locationId: string) => void;
  getSelectedLocation: () => Location | undefined;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      selectedLocationId: null,

      setLocations: (locations) => {
        set((state) => {
          let newSelectedId = state.selectedLocationId;
          const currentSelectedExists = locations.some(
            (l) => l.id === newSelectedId
          );

          // If no location selected or current selection not in new list, select first available
          if (
            (!newSelectedId || !currentSelectedExists) &&
            locations.length > 0
          ) {
            newSelectedId = locations[0].id;
          }

          return {
            locations,
            selectedLocationId: newSelectedId,
          };
        });
      },

      selectLocation: (locationId) => {
        set({ selectedLocationId: locationId });
      },

      getSelectedLocation: () => {
        const { locations, selectedLocationId } = get();
        return locations.find((l) => l.id === selectedLocationId);
      },
    }),
    {
      name: "location-storage",
      partialize: (state) => ({
        selectedLocationId: state.selectedLocationId,
      }),
    }
  )
);
