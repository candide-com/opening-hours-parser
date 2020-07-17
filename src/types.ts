export enum Day {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

export enum Month {
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12,
}

export interface OpenSpan {
  type: "open"
  dayOfWeek: Day
  start: string
  end: string
  startDay?: string
  endDay?: string
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
