import {
  Schedule,
  PublicHoliday,
  isPublicHoliday,
  OpenSpan,
  isOpenSpan,
  Options,
  ClosedDateSpan,
  isClosedDateSpan,
} from "../types"
import {getISODay, format} from "date-fns"
import {noDaysSpecified, withinDays, withinTimes} from "../utils"

export default function isOpenOnFactory(schedule: Schedule, options?: Options) {
  return function isOpenOn(date: Date) {
    const hoursAndMinutes = format(date, "HH:mm")
    const monthAndDay = format(date, "MM-dd")

    const closedDateSpans = schedule.filter(
      (span): span is ClosedDateSpan =>
        isClosedDateSpan(span) &&
        span.startDay >= monthAndDay &&
        span.endDay <= monthAndDay,
    )

    if (closedDateSpans.length > 0) {
      return false
    }

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

    if (
      spans.some(
        (span) =>
          (withinTimes(span, hoursAndMinutes) && noDaysSpecified(span)) ||
          (withinTimes(span, hoursAndMinutes) && withinDays(span, monthAndDay)),
      )
    ) {
      return true
    }

    return false
  }
}
