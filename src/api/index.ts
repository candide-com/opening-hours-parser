import isOpenOnFactory from "./isOpenOn"
import nextOpenOnFactory from "./nextOpenOn"
import {OpeningHours, Schedule, Options} from "../types"
import isOpenOnDateFactory from "./isOpenOnDate"

export const openingHours = (schedule: Schedule, options?: Options) => {
  const openingHours: OpeningHours = {
    isOpenOn: isOpenOnFactory(schedule, options),
    nextOpenOn: nextOpenOnFactory(schedule, options),
    isOpenOnDate: isOpenOnDateFactory(schedule, options),
  }

  return openingHours
}
