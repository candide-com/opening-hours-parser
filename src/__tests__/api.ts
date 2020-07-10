import {expect} from "chai"
import {openingHours} from "../"

describe("no timezone", () => {
  context("a time well within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, start: "10:00", end: "14:00", type: "open"},
        {dayOfWeek: 7, start: "10:00", end: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-05T12:00:00.000"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T12:00:00.000"))).to.eq(true)
    })
  })

  context("times narrowly within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, start: "10:00", end: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-06T10:00:00.000"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T14:00:00.000"))).to.eq(true)
    })
  })

  context("a time well within open times on a full day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, start: "00:00", end: "24:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-06T12:00:00.000"))).to.eq(true)
    })
  })

  context("a time well outside open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, start: "10:00", end: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-01-06T18:00:00.000"))).to.eq(false)
    })
  })

  context("a time on a closed day", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours([
        {dayOfWeek: 1, start: "10:00", end: "14:00", type: "open"},
      ])

      expect(isOpenOn(new Date("2020-06-30T11:00:00.000"))).to.eq(false)
    })
  })

  context("on a public holiday, when it's closed on a public holiday", () => {
    it("returns false", () => {
      const {isOpenOn} = openingHours(
        [
          {dayOfWeek: 1, start: "10:00", end: "14:00", type: "open"},
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
          {dayOfWeek: 1, start: "10:00", end: "14:00", type: "open"},
          {type: "publicHoliday", isOpen: true, start: "10:00", end: "18:00"},
        ],
        {publicHolidays: ["2020-01-06"]},
      )

      expect(isOpenOn(new Date("2020-01-06T17:00:00.000"))).to.eq(true)
    })
  })
})
