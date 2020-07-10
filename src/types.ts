export enum Day {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

export interface OpenSpan {
  type: "open"
  dayOfWeek: Day
  start: string
  end: string
}

export type PublicHoliday = {
  type: "publicHoliday"
} & (
  | {
      isOpen: true
      start: string
      end: string
    }
  | {
      isOpen: false
    }
)

export type Schedule = Array<OpenSpan | PublicHoliday>

export const isPublicHoliday = (
  span: OpenSpan | PublicHoliday,
): span is PublicHoliday => (span as PublicHoliday).type === "publicHoliday"

export const isOpenSpan = (span: OpenSpan | PublicHoliday): span is OpenSpan =>
  (span as OpenSpan).type === "open"

export interface Options {
  publicHolidays?: Array<string>
}

export interface OpeningHours {
  isOpenOn(date: Date): boolean
}
