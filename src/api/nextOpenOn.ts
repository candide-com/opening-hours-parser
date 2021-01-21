import {
  getISODay,
  format,
  setDay,
  addWeeks,
  parse as parseDate,
  addYears,
  closestTo,
} from "date-fns"
import {
  groupSpansByType,
  removeUndefined,
  withinDays,
  withinTimes,
} from "../utils"
import {Options, Schedule, OpeningHours} from "../types"

export default function nextOpenOnFactory(
  schedule: Schedule,
  options?: Options,
): OpeningHours["nextOpenOn"] {
  return function nextOpenOn(date) {
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
            const startDay = parseDate(
              `${seasonSpan.startDay} ${seasonSpan.startTime}`,
              "MM-dd HH:mm",
              date,
            )

            const firstDayOfWeekInSpan = addWeeks(
              setDay(
                startDay,
                seasonSpan.dayOfWeek === 7 ? 0 : seasonSpan.dayOfWeek,
                {weekStartsOn: 1},
              ),
              seasonSpan.dayOfWeek < getISODay(startDay) ? 1 : 0,
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
              date,
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
  }
}
