/**
 * Convert 24-hour format time to 12-hour format with AM/PM
 * @param {string} time - Time in 24-hour format (HH:mm)
 * @returns {string} Time in 12-hour format (hh:mm AM/PM)
 */
export const convertTo12Hour = (time) => {
  if (!time) return '';

  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, '0')}:${minutes} ${meridiem}`;
  } catch (error) {
    console.error('Error converting time to 12-hour format:', error);
    return '';
  }
};

/**
 * Convert 12-hour format time with AM/PM to 24-hour format
 * @param {string} time - Time in 12-hour format (hh:mm AM/PM)
 * @returns {string} Time in 24-hour format (HH:mm)
 */
export const convertTo24Hour = (time) => {
  if (!time) return '';

  try {
    const timeRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i;
    const match = time.match(timeRegex);

    if (!match) {
      return '';
    }

    let [, hours, minutes, meridiem] = match;
    let hour = parseInt(hours, 10);

    if (meridiem.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (meridiem.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error converting time to 24-hour format:', error);
    return '';
  }
};

/**
 * Validate if a time string is in valid 12-hour format
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidTimeFormat = (time) => {
  if (!time) return true; // Empty is valid since timeOfBirth is optional

  const timeRegex = /^(0?[0-9]|1[0-2]):([0-5][0-9])\s(AM|PM)$/i;
  return timeRegex.test(time);
};

/**
 * Build 12-hour time string from dropdown values
 * @param {string} hours - Hours value (1-12, padded with leading 0)
 * @param {string} minutes - Minutes value (0-59, padded with leading 0)
 * @param {string} meridiem - AM or PM
 * @returns {string} Time in 12-hour format (HH:MM AM/PM) or empty string if any value is missing
 */
export const buildTimeFromDropdowns = (hours, minutes, meridiem) => {
  if (!hours || !minutes || !meridiem) return '';
  return `${hours}:${minutes} ${meridiem}`;
};

/**
 * Parse 24-hour time string to dropdown values
 * @param {string} timeString - Time in 24-hour format (HH:mm)
 * @returns {Object} Object with hours, minutes, meridiem properties or empty object if invalid
 */
export const parseTimeToDropdowns = (timeString) => {
  if (!timeString) return { hours: '', minutes: '', meridiem: '' };

  try {
    const [hours24, minutes] = timeString.split(':');
    const hour24 = parseInt(hours24, 10);

    // Convert 24-hour to 12-hour format
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12; // 0 hour becomes 12 in 12-hour format

    return {
      hours: hour12.toString().padStart(2, '0'),
      minutes: (minutes || '00').padStart(2, '0'),
      meridiem,
    };
  } catch (error) {
    console.error('Error parsing time to dropdowns:', error);
    return { hours: '', minutes: '', meridiem: '' };
  }
};

/**
 * Format time input from user with proper spacing and case
 * @param {string} value - Raw input value
 * @returns {string} Formatted time or empty string
 */
export const formatTimeInput = (value) => {
  if (!value) return '';

  // Remove all non-digit and non-colon characters except AM/PM
  let cleaned = value.replace(/[^\d:APMpm]/g, '').toUpperCase();

  // Handle basic HH:MM format input
  if (cleaned.includes(':')) {
    const [hours, rest] = cleaned.split(':');
    const minutes = rest ? rest.substring(0, 2) : '';
    cleaned = `${hours}:${minutes}`;
  } else if (cleaned.length > 0) {
    // Auto-format as user types (e.g., "0730" -> "07:30")
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length === 3) {
      return `${cleaned.substring(0, 1)}:${cleaned.substring(1)}`;
    } else if (cleaned.length === 4) {
      return `${cleaned.substring(0, 2)}:${cleaned.substring(2)}`;
    }
  }

  return cleaned;
};
