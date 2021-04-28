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
} from "."
import {lexer} from "./lexer"
import {parser, removeDaysOff} from "./parser"

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
