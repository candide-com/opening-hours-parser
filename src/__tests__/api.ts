import {expect} from "chai"
import {openingHours} from "../"

describe("isOpenOn", () => {
  context("a time well within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "14:00"},
      ])

      expect(isOpenOn(new Date("2020-01-05T12:00:00.000"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T12:00:00.000"))).to.eq(true)
    })
  })

  context("times narrowly within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
      ])

      expect(isOpenOn(new Date("2020-01-06T10:00:00.000"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T14:00:00.000"))).to.eq(true)
    })
  })

  context("a time well within open times on a full day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
      ])

      expect(isOpenOn(new Date("2020-01-06T12:00:00.000"))).to.eq(true)
    })
  })

  context("a time well outside open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
      ])

      expect(isOpenOn(new Date("2020-01-06T18:00:00.000"))).to.eq(false)
    })
  })

  context("a time on a closed day", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
      ])

      expect(isOpenOn(new Date("2020-06-30T11:00:00.000"))).to.eq(false)
    })
  })

  context("a time on a closed date", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 6, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "14:00"},
        {type: "closed", startDay: "06-30", endDay: "06-30"},
      ])

      expect(isOpenOn(new Date("2020-06-30T11:00:00.000"))).to.eq(false)
    })
  })

  context("a time inside a closed date span", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 6, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "14:00"},
        {type: "closed", startDay: "06-01", endDay: "06-31"},
        {type: "closed", startDay: "06-10", endDay: "06-15"},
      ])

      expect(isOpenOn(new Date("2020-06-11:00:00.000"))).to.eq(false)
    })
  })

  context("a time NOT on a specifically closed date", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 6, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "14:00"},
        {type: "closed", startDay: "06-30", endDay: "06-30"},
      ])

      expect(isOpenOn(new Date("2020-06-23T11:00:00.000"))).to.eq(true)
    })
  })

  context("lunch breaks", () => {
    it("returns true in the morning", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 1, startTime: "13:00", endTime: "17:00"},
      ])

      expect(isOpenOn(new Date("2020-06-01T11:30:00.000"))).to.eq(true)
    })

    it("returns false at lunch", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 1, startTime: "13:00", endTime: "17:00"},
      ])

      expect(isOpenOn(new Date("2020-06-01T12:30:00.000"))).to.eq(false)
    })

    it("returns true in the afternoon", () => {
      const {isOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 1, startTime: "13:00", endTime: "17:00"},
      ])

      expect(isOpenOn(new Date("2020-06-01T13:30:00.000"))).to.eq(true)
    })
  })

  context("on a public holiday, when it's closed on a public holiday", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours(
        [
          {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
          {type: "publicHoliday", isOpen: false},
        ],
        {publicHolidays: ["2020-01-06"]},
      )

      expect(isOpenOn(new Date("2020-01-06T11:00:00.000"))).to.eq(false)
    })
  })

  context("on a public holiday, when it's open on a public holiday", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours(
        [
          {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
          {
            type: "publicHoliday",
            isOpen: true,
            startTime: "10:00",
            endTime: "18:00",
          },
        ],
        {publicHolidays: ["2020-01-06"]},
      )

      expect(isOpenOn(new Date("2020-01-06T17:00:00.000"))).to.eq(true)
    })
  })

  context("out of season, when a season is specified", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "08-01",
          endDay: "10-31",
        },
      ])

      expect(isOpenOn(new Date("2020-01-06T12:00:00.000"))).to.eq(false)
    })
  })

  context("season that wraps around end of the year", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "10-31",
          endDay: "03-01",
        },
      ])

      expect(isOpenOn(new Date("2020-02-03T12:00:00.000"))).to.eq(true)
    })
  })
})
