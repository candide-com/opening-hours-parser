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
  isBeforeClosing,
  allDatesOfASpecificDayOfWeekBetween,
  startOfDay,
  startOfSeason,
  endOfSeason,
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
      potentialDates = daySpans.flatMap((daySpan) => {
        if (
          daySpan.dayOfWeek === dayOfWeek &&
          isBeforeClosing(daySpan, hoursAndMinutes)
        ) {
          // Potential date is today
          const datesToEndOfSeason = allDatesOfASpecificDayOfWeekBetween(
            addWeeks(startOfDay(daySpan, date), 1),
            addYears(date, 1),
          )

          return hoursAndMinutes > daySpan.startTime
            ? [date, ...datesToEndOfSeason]
            : [startOfDay(daySpan, date), ...datesToEndOfSeason]
        }

        if (daySpan.dayOfWeek > dayOfWeek) {
          // Potential date is later this week
          return allDatesOfASpecificDayOfWeekBetween(
            startOfDay(daySpan, setDay(date, daySpan.dayOfWeek)),
            addYears(date, 1),
          )
        }

        // Potential date is next week
        return allDatesOfASpecificDayOfWeekBetween(
          startOfDay(daySpan, addWeeks(setDay(date, daySpan.dayOfWeek), 1)),
          addYears(date, 1),
        )
      })
    }

    // Consider seasonal spans
    if (seasonSpans.length > 0) {
      potentialDates = [
        ...potentialDates,
        ...removeUndefined(
          seasonSpans.flatMap((seasonSpan) => {
            const startDay = startOfSeason(seasonSpan, date)

            const firstDayOfWeekInSpan = addWeeks(
              setDay(
                startDay,
                seasonSpan.dayOfWeek === 7 ? 0 : seasonSpan.dayOfWeek,
                {weekStartsOn: 1},
              ),
              seasonSpan.dayOfWeek < getISODay(startDay) ? 1 : 0,
            )

            if (format(firstDayOfWeekInSpan, "MM-dd") > seasonSpan.endDay) {
              return [undefined]
            }

            if (withinDays(seasonSpan, monthAndDay)) {
              if (
                seasonSpan.dayOfWeek === dayOfWeek &&
                isBeforeClosing(seasonSpan, hoursAndMinutes)
              ) {
                // Potential date is today
                const datesToEndOfSeason = allDatesOfASpecificDayOfWeekBetween(
                  addWeeks(startOfDay(seasonSpan, date), 1),
                  endOfSeason(seasonSpan, date),
                )

                return hoursAndMinutes > seasonSpan.startTime
                  ? [date, ...datesToEndOfSeason]
                  : [startOfDay(seasonSpan, date), ...datesToEndOfSeason]
              }

              if (seasonSpan.dayOfWeek > dayOfWeek) {
                // Potential date is later this week
                const nextDate = setDay(date, seasonSpan.dayOfWeek)
                const nextMonthAndDay = format(nextDate, "MM-dd")

                if (nextMonthAndDay <= seasonSpan.endDay) {
                  return allDatesOfASpecificDayOfWeekBetween(
                    startOfDay(seasonSpan, nextDate),
                    endOfSeason(seasonSpan, date),
                  )
                }
              }

              // Potential date is next week
              const nextDate = addWeeks(setDay(date, seasonSpan.dayOfWeek), 1)

              const nextMonthAndDay = format(nextDate, "MM-dd")

              if (nextMonthAndDay <= seasonSpan.endDay) {
                return allDatesOfASpecificDayOfWeekBetween(
                  startOfDay(seasonSpan, nextDate),
                  endOfSeason(seasonSpan, date),
                )
              }
            }

            if (seasonSpan.startDay > monthAndDay) {
              // Potential date is the first instance of this day of the week in the
              // season this year
              return [firstDayOfWeekInSpan]
            }

            // Potential date is the first instance of this day of the week in the
            // season next year
            return [addYears(firstDayOfWeekInSpan, 1)]
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
      const todayDate = format(date, "yyyy-MM-dd")
      const futurePublicHolidays = options.publicHolidays.filter(
        (ph) => ph >= todayDate,
      )

      if (publicHoliday.isOpen) {
        potentialDates = [
          ...potentialDates,
          ...futurePublicHolidays.map((holiday) =>
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
