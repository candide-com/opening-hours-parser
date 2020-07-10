import {
  Schedule,
  PublicHoliday,
  isPublicHoliday,
  OpenSpan,
  isOpenSpan,
  Options,
  OpeningHours,
} from "./types"
import {getISODay, format} from "date-fns"

export const openingHours = (schedule: Schedule, options?: Options) => {
  const openingHours: OpeningHours = {
    isOpenOn(date) {
      const hoursAndMinutes = format(date, "HH:mm")

      const span = schedule.find(
        (span): span is OpenSpan =>
          isOpenSpan(span) && span.dayOfWeek === getISODay(date),
      )

      const holidayRule = schedule.find((span): span is PublicHoliday =>
        isPublicHoliday(span),
      )

      if (
        options !== undefined &&
        options.publicHolidays !== undefined &&
        holidayRule !== undefined &&
        options.publicHolidays.some(
          (holiday) => holiday === format(date, "yyyy-MM-dd"),
        )
      ) {
        if (holidayRule !== undefined && holidayRule.isOpen === false) {
          return false
        }

        if (
          hoursAndMinutes >= holidayRule.start &&
          hoursAndMinutes <= holidayRule.end
        ) {
          return true
        }
        return false
      }

      if (span === undefined) {
        return false
      }

      if (hoursAndMinutes >= span.start && hoursAndMinutes <= span.end) {
        return true
      }

      return false
    },
  }

  return openingHours
}
