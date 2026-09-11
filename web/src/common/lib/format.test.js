import { formatDueDate } from './format';

test('calendar due dates retain their day regardless of the browser timezone', () => {
  expect(formatDueDate('2026-09-17')).toBe(formatDueDate('2026-09-17T00:00:00Z'));
  expect(formatDueDate('2026-09-17')).toContain('17');
});
