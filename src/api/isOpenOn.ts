import {
  Schedule,
  PublicHoliday,
  isPublicHoliday,
  OpenSpan,
  isOpenSpan,
  Options,
  ClosedDateSpan,
  isClosedDateSpan,
  OpeningHours,
} from "../types"
import {getISODay} from "date-fns"
import {
  noDaysSpecified,
  withinDays,
  withinTimes,
  optionalUtcToZoned,
  optionalZonedFormat,
} from "../utils"

export default function isOpenOnFactory(
  schedule: Schedule,
  options?: Options,
): OpeningHours["isOpenOn"] {
  const fromUtc = optionalUtcToZoned(options ?? {})
  const format = optionalZonedFormat(options ?? {})

  return function isOpenOn(date) {
    const hoursAndMinutes = format(fromUtc(date), "HH:mm")
    const monthAndDay = format(fromUtc(date), "MM-dd")

    const closedDateSpans = schedule.filter(
      (span): span is ClosedDateSpan =>
        isClosedDateSpan(span) &&
        span.startDay <= monthAndDay &&
        span.endDay >= monthAndDay,
    )

    if (closedDateSpans.length > 0) {
      return false
    }

    const spans = schedule.filter(
      (span): span is OpenSpan =>
        isOpenSpan(span) && span.dayOfWeek === getISODay(fromUtc(date)),
    )

    const holidayRule = schedule.find((span): span is PublicHoliday =>
      isPublicHoliday(span),
    )

    if (
      options !== undefined &&
      options.publicHolidays !== undefined &&
      holidayRule !== undefined &&
      options.publicHolidays.some(
        (holiday) => holiday === format(fromUtc(date), "yyyy-MM-dd"),
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
