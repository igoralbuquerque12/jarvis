const FALLBACK_TIMEZONES = [
  'America/Sao_Paulo',
  'America/Bahia',
  'America/Fortaleza',
  'America/Recife',
  'America/Belem',
  'America/Manaus',
  'America/Cuiaba',
  'America/Campo_Grande',
  'America/Boa_Vista',
  'America/Porto_Velho',
  'America/Rio_Branco',
  'America/Noronha',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

export function listTimezones(current: string): string[] {
  const supported =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : FALLBACK_TIMEZONES;

  const zones = new Set(supported);
  zones.add(current);

  return [...zones].sort((a, b) => a.localeCompare(b));
}
