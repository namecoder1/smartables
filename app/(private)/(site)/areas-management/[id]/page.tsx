'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocationStore } from '@/store/location-store';
import ZoneEditor from '../components/zone-editor';

const AreaPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getSelectedLocation } = useLocationStore();
  const location = getSelectedLocation();

  const handleBack = () => {
    router.push('/areas-management');
  };

  const handleSaveSuccess = () => {
    router.push('/areas-management');
  };

  if (!location) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Caricamento sede...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <ZoneEditor
        initialZoneId={id}
        onBack={handleBack}
        onSaveSuccess={handleSaveSuccess}
        locationSlug={location.slug}
      />
    </div>
  );
};

export default AreaPage;