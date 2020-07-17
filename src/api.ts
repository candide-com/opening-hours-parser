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
      const monthAndDay = format(date, "MM-dd")

      const spans = schedule.filter(
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
          hoursAndMinutes >= holidayRule.startTime &&
          hoursAndMinutes <= holidayRule.endTime
        ) {
          return true
        }
        return false
      }

      if (spans.length === 0) {
        return false
      }

      const withinTimes = (span: OpenSpan) =>
        hoursAndMinutes >= span.startTime && hoursAndMinutes <= span.endTime

      const withinDays = (span: OpenSpan) =>
        span.startDay !== undefined &&
        span.endDay !== undefined &&
        monthAndDay >= span.startDay &&
        monthAndDay <= span.endDay

      const noDaysSpecified = (span: OpenSpan) =>
        span.startDay === undefined && span.endDay === undefined

      if (
        spans.some(
          (span) =>
            (withinTimes(span) && noDaysSpecified(span)) ||
            (withinTimes(span) && withinDays(span)),
        )
      ) {
        return true
      }

      return false
    },
  }

  return openingHours
}
