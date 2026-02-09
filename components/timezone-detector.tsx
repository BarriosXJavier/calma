'use client';

import { useEffect, useState } from 'react';

export function TimezoneDetector() {
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <input type="hidden" name="timezone" value={timezone} />
  );
}
