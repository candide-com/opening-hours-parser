export interface Options {
  countryCode?: string
  timezone?: string
}

export interface OpeningHours {
  isOpenOn(date: Date): boolean
  isOpenOnDate(date: Date): boolean
  nextOpenOn(date: Date): Date | null
}
