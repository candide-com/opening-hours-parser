/* eslint-disable @typescript-eslint/camelcase */

import {startOfDay, endOfDay} from "date-fns"
import {OpeningHours, Options} from "./types"
import {opening_hours} from "opening_hours"
const OpeningHours = require("opening_hours") as typeof opening_hours

export const openingHours = (input: string, options?: Options) => {
  const ohOptions =
    options?.countryCode !== undefined
      ? {
          lat: 0,
          lon: 0,
          // TODO put correct information here
          address: {country_code: options?.countryCode, state: "England"},
        }
      : undefined

  const oh = new OpeningHours(input, ohOptions)

  const openingHours: OpeningHours = {
    isOpenOn(date) {
      return oh.getState(date)
    },

    isOpenOnDate(date) {
      const start = startOfDay(date)
      const end = endOfDay(date)

      const [openDuration] = oh.getOpenDuration(start, end)

      return openDuration > 0
    },

    nextOpenOn(date) {
      const iterator = oh.getIterator(date)

      do {
        if (iterator.getState()) {
          return iterator.getDate()
        }
      } while (iterator.advance())

      return null
    },
  }

  return openingHours
}
