export const dateToTimestamp = (date: Date): string => {
  return [
    date.getFullYear(), // YYYY
    ('0' + (date.getMonth() + 1)).slice(-2), // MM
    ('0' + date.getDate()).slice(-2), // DD
    ('0' + date.getHours()).slice(-2), // HH
    ('0' + date.getMinutes()).slice(-2), // mm
  ].join('');
};
