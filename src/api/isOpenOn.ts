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

const yearSpecified = (s: OpenSpan) =>
  s.startYear !== undefined || s.endYear !== undefined

const daysSpecified = (s: OpenSpan | ClosedDateSpan) =>
  s.startDay !== undefined || s.endDay !== undefined

const isMostSpecific = (span: OpenSpan, spans: Array<OpenSpan>) => {
  if (spans.length === 0) {
    return true
  }
  if (yearSpecified(span) && !spans.some(yearSpecified)) {
    return true
  }
  if (
    daysSpecified(span) &&
    !spans.some(daysSpecified) &&
    !spans.some(yearSpecified)
  ) {
    return true
  }
  return false
}

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

    const {isOpen} = spans.reverse().reduce<{
      isOpen?: boolean
      checkedSpans: Array<OpenSpan>
    }>(
      ({isOpen, checkedSpans}, span) => {
        if (isOpen !== undefined) {
          return {isOpen, checkedSpans}
        }

        if (checkedSpans.length > 0 && isMostSpecific(span, checkedSpans)) {
          return {isOpen, checkedSpans: [...checkedSpans, span]}
        }

        if (
          withinYears(span, year) &&
          withinDays(span, monthAndDay) &&
          withinTimes(span, hoursAndMinutes)
        ) {
          return {isOpen: true, checkedSpans}
        }

        if (
          yearSpecified(span) &&
          withinYears(span, year) &&
          withinDays(span, monthAndDay)
        ) {
          return {isOpen: false, checkedSpans}
        }

        return {isOpen, checkedSpans: [...checkedSpans, span]}
      },
      {isOpen: undefined, checkedSpans: []},
    )

    return isOpen === undefined ? false : isOpen
  }
}
