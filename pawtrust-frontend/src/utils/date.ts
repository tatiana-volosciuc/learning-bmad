import { format } from 'date-fns'

const getLocale = (): string => localStorage.getItem('pawtrust_lang') ?? 'ro'

/** DD.MM.YYYY — same format for both ro and ru per PRD. */
export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd.MM.yyyy')
}

/** Locale-aware long form, e.g. "23 mar. 2026" (ro) / "23 мар. 2026" (ru). */
export const formatDateLong = (dateString: string): string => {
  const locale = getLocale() === 'ru' ? 'ru-RU' : 'ro-RO'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}
