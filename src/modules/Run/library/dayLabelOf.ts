function keyOf(day: Date): string {
  return [
    String(day.getFullYear()),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0'),
  ].join('-');
}

/** A day, YYYY-MM-DD, the way a list says when something happened: today, yesterday, or its date, with the year only when it is not this one; nothing for no day. */
export function dayLabelOf(props: {
  day: string | null;
  now: Date;
  language: string;
  words: { today: string; yesterday: string };
}): string {
  const { day, now } = props;

  if (day === null) return '';

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (day === keyOf(now)) return props.words.today;
  if (day === keyOf(yesterday)) return props.words.yesterday;

  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);

  return new Intl.DateTimeFormat(props.language, {
    day: '2-digit',
    month: '2-digit',
    ...(year === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(new Date(year, month - 1, date));
}
