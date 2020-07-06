export enum Day {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
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
