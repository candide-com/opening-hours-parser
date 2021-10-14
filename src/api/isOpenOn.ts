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
  withinDays,
  withinTimes,
  optionalUtcToZoned,
  optionalZonedFormat,
  withinYears,
} from "../utils"

export default function isOpenOnFactory(
  schedule: Schedule,
  options?: Options,
): OpeningHours["isOpenOn"] {
  const fromUtc = optionalUtcToZoned(options ?? {})
  const format = optionalZonedFormat(options ?? {})

  return function isOpenOn(date) {
    const year = parseInt(format(fromUtc(date), "yyyy"), 10)
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

    // const spansMatchingYearAndDay = spans.filter(
    //   (span) => withinYears(span, year) && withinDays(span, monthAndDay),
    // )

    // const lastSpan = spansMatchingYearAndDay[spansMatchingYearAndDay.length - 1]

    // return !!lastSpan && withinTimes(lastSpan, hoursAndMinutes)

    if (
      spans.some(
        (span) =>
          withinYears(span, year) &&
          withinDays(span, monthAndDay) &&
          withinTimes(span, hoursAndMinutes),
      )
    ) {
      return true
    }

    return false
  }
}
