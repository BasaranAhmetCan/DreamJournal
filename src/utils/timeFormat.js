export const formatAlarmTime = (timeStr, format) => {
  if (!timeStr) return '';
  if (format === '24h') return timeStr;
  
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return timeStr;
  
  const amampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(displayHour).padStart(2, '0')}:${minStr} ${amampm}`;
};
