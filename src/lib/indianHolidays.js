// src/lib/indianHolidays.js
// Indian Standard Gazetted, National & Public Festive Holidays across Years (2025, 2026, 2027)

export const DEFAULT_INDIAN_HOLIDAYS = [
  // 2025 Planned Calendar
  { date: '2025-01-26', name: 'Republic Day', type: 'gazetted', isNational: true, description: 'National Holiday' },
  { date: '2025-03-14', name: 'Holi', type: 'gazetted', description: 'Festival of Colours' },
  { date: '2025-03-31', name: 'Id-ul-Fitr', type: 'gazetted', description: 'Ramzan Eid' },
  { date: '2025-04-18', name: 'Good Friday', type: 'gazetted', description: 'Good Friday' },
  { date: '2025-08-15', name: 'Independence Day', type: 'gazetted', isNational: true, description: 'National Holiday' },
  { date: '2025-10-02', name: 'Mahatma Gandhi Jayanti', type: 'gazetted', isNational: true, description: 'National Holiday' },
  { date: '2025-10-21', name: 'Dussehra', type: 'gazetted', description: 'Vijayadashami' },
  { date: '2025-11-01', name: 'Diwali', type: 'gazetted', description: 'Deepavali' },
  { date: '2025-12-25', name: 'Christmas', type: 'gazetted', description: 'Christmas Day' },

  // 2026 Planned Calendar
  { date: '2026-01-01', name: "New Year's Day", type: 'restricted', description: 'First day of the Gregorian year' },
  { date: '2026-01-14', name: 'Makar Sankranti / Pongal', type: 'restricted', description: 'Harvest festival' },
  { date: '2026-01-26', name: 'Republic Day', type: 'gazetted', isNational: true, description: 'Enactment of Constitution of India' },
  { date: '2026-02-15', name: 'Maha Shivratri', type: 'gazetted', description: 'Lord Shiva celebration' },
  { date: '2026-03-04', name: 'Holi (Festival of Colours)', type: 'gazetted', description: 'Arrival of spring' },
  { date: '2026-03-20', name: 'Id-ul-Fitr (Ramzan Eid)', type: 'gazetted', description: 'End of Ramadan' },
  { date: '2026-03-31', name: 'Mahavir Jayanti', type: 'gazetted', description: 'Birth anniversary of Lord Mahavira' },
  { date: '2026-04-03', name: 'Good Friday', type: 'gazetted', description: 'Christian holy day' },
  { date: '2026-05-01', name: 'Buddha Purnima / May Day', type: 'gazetted', description: 'Buddha Jayanti & Workers Day' },
  { date: '2026-05-27', name: 'Bakrid / Id-ul-Zuha', type: 'gazetted', description: 'Feast of the Sacrifice' },
  { date: '2026-06-26', name: 'Muharram', type: 'gazetted', description: 'Islamic New Year' },
  { date: '2026-08-15', name: 'Independence Day', type: 'gazetted', isNational: true, description: '79th Independence Day of India' },
  { date: '2026-08-28', name: 'Raksha Bandhan', type: 'restricted', description: 'Bond of siblings' },
  { date: '2026-09-04', name: 'Janmashtami', type: 'gazetted', description: 'Birth of Lord Krishna' },
  { date: '2026-09-14', name: 'Ganesh Chaturthi', type: 'restricted', description: 'Ganesh festival' },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'gazetted', isNational: true, description: 'Father of the Nation' },
  { date: '2026-10-20', name: 'Dussehra (Vijayadashami)', type: 'gazetted', description: 'Victory of good over evil' },
  { date: '2026-11-08', name: 'Diwali (Deepavali / Lakshmi Puja)', type: 'gazetted', description: 'Festival of Lights' },
  { date: '2026-11-09', name: 'Govardhan Puja / Nutan Varsh', type: 'gazetted', description: 'Post-Diwali celebrations' },
  { date: '2026-11-10', name: 'Bhai Dooj', type: 'restricted', description: 'Auspicious festival' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'gazetted', description: 'Guru Nanak Dev Ji Birthday' },
  { date: '2026-12-25', name: 'Christmas', type: 'gazetted', description: 'Celebration of Jesus Christ' },

  // 2027 Planned Calendar (Admin configured for next year)
  { date: '2027-01-01', name: "New Year's Day", type: 'restricted', description: 'New Year 2027' },
  { date: '2027-01-14', name: 'Makar Sankranti / Pongal', type: 'restricted', description: 'Harvest festival' },
  { date: '2027-01-26', name: 'Republic Day', type: 'gazetted', isNational: true, description: 'Republic Day 2027' },
  { date: '2027-03-06', name: 'Maha Shivratri', type: 'gazetted', description: 'Lord Shiva celebration' },
  { date: '2027-03-23', name: 'Holi', type: 'gazetted', description: 'Festival of Colours' },
  { date: '2027-03-10', name: 'Id-ul-Fitr', type: 'gazetted', description: 'Ramzan Eid 2027' },
  { date: '2027-03-26', name: 'Good Friday', type: 'gazetted', description: 'Good Friday' },
  { date: '2027-04-19', name: 'Mahavir Jayanti', type: 'gazetted', description: 'Lord Mahavira Birthday' },
  { date: '2027-05-01', name: 'May Day', type: 'gazetted', description: 'International Workers Day' },
  { date: '2027-05-20', name: 'Buddha Purnima', type: 'gazetted', description: 'Buddha Jayanti' },
  { date: '2027-08-15', name: 'Independence Day', type: 'gazetted', isNational: true, description: '80th Independence Day' },
  { date: '2027-10-02', name: 'Mahatma Gandhi Jayanti', type: 'gazetted', isNational: true, description: 'Gandhi Jayanti' },
  { date: '2027-10-09', name: 'Dussehra', type: 'gazetted', description: 'Vijayadashami' },
  { date: '2027-10-29', name: 'Diwali', type: 'gazetted', description: 'Deepavali 2027' },
  { date: '2027-11-14', name: 'Guru Nanak Jayanti', type: 'gazetted', description: 'Guru Nanak Birthday' },
  { date: '2027-12-25', name: 'Christmas', type: 'gazetted', description: 'Christmas Day' }
];

