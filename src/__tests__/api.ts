import {expect} from "chai"
import {openingHours} from "../"

describe("no timezone", () => {
  context("a time well within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "10:00", endTime: "14:00", type: "open"},
        {dayOfWeek: 7, startTime: "10:00", endTime: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-05T12:00:00.000"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T12:00:00.000"))).to.eq(true)
    })
  })

  context("times narrowly within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "10:00", endTime: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-06T10:00:00.000"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T14:00:00.000"))).to.eq(true)
    })
  })

  context("a time well within open times on a full day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "00:00", endTime: "24:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-06T12:00:00.000"))).to.eq(true)
    })
  })

  context("a time well outside open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "10:00", endTime: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-06T18:00:00.000"))).to.eq(false)
    })
  })

  context("a time on a closed day", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "10:00", endTime: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-06-30T11:00:00.000"))).to.eq(false)
    })
  })

  context("lunch breaks", () => {
    it("returns true in the morning", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "10:00", endTime: "12:00", type: "open"},
        {dayOfWeek: 1, startTime: "13:00", endTime: "17:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-06-01T11:30:00.000"))).to.eq(true)
    })

    it("returns false at lunch", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "10:00", endTime: "12:00", type: "open"},
        {dayOfWeek: 1, startTime: "13:00", endTime: "17:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-06-01T12:30:00.000"))).to.eq(false)
    })

    it("returns true in the afternoon", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, startTime: "10:00", endTime: "12:00", type: "open"},
        {dayOfWeek: 1, startTime: "13:00", endTime: "17:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-06-01T13:30:00.000"))).to.eq(true)
    })
  })

  context("on a public holiday, when it's closed on a public holiday", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours(
        [
          {dayOfWeek: 1, startTime: "10:00", endTime: "14:00", type: "open"},
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
          {dayOfWeek: 1, startTime: "10:00", endTime: "14:00", type: "open"},
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
})
