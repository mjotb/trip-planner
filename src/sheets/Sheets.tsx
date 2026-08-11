'use client';

import { useStore } from '@/lib/store';
import type { Block, Trip } from '@/lib/types';
import FlightSheet from './FlightSheet';
import CitySheet from './CitySheet';
import ActivitySheet from './ActivitySheet';
import PlaceSheet from './PlaceSheet';
import TripSheet from './TripSheet';
import AiSheet from './AiSheet';
import MenuSheet from './MenuSheet';

export default function Sheets({ trip, blocks }: { trip: Trip; blocks: Block[] }) {
  const sheet = useStore((s) => s.ui.sheet);

  return (
    <>
      <FlightSheet open={sheet === 'flight'} />
      <CitySheet open={sheet === 'city' || sheet === 'newCity'} isNew={sheet === 'newCity'} trip={trip} />
      <ActivitySheet open={sheet === 'activity'} />
      <PlaceSheet open={sheet === 'place'} trip={trip} />
      <TripSheet open={sheet === 'newTrip' || sheet === 'editTrip'} isNew={sheet === 'newTrip'} />
      <AiSheet open={sheet === 'ai'} trip={trip} blocks={blocks} />
      <MenuSheet open={sheet === 'menu'} />
    </>
  );
}
