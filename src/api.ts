import {
  Schedule,
  PublicHoliday,
  isPublicHoliday,
  OpenSpan,
  isOpenSpan,
  Options,
  OpeningHours,
} from "./types"
import * as moment from "moment-timezone"

export const openingHours = (schedule: Schedule, options?: Options) => {
  const openingHours: OpeningHours = {
    isOpenOn(date) {
      const mDate =
        options !== undefined && options.timezone !== undefined
          ? moment(date).tz(options.timezone)
          : moment(date)

      const hoursAndMinutes = mDate.format("HH:mm")

      const span = schedule.find(
        (span): span is OpenSpan =>
          isOpenSpan(span) && span.dayOfWeek === mDate.isoWeekday(),
      )

      const holidayRule = schedule.find((span): span is PublicHoliday =>
        isPublicHoliday(span),
      )

      if (
        options !== undefined &&
        options.publicHolidays !== undefined &&
        holidayRule !== undefined &&
        options.publicHolidays.some(
          (holiday) => holiday === mDate.format("YYYY-MM-DD"),
        )
      ) {
        if (holidayRule !== undefined && holidayRule.isOpen === false) {
          return false
        }

        if (
          hoursAndMinutes >= holidayRule.start &&
          hoursAndMinutes <= holidayRule.end
        ) {
          return true
        }
        return false
      }

      if (span === undefined) {
        return false
      }

      if (hoursAndMinutes >= span.start && hoursAndMinutes <= span.end) {
        return true
      }

      return false
    },
  }

  return openingHours
}
