import {
  Schedule,
  Options,
  OpeningHours,
  ClosedDateSpan,
  isClosedDateSpan,
  OpenSpan,
  isOpenSpan,
  PublicHoliday,
  isPublicHoliday,
} from "../types"
import {format, getISODay} from "date-fns"
import {withinDays} from "../utils"

export default function isOpenOnDateFactory(
  schedule: Schedule,
  options?: Options,
): OpeningHours["isOpenOnDate"] {
  return function isOpenOnDate(date) {
    const monthAndDay = format(date, "MM-dd")

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
      return holidayRule.isOpen
    }

    if (spans.length === 0) {
      return false
    }

    if (spans.some((span) => withinDays(span, monthAndDay))) {
      return true
    }

    return false
  }
}
