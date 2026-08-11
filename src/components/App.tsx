'use client';

import { useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { deriveBlocks, nightKeys } from '@/lib/blocks';
import { Icon, Toast } from './ui';
import TripScreen from '@/screens/TripScreen';
import NightsScreen from '@/screens/NightsScreen';
import DayScreen from '@/screens/DayScreen';
import PlacesScreen from '@/screens/PlacesScreen';
import TripsScreen from '@/screens/TripsScreen';
import Sheets from '@/sheets/Sheets';
import type { Tab } from '@/lib/types';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'trip', label: 'رحلتي', icon: 'map' },
  { key: 'cal', label: 'الليالي', icon: 'target' },
  { key: 'day', label: 'اليوم', icon: 'activity' },
  { key: 'places', label: 'أماكني', icon: 'pin' },
  { key: 'trips', label: 'رحلاتي', icon: 'pace' },
];

const TITLES: Record<Tab, [string, string]> = {
  trip: ['رحلتي', 'التذاكر · المدن · الفنادق'],
  cal: ['ليالي الرحلة', 'الليلة هي وحدة الحساب'],
  day: ['مخطط اليوم', 'مسار ساعة بساعة'],
  places: ['أماكني', 'مطاعم وأماكن أضفتها'],
  trips: ['رحلاتي', 'الرحلات المحفوظة والنسخ الاحتياطي'],
};

export default function App() {
  const trips = useStore((s) => s.trips);
  const activeId = useStore((s) => s.activeId);
  const ui = useStore((s) => s.ui);
  const setTab = useStore((s) => s.setTab);

  const trip = useMemo(
    () => trips.find((t) => t.id === activeId) ?? trips[0],
    [trips, activeId],
  );

  // أول تشغيل: يثبّت الرحلة النشطة إن لم تكن محفوظة
  useEffect(() => {
    if (!activeId && trips[0]) useStore.setState({ activeId: trips[0].id });
  }, [activeId, trips]);

  const blocks = useMemo(() => (trip ? deriveBlocks(trip.nights) : []), [trip]);
  const total = trip ? nightKeys(trip.nights).length : 0;
  const [title, sub] = TITLES[ui.tab];

  if (!trip) return null;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(90%_50%_at_50%_0%,#f7f8f9_0%,#e4e6e8_100%)] p-0 sm:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white sm:h-[880px] sm:rounded-[40px] sm:shadow-[0_30px_80px_rgba(13,21,26,.18)]">

        {/* رأس ثابت */}
        <header className="flex flex-shrink-0 items-center gap-3 bg-white px-5 pb-2.5 pt-[max(20px,env(safe-area-inset-top))] sm:pt-[26px]">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-11 bg-primary">
            <Icon name="sparkle" size={19} color="#0D151A" />
          </div>
          <div className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-[16px] font-bold leading-tight">{title}</span>
            <span className="truncate text-[11px] font-normal text-muted-3">{sub}</span>
          </div>
          <div className="mr-auto flex flex-none items-center gap-1.5 rounded-20 border border-cream-line bg-cream px-2.5 py-[7px]">
            <span className="num text-[12px] font-bold">{total}</span>
            <span className="text-[10.5px] text-muted">ليلة</span>
          </div>
        </header>

        {/* المحتوى */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
          {ui.tab === 'trip' && <TripScreen trip={trip} blocks={blocks} />}
          {ui.tab === 'cal' && <NightsScreen trip={trip} blocks={blocks} />}
          {ui.tab === 'day' && <DayScreen trip={trip} />}
          {ui.tab === 'places' && <PlacesScreen trip={trip} />}
          {ui.tab === 'trips' && <TripsScreen trips={trips} activeId={activeId} />}
        </main>

        {/* شريط التبويب */}
        <nav className="flex flex-shrink-0 items-center gap-1 border-t border-line-3 bg-white px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
          {TABS.map((t) => {
            const on = ui.tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="flex flex-1 flex-col items-center gap-1 rounded-12 py-1.5 transition"
                style={{ background: on ? '#0D151A' : 'transparent' }}
              >
                <Icon name={t.icon} size={17} color={on ? '#FFEA75' : '#9EA1A4'} />
                <span
                  className="text-[9.5px] font-medium leading-none"
                  style={{ color: on ? '#fff' : '#868A8D' }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>

        <Sheets trip={trip} blocks={blocks} />
        <Toast message={ui.toast} kind={ui.toastKind} />
      </div>
    </div>
  );
}
