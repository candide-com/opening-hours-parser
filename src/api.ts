import {
  Schedule,
  PublicHoliday,
  isPublicHoliday,
  OpenSpan,
  isOpenSpan,
  Options,
  OpeningHours,
  ClosedDateSpan,
  isClosedDateSpan,
  OpenSeasonSpan,
} from "./types"
import {
  getISODay,
  format,
  setDay,
  addWeeks,
  closestTo,
  parse as parseDate,
  addYears,
} from "date-fns"
import {expectSingleResult, expectEOF} from "typescript-parsec"
import {lexer} from "./lexer"
import {removeDaysOff, parser} from "./parser"

const removeUndefined = <T>(array: Array<T | undefined>): Array<T> =>
  array.filter((n): n is T => n !== undefined)

export const parse = (pattern: string): Schedule => {
  if (pattern.trim() === "") {
    return []
  }

  return removeDaysOff(
    expectSingleResult(expectEOF(parser.parse(lexer.parse(pattern)))),
  )
}

const withinDays = (span: OpenSpan | ClosedDateSpan, monthAndDay: string) =>
  (span.startDay !== undefined &&
    span.endDay !== undefined &&
    monthAndDay >= span.startDay &&
    monthAndDay <= span.endDay) ||
  (span.startDay !== undefined &&
    span.endDay !== undefined &&
    span.endDay < span.startDay &&
    (monthAndDay >= span.startDay || monthAndDay <= span.endDay))

const withinTimes = (span: OpenSpan, hoursAndMinutes: string) =>
  hoursAndMinutes >= span.startTime && hoursAndMinutes <= span.endTime

const noDaysSpecified = (span: OpenSpan) =>
  span.startDay === undefined && span.endDay === undefined

const groupSpansByType = (schedule: Schedule) =>
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

export const openingHours = (schedule: Schedule, options?: Options) => {
  const openingHours: OpeningHours = {
    isOpenOn(date) {
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
            (withinTimes(span, hoursAndMinutes) &&
              withinDays(span, monthAndDay)),
        )
      ) {
        return true
      }

      return false
    },
    nextOpenOn(date) {
      // Open times are not guaranteed correct if spans contradict each other
      const hoursAndMinutes = format(date, "HH:mm")
      const monthAndDay = format(date, "MM-dd")
      const dayOfWeek = getISODay(date)

      const {
        daySpans,
        seasonSpans,
        closedSpans,
        publicHolidays,
      } = groupSpansByType(schedule)

      let potentialDates: Array<Date> = []

      // Consider weekday spans
      if (daySpans.length > 0) {
        potentialDates = daySpans.map((daySpan) => {
          if (
            daySpan.dayOfWeek === dayOfWeek &&
            withinTimes(daySpan, hoursAndMinutes)
          ) {
            // Potential date is today
            return date
          }
          if (daySpan.dayOfWeek > dayOfWeek) {
            // Potential date is later this week
            return parseDate(
              daySpan.startTime,
              "HH:mm",
              setDay(date, daySpan.dayOfWeek),
            )
          }
          // Potential date is next week
          return parseDate(
            daySpan.startTime,
            "HH:mm",
            addWeeks(setDay(date, daySpan.dayOfWeek), 1),
          )
        })
      }

      // Consider seasonal spans
      if (seasonSpans.length > 0) {
        potentialDates = [
          ...potentialDates,
          ...removeUndefined(
            seasonSpans.map((seasonSpan) => {
              const firstDayOfWeekInSpan = addWeeks(
                setDay(
                  parseDate(
                    `${seasonSpan.startDay} ${seasonSpan.startTime}`,
                    "MM-dd HH:mm",
                    new Date(),
                  ),
                  seasonSpan.dayOfWeek,
                ),
                seasonSpan.dayOfWeek < dayOfWeek ? 1 : 0,
              )

              if (format(firstDayOfWeekInSpan, "MM-dd") > seasonSpan.endDay) {
                return undefined
              }

              if (withinDays(seasonSpan, monthAndDay)) {
                if (
                  seasonSpan.dayOfWeek === dayOfWeek &&
                  withinTimes(seasonSpan, hoursAndMinutes)
                ) {
                  // Potential date is today
                  return date
                }
                if (seasonSpan.dayOfWeek > dayOfWeek) {
                  // Potential date is later this week
                  const nextDate = setDay(date, seasonSpan.dayOfWeek)
                  const nextMonthAndDay = format(nextDate, "MM-dd")
                  if (nextMonthAndDay <= seasonSpan.endDay) {
                    return parseDate(seasonSpan.startTime, "HH:mm", nextDate)
                  }
                }
                // Potential date is next week
                const nextDate = addWeeks(date, 1)
                const nextMonthAndDay = format(nextDate, "MM-dd")
                if (nextMonthAndDay <= seasonSpan.endDay) {
                  return parseDate(seasonSpan.startTime, "HH:mm", nextDate)
                }
              }
              if (seasonSpan.startDay > monthAndDay) {
                // Potential date is the first instance of this day of the week in the season this year
                return firstDayOfWeekInSpan
              }
              // Potential date is the first instance of this day of the week in the season next year
              return addYears(firstDayOfWeekInSpan, 1)
            }),
          ),
        ]
      }

      // Consider closed spans
      potentialDates = potentialDates.filter((potentialDate) => {
        return (
          closedSpans.length === 0 ||
          !closedSpans.some((closedSpan) =>
            withinDays(closedSpan, format(potentialDate, "MM-dd")),
          )
        )
      })

      // Consider holidays
      if (options?.publicHolidays !== undefined && publicHolidays.length > 0) {
        const publicHoliday = publicHolidays[0]
        if (publicHoliday.isOpen) {
          potentialDates = [
            ...potentialDates,
            ...options.publicHolidays.map((holiday) =>
              parseDate(
                `${holiday} ${publicHoliday.startTime}`,
                "yyyy-MM-dd HH:mm",
                new Date(),
              ),
            ),
          ]
        } else {
          potentialDates = potentialDates.filter((potentialDate) => {
            return !options.publicHolidays?.some(
              (publicHolidayDate) =>
                format(potentialDate, "yyy-MM-dd") === publicHolidayDate,
            )
          })
        }
      }

      if (potentialDates.length === 0) {
        return null
      }

      return closestTo(date, potentialDates)
    },
  }

  return openingHours
}