// In-memory / dynamic planned holidays store
let dynamicHolidaysStore = [...DEFAULT_INDIAN_HOLIDAYS];

/**
 * Get all planned holidays for a specific year or all years
 */
export function getPlannedHolidays(year = null) {
  if (!year) return dynamicHolidaysStore;
  const yearStr = String(year);
  return dynamicHolidaysStore.filter(h => h.date.startsWith(yearStr));
}

/**
 * Check if a given date string (YYYY-MM-DD) is an Indian Holiday
 */
export function getIndianHoliday(dateStr) {
  if (!dateStr) return null;
  const cleanDate = dateStr.slice(0, 10);
  return dynamicHolidaysStore.find(h => h.date === cleanDate) || null;
}

/**
 * Add or update a planned holiday (Admin function for upcoming year planning)
 */
export function savePlannedHoliday(holidayObj) {
  const cleanDate = holidayObj.date.slice(0, 10);
  const idx = dynamicHolidaysStore.findIndex(h => h.date === cleanDate);
  if (idx !== -1) {
    dynamicHolidaysStore[idx] = { ...dynamicHolidaysStore[idx], ...holidayObj };
  } else {
    dynamicHolidaysStore.push({
      date: cleanDate,
      name: holidayObj.name,
      type: holidayObj.type || 'gazetted',
      isNational: !!holidayObj.isNational,
      description: holidayObj.description || 'Corporate Holiday'
    });
    dynamicHolidaysStore.sort((a, b) => a.date.localeCompare(b.date));
  }
  return dynamicHolidaysStore;
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
  const upcoming = dynamicHolidaysStore
    .filter(h => h.date >= refDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming.slice(0, limit);
}
