// src/lib/indianHolidays.js
// Indian Standard Gazetted, National & Public Festive Holidays (2026)

export const INDIAN_HOLIDAYS_2026 = [
  {
    date: '2026-01-01',
    name: "New Year's Day",
    type: 'restricted',
    description: 'First day of the Gregorian year'
  },
  {
    date: '2026-01-14',
    name: 'Makar Sankranti / Pongal',
    type: 'restricted',
    description: 'Harvest festival celebrated across India'
  },
  {
    date: '2026-01-26',
    name: 'Republic Day',
    type: 'gazetted',
    isNational: true,
    description: 'Celebrates the enactment of the Constitution of India'
  },
  {
    date: '2026-02-15',
    name: 'Maha Shivratri',
    type: 'gazetted',
    description: 'Celebration of Lord Shiva'
  },
  {
    date: '2026-03-04',
    name: 'Holi (Festival of Colours)',
    type: 'gazetted',
    description: 'Celebration of colours and the arrival of spring'
  },
  {
    date: '2026-03-20',
    name: 'Id-ul-Fitr (Ramzan Eid)',
    type: 'gazetted',
    description: 'Islamic festival marking the end of Ramadan'
  },
  {
    date: '2026-03-31',
    name: 'Mahavir Jayanti',
    type: 'gazetted',
    description: 'Birth anniversary of Lord Mahavira'
  },
  {
    date: '2026-04-03',
    name: 'Good Friday',
    type: 'gazetted',
    description: 'Christian holy day commemorating the crucifixion'
  },
  {
    date: '2026-05-01',
    name: 'Buddha Purnima / May Day',
    type: 'gazetted',
    description: 'Birth anniversary of Gautama Buddha and International Workers Day'
  },
  {
    date: '2026-05-27',
    name: 'Bakrid / Id-ul-Zuha',
    type: 'gazetted',
    description: 'Feast of the Sacrifice'
  },
  {
    date: '2026-06-26',
    name: 'Muharram',
    type: 'gazetted',
    description: 'First month of the Islamic calendar'
  },
  {
    date: '2026-08-15',
    name: 'Independence Day',
    type: 'gazetted',
    isNational: true,
    description: '79th Independence Day of India'
  },
  {
    date: '2026-08-28',
    name: 'Raksha Bandhan',
    type: 'restricted',
    description: 'Celebration of bond between siblings'
  },
  {
    date: '2026-09-04',
    name: 'Janmashtami',
    type: 'gazetted',
    description: 'Birth of Lord Krishna'
  },
  {
    date: '2026-09-14',
    name: 'Ganesh Chaturthi',
    type: 'restricted',
    description: 'Arrival of Lord Ganesha'
  },
  {
    date: '2026-10-02',
    name: 'Mahatma Gandhi Jayanti',
    type: 'gazetted',
    isNational: true,
    description: 'Birth anniversary of the Father of the Nation'
  },
  {
    date: '2026-10-20',
    name: 'Dussehra (Vijayadashami)',
    type: 'gazetted',
    description: 'Victory of good over evil'
  },
  {
    date: '2026-11-08',
    name: 'Diwali (Deepavali / Lakshmi Puja)',
    type: 'gazetted',
    description: 'Festival of Lights'
  },
  {
    date: '2026-11-09',
    name: 'Govardhan Puja / Nutan Varsh',
    type: 'gazetted',
    description: 'Post-Diwali celebrations and New Year'
  },
  {
    date: '2026-11-10',
    name: 'Bhai Dooj',
    type: 'restricted',
    description: 'Brother-sister auspicious festival'
  },
  {
    date: '2026-11-24',
    name: 'Guru Nanak Jayanti',
    type: 'gazetted',
    description: 'Birth anniversary of Guru Nanak Dev Ji'
  },
  {
    date: '2026-12-25',
    name: 'Christmas',
    type: 'gazetted',
    description: 'Celebration of the birth of Jesus Christ'
  }
];

/**
 * Check if a given date string (YYYY-MM-DD) is an Indian Holiday
 */
export function getIndianHoliday(dateStr) {
  if (!dateStr) return null;
  const cleanDate = dateStr.slice(0, 10);
  return INDIAN_HOLIDAYS_2026.find(h => h.date === cleanDate) || null;
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 */
export function isWeekend(dateObjOrStr) {
  const d = typeof dateObjOrStr === 'string' ? new Date(dateObjOrStr) : dateObjOrStr;
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get upcoming Indian holidays from a given reference date
 */
export function getUpcomingIndianHolidays(fromDate = new Date(), limit = 3) {
  const refDateStr = typeof fromDate === 'string' ? fromDate.slice(0, 10) : fromDate.toISOString().split('T')[0];
  const upcoming = INDIAN_HOLIDAYS_2026
    .filter(h => h.date >= refDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming.slice(0, limit);
}
