import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DayDetailScreen } from '../../components/DayDetailScreen';

export default function DayRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();

  // Use today if date parsing fails or is missing
  let dateObj = new Date();
  if (date) {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  return <DayDetailScreen dateObj={dateObj} />;
}
