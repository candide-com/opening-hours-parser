import {expect} from "chai"
import {
  allDatesOfASpecificDayOfWeekBetween,
  optionalEndOfSeason,
  optionalStartOfDay,
  optionalStartOfSeason,
} from "../utils"

const DEFAULT_TIMEZONE = "Europe/London"

describe("allDatesOfASpecificDayOfWeekBetween", () => {
  context("season ends in July, current date is Monday", () => {
    it("returns all Mondays in July", () => {
      expect(
        allDatesOfASpecificDayOfWeekBetween(
          new Date("2021-07-05T12:00:00.000Z"),
          new Date("2021-07-31T12:00:00.000Z"),
        ),
      ).to.eql([
        new Date("2021-07-05T12:00:00.000Z"),
        new Date("2021-07-12T12:00:00.000Z"),
        new Date("2021-07-19T12:00:00.000Z"),
        new Date("2021-07-26T12:00:00.000Z"),
      ])
    })
  })
})

describe("endOfSeason", () => {
  context("season ends in July", () => {
    it("returns last date in July", () => {
      expect(
        optionalEndOfSeason({timezone: DEFAULT_TIMEZONE})(
          {
            type: "open",
            dayOfWeek: 1,
            startTime: "11:00",
            endTime: "18:00",
            startDay: "01-01",
            endDay: "07-31",
          },
          new Date("2021-06-21T12:00:00.000Z"),
        ),
      ).to.eql(new Date("2021-07-31T17:00:00.000Z"))
    })
  })
})

describe("startOfSeason", () => {
  context("season starts in January", () => {
    it("returns first date in January", () => {
      expect(
        optionalStartOfSeason({timezone: DEFAULT_TIMEZONE})(
          {
            type: "open",
            dayOfWeek: 1,
            startTime: "11:00",
            endTime: "18:00",
            startDay: "01-01",
            endDay: "07-31",
          },
          new Date("2021-06-21T12:00:00.000Z"),
        ),
      ).to.eql(new Date("2021-01-01T11:00:00.000Z"))
    })
  })
})

describe("startOfDay", () => {
  context("span starts at 11am", () => {
    it("returns listed date, but at 11am", () => {
      expect(
        optionalStartOfDay({timezone: DEFAULT_TIMEZONE})(
          {
            type: "open",
            dayOfWeek: 1,
            startTime: "11:00",
            endTime: "18:00",
          },
          new Date("2021-06-21T12:00:00.000Z"),
        ),
      ).to.eql(new Date("2021-06-21T10:00:00.000Z"))
    })
  })
})
