/* eslint-disable @typescript-eslint/camelcase */

import {OpeningHours, Options} from "./types"
import {opening_hours} from "opening_hours"
const OpeningHours = require("opening_hours") as typeof opening_hours
import {DateTime} from "ts-luxon"

function getServerTimeZone(): string {
  return DateTime.local().zoneName ?? "Europe/London"
}

function utcToFakeLocalDate(options: Options | undefined, date: Date): Date {
  if (options === undefined) {
    return date
  }

  if (options.timezone === undefined) {
    return date
  }

  const businessTime = DateTime.fromJSDate(date)
    .setZone(options.timezone)
    .toISO()

  const fakeTime = DateTime.fromJSDate(date)
    .setZone(getServerTimeZone())
    .toISO()

  if (businessTime === null) {
    throw new Error("Invalid date")
  }

  if (fakeTime === null) {
    throw new Error("Invalid date")
  }

  const businessOffset = businessTime.slice(-6)

  const realTime = fakeTime.slice(0, -6) + businessOffset

  return new Date(realTime)
}

function fakeLocalDateToUtc(options: Options | undefined, date: Date): Date {
  if (options === undefined) {
    return date
  }

  if (options.timezone === undefined) {
    return date
  }

  const businessTime = DateTime.fromJSDate(date)
    .setZone(options.timezone)
    .toISO()

  const serverTime = DateTime.fromJSDate(date)
    .setZone(getServerTimeZone())
    .toISO()

  if (businessTime === null) {
    throw new Error("Invalid date")
  }

  if (serverTime === null) {
    throw new Error("Invalid date")
  }

  const serverOffset = serverTime.slice(-6)

  const fakeLocalTime = businessTime.slice(0, -6) + serverOffset

  return new Date(fakeLocalTime)
}

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
      return oh.getState(utcToFakeLocalDate(options, date))
    },

    isOpenOnDate(date) {
      const lDate = DateTime.fromJSDate(utcToFakeLocalDate(options, date))

      const start = lDate.startOf("day").toJSDate()
      const end = lDate.endOf("day").toJSDate()

      const [openDuration] = oh.getOpenDuration(start, end)

      return openDuration > 0
    },

    nextOpenOn(date) {
      const iterator = oh.getIterator(utcToFakeLocalDate(options, date))

      do {
        if (iterator.getState()) {
          const returnDate = iterator.getDate()
          return fakeLocalDateToUtc(options, returnDate)
        }
      } while (iterator.advance())

      return null
    },
  }

  return openingHours
}
