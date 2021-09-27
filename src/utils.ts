import {expectSingleResult, expectEOF} from "typescript-parsec"
import {
  ClosedDateSpan,
  isClosedDateSpan,
  isOpenSpan,
  isPublicHoliday,
  OpenSeasonSpan,
  OpenSpan,
  PublicHoliday,
  Schedule,
  Options,
} from "."
import {lexer} from "./lexer"
import {parser, removeDaysOff} from "./parser"
import {Day} from "./types"
import {
  addWeeks,
  getYear,
  setYear,
  parse as parseDate,
  setDay as setDayDateFns,
} from "date-fns"
import {zonedTimeToUtc, utcToZonedTime, format} from "date-fns-tz"

export const removeUndefined = <T>(array: Array<T | undefined>): Array<T> =>
  array.filter((n): n is T => n !== undefined)

export const fillLeftTuple = <T, X>(arr: Array<[T, X]>): Array<[T, X]> => {
  return arr.reduce<Array<[T, X]>>((memo, item) => {
    if (memo.length === 0) {
      return [item]
    }

    if (item[0] === undefined) {
      const prevT = memo[memo.length - 1][0]
      return [...memo, [prevT, item[1]]]
    }

    return [...memo, item]
  }, [])
}

export const parse = (pattern: string): Schedule => {
  if (pattern.trim() === "") {
    return []
  }

  return removeDaysOff(
    expectSingleResult(expectEOF(parser.parse(lexer.parse(pattern)))),
  )
}

export const withinDays = (
  span: OpenSpan | ClosedDateSpan,
  monthAndDay: string,
) =>
  (span.startDay !== undefined &&
    span.endDay !== undefined &&
    monthAndDay >= span.startDay &&
    monthAndDay <= span.endDay) ||
  (span.startDay !== undefined &&
    span.endDay !== undefined &&
    span.endDay < span.startDay &&
    (monthAndDay >= span.startDay || monthAndDay <= span.endDay))

export const withinTimes = (span: OpenSpan, hoursAndMinutes: string) =>
  hoursAndMinutes >= span.startTime && hoursAndMinutes <= span.endTime

export const isBeforeClosing = (span: OpenSpan, hoursAndMinutes: string) =>
  hoursAndMinutes <= span.endTime

export const noDaysSpecified = (span: OpenSpan) =>
  span.startDay === undefined && span.endDay === undefined

export const groupSpansByType = (schedule: Schedule) =>
  schedule.reduce<{
    daySpans: Array<OpenSpan>
    seasonSpans: Array<OpenSeasonSpan>
    closedSpans: Array<ClosedDateSpan>
    publicHolidays: Array<PublicHoliday>
  }>(
    (possibleSpans, span) => {
      let spanType:
        | "daySpans"
        | "seasonSpans"
        | "closedSpans"
        | "publicHolidays" = "closedSpans"

      if (isPublicHoliday(span)) {
        spanType = "publicHolidays"
      }
      if (isClosedDateSpan(span)) {
        spanType = "closedSpans"
      }
      if (isOpenSpan(span)) {
        spanType = noDaysSpecified(span) ? "daySpans" : "seasonSpans"
      }

      return {
        ...possibleSpans,
        [spanType]: [...possibleSpans[spanType], span],
      }
    },
    {daySpans: [], seasonSpans: [], closedSpans: [], publicHolidays: []},
  )

export const allDatesOfASpecificDayOfWeekBetween = (
  startDate: Date,
  endDate: Date,
): Array<Date> => {
  const days = [startDate]

  while (addWeeks(days[days.length - 1], 1) < endDate) {
    days.push(addWeeks(days[days.length - 1], 1))
  }

  return days
}

export const optionalZonedToUtc = (options: Options) => (date: Date) =>
  options.timezone !== undefined ? zonedTimeToUtc(date, options.timezone) : date

export const optionalUtcToZoned = (options: Options) => (date: Date) =>
  options.timezone !== undefined ? utcToZonedTime(date, options.timezone) : date

export const optionalZonedFormat = (options: Options) => (
  date: Date,
  pattern: string,
) =>
  options.timezone !== undefined
    ? format(date, pattern, {timeZone: options.timezone})
    : format(date, pattern)

export const optionalEndOfSeason = (options: Options) => (
  span: OpenSeasonSpan,
  date: Date,
): Date => {
  const toUtc = optionalZonedToUtc(options)

  const currentYear = getYear(date)
  const year = span.startDay > span.endDay ? currentYear + 1 : currentYear
  const endDate = setYear(new Date(span.endDay), year)

  return toUtc(
    parseDate(span.endTime.replace("24:00", "23:59"), "HH:mm", endDate),
  )
}

export const optionalStartOfSeason = (options: Options) => (
  span: OpenSeasonSpan,
  date: Date,
): Date =>
  optionalZonedToUtc(options)(
    parseDate(`${span.startDay} ${span.startTime}`, "MM-dd HH:mm", date),
  )

export const optionalStartOfDay = (options: Options) => (
  span: OpenSpan,
  date: Date,
): Date => optionalZonedToUtc(options)(parseDate(span.startTime, "HH:mm", date))

export function setDay(date: Date, dayOfWeek: Day): Date {
  return setDayDateFns(date, dayOfWeek === 7 ? 0 : dayOfWeek, {weekStartsOn: 1})
}
