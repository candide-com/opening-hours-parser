import {expect} from "chai"
import {parse} from "../"

describe("parse a single expression", () => {
  context("some nonsense", () => {
    it("throws an error", () => {
      expect(() => parse("not a schedule")).to.throw()
    })
  })

  context("day range and time range", () => {
    it("Mo-Fr 10:00-18:00", () => {
      expect(parse("Mo-Fr 10:00-18:00")).to.eql([
        {type: "open", dayOfWeek: 1, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 2, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 3, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 4, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 5, start: "10:00", end: "18:00"},
      ])
    })

    it("Mo-Fr 08:00-12:00,13:00-17:00", () => {
      expect(parse("Mo-Fr 08:00-12:00,13:00-17:00")).to.eql([
        {type: "open", dayOfWeek: 1, start: "08:00", end: "12:00"},
        {type: "open", dayOfWeek: 1, start: "13:00", end: "17:00"},
        {type: "open", dayOfWeek: 2, start: "08:00", end: "12:00"},
        {type: "open", dayOfWeek: 2, start: "13:00", end: "17:00"},
        {type: "open", dayOfWeek: 3, start: "08:00", end: "12:00"},
        {type: "open", dayOfWeek: 3, start: "13:00", end: "17:00"},
        {type: "open", dayOfWeek: 4, start: "08:00", end: "12:00"},
        {type: "open", dayOfWeek: 4, start: "13:00", end: "17:00"},
        {type: "open", dayOfWeek: 5, start: "08:00", end: "12:00"},
        {type: "open", dayOfWeek: 5, start: "13:00", end: "17:00"},
      ])
    })
  })

  context("day range", () => {
    it("Mo-Fr", () => {
      expect(parse("Mo-Fr")).to.eql([
        {type: "open", dayOfWeek: 1, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 2, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 3, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 4, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 5, start: "00:00", end: "24:00"},
      ])
    })

    it("Fr-Su", () => {
      expect(parse("Fr-Su")).to.eql([
        {type: "open", dayOfWeek: 5, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 6, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 0, start: "00:00", end: "24:00"},
      ])
    })

    it("Sa-Fr", () => {
      expect(parse("Sa-Fr")).to.eql([
        {type: "open", dayOfWeek: 6, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 0, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 1, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 2, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 3, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 4, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 5, start: "00:00", end: "24:00"},
      ])
    })
  })

  context("multiple days", () => {
    it("Mo,Tu", () => {
      expect(parse("Mo,Tu")).to.eql([
        {type: "open", dayOfWeek: 1, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 2, start: "00:00", end: "24:00"},
      ])
    })

    it("24/7", () => {
      expect(parse("24/7")).to.eql([
        {type: "open", dayOfWeek: 0, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 1, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 2, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 3, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 4, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 5, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 6, start: "00:00", end: "24:00"},
      ])
    })
  })
})

describe("parse two expressions", () => {
  context("day range and time range", () => {
    it("Su-We 10:00-18:00; Fr 08:00-19:00", () => {
      expect(parse("Su-We 10:00-18:00; Fr 08:00-19:00")).to.eql([
        {type: "open", dayOfWeek: 0, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 1, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 2, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 3, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 5, start: "08:00", end: "19:00"},
      ])
    })

    it("Su-We 10:00-18:00; Fr-Sa 08:00-19:00", () => {
      expect(parse("Su-We 10:00-18:00; Fr-Sa 08:00-19:00")).to.eql([
        {type: "open", dayOfWeek: 0, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 1, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 2, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 3, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 5, start: "08:00", end: "19:00"},
        {type: "open", dayOfWeek: 6, start: "08:00", end: "19:00"},
      ])
    })
  })

  context("overlapping day range and day range plus time range", () => {
    it("Su-We; Tu-Th 10:00-18:00", () => {
      expect(parse("Su-We; Tu-Th 10:00-18:00")).to.eql([
        {type: "open", dayOfWeek: 0, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 1, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 2, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 3, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 4, start: "10:00", end: "18:00"},
      ])
    })
  })

  context("day range plus days off", () => {
    it("Mo-Fr 10:00-18:00; We off", () => {
      expect(parse("Mo-Fr 10:00-18:00; We off")).to.eql([
        {type: "open", dayOfWeek: 1, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 2, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 4, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 5, start: "10:00", end: "18:00"},
      ])
    })

    it("Mo-Fr 10:00-18:00; Tu-We off", () => {
      expect(parse("Mo-Fr 10:00-18:00; Tu-We off")).to.eql([
        {type: "open", dayOfWeek: 1, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 4, start: "10:00", end: "18:00"},
        {type: "open", dayOfWeek: 5, start: "10:00", end: "18:00"},
      ])
    })
  })

  context("day range plus public holdays", () => {
    it("Mo-Fr; PH off", () => {
      expect(parse("Mo-Fr; PH off")).to.eql([
        {type: "open", dayOfWeek: 1, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 2, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 3, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 4, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 5, start: "00:00", end: "24:00"},
        {type: "publicHoliday", isOpen: false},
      ])
    })

    it("Mo-Fr; PH 08:00-12:00", () => {
      expect(parse("Mo-Fr; PH 08:00-12:00")).to.eql([
        {type: "open", dayOfWeek: 1, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 2, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 3, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 4, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 5, start: "00:00", end: "24:00"},
        {type: "publicHoliday", isOpen: true, start: "08:00", end: "12:00"},
      ])
    })
  })
})

describe("parse three expressions", () => {
  context("three single days", () => {
    it("Mo 08:00-12:00; We 08:00-13:00; Fr 08:00-14:00", () => {
      expect(parse("Mo 08:00-12:00; We 08:00-13:00; Fr 08:00-14:00")).to.eql([
        {type: "open", dayOfWeek: 1, start: "08:00", end: "12:00"},
        {type: "open", dayOfWeek: 3, start: "08:00", end: "13:00"},
        {type: "open", dayOfWeek: 5, start: "08:00", end: "14:00"},
      ])
    })
  })

  context("Test from real life", () => {
    it("We-Su; Fr,Sa off; ph 00:00-24:00", () => {
      expect(parse("We-Su; Fr,Sa off; ph 00:00-24:00")).to.eql([
        {type: "open", dayOfWeek: 3, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 4, start: "00:00", end: "24:00"},
        {type: "open", dayOfWeek: 0, start: "00:00", end: "24:00"},
        {type: "publicHoliday", isOpen: true, start: "00:00", end: "24:00"},
      ])
    })
  })
})
