import {expect} from "chai"
import {parse} from "../"

describe("parse a single expression", () => {
  context("some nonsense", () => {
    it("throws an error", () => {
      expect(() => parse("not a schedule")).to.throw()
    })

    it("empty string", () => {
      expect(parse("")).to.eql([])
    })
  })

  context("day range and time range", () => {
    it("Mo-Fr 10:00-18:00", () => {
      expect(parse("Mo-Fr 10:00-18:00")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "18:00"},
      ])
    })

    it("Mo-Fr 08:00-12:00,13:00-17:00", () => {
      expect(parse("Mo-Fr 08:00-12:00,13:00-17:00")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 2, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 3, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 4, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 5, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 1, startTime: "13:00", endTime: "17:00"},
        {type: "open", dayOfWeek: 2, startTime: "13:00", endTime: "17:00"},
        {type: "open", dayOfWeek: 3, startTime: "13:00", endTime: "17:00"},
        {type: "open", dayOfWeek: 4, startTime: "13:00", endTime: "17:00"},
        {type: "open", dayOfWeek: 5, startTime: "13:00", endTime: "17:00"},
      ])
    })

    it("Mo 08:00-12:00,13:00-17:00,19:00-22:00", () => {
      expect(parse("Mo 08:00-12:00,13:00-17:00,19:00-22:00")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 1, startTime: "13:00", endTime: "17:00"},
        {type: "open", dayOfWeek: 1, startTime: "19:00", endTime: "22:00"},
      ])
    })
  })

  context("day range", () => {
    it("Mo-Fr", () => {
      expect(parse("Mo-Fr")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
      ])
    })

    it("Fr-Su", () => {
      expect(parse("Fr-Su")).to.eql([
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 6, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 7, startTime: "00:00", endTime: "24:00"},
      ])
    })

    it("Sa-Fr", () => {
      expect(parse("Sa-Fr")).to.eql([
        {type: "open", dayOfWeek: 6, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 7, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
      ])
    })
  })

  context("multiple days", () => {
    it("Mo,Tu", () => {
      expect(parse("Mo,Tu")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
      ])
    })

    it("Mo,Tu,Th", () => {
      expect(parse("Mo,Tu,Th")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
      ])
    })

    it("Mo-We,Fr", () => {
      expect(parse("Mo-We,Fr")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
      ])
    })

    it("24/7", () => {
      expect(parse("24/7")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 6, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 7, startTime: "00:00", endTime: "24:00"},
      ])
    })

    it("00:00-24:00", () => {
      expect(parse("00:00-24:00")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 6, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 7, startTime: "00:00", endTime: "24:00"},
      ])
    })
  })

  context("year range", () => {
    it("2030", () => {
      expect(parse("2030 Mo")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startYear: 2030,
          endYear: 2030,
        },
      ])
    })

    it("2030+", () => {
      expect(parse("2030+ Mo")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startYear: 2030,
        },
      ])
    })

    it("2030-2034", () => {
      expect(parse("2030-2034 Mo")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startYear: 2030,
          endYear: 2034,
        },
      ])
    })
  })
})

describe("parse two expressions", () => {
  context("day range and time range", () => {
    it("Su-We 10:00-18:00; Fr 08:00-19:00", () => {
      expect(parse("Su-We 10:00-18:00; Fr 08:00-19:00")).to.eql([
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 5, startTime: "08:00", endTime: "19:00"},
      ])
    })

    it("Su-We 10:00-18:00; Fr-Sa 08:00-19:00", () => {
      expect(parse("Su-We 10:00-18:00; Fr-Sa 08:00-19:00")).to.eql([
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 5, startTime: "08:00", endTime: "19:00"},
        {type: "open", dayOfWeek: 6, startTime: "08:00", endTime: "19:00"},
      ])
    })
  })

  context("overlapping day range and day range plus time range", () => {
    it("Su-We; Tu-Th 10:00-18:00", () => {
      expect(parse("Su-We; Tu-Th 10:00-18:00")).to.eql([
        {type: "open", dayOfWeek: 7, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "18:00"},
      ])
    })
  })

  context("day range plus days off", () => {
    it("Mo-Fr 10:00-18:00; We off", () => {
      expect(parse("Mo-Fr 10:00-18:00; We off")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "18:00"},
      ])
    })

    it("Mo-Fr 10:00-18:00; Tu-We off", () => {
      expect(parse("Mo-Fr 10:00-18:00; Tu-We off")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "18:00"},
      ])
    })
  })

  context("day range plus public holdays", () => {
    it("Mo-Fr; PH off", () => {
      expect(parse("Mo-Fr; PH off")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
        {type: "publicHoliday", isOpen: false},
      ])
    })

    it("Mo-Fr; PH", () => {
      expect(parse("Mo-Fr; PH")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
        {
          type: "publicHoliday",
          isOpen: true,
          startTime: "00:00",
          endTime: "24:00",
        },
      ])
    })

    it("Mo-Fr; PH 08:00-12:00", () => {
      expect(parse("Mo-Fr; PH 08:00-12:00")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 2, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 5, startTime: "00:00", endTime: "24:00"},
        {
          type: "publicHoliday",
          isOpen: true,
          startTime: "08:00",
          endTime: "12:00",
        },
      ])
    })
  })

  context("year ranges", () => {
    it("2020 Mo; 2021 Fr", () => {
      expect(parse("2020 Mo; 2021 Fr")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startYear: 2020,
          endYear: 2020,
        },
        {
          type: "open",
          dayOfWeek: 5,
          startTime: "00:00",
          endTime: "24:00",
          startYear: 2021,
          endYear: 2021,
        },
      ])
    })

    it("covering the same year", () => {
      expect(parse("2020 Oct Mo 12:00-19:00; 2020 Oct Mo 12:00-18:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "12:00",
          endTime: "18:00",
          startDay: "10-01",
          endDay: "10-31",
          startYear: 2020,
          endYear: 2020,
        },
      ])
    })

    it("covering multiple year ranges", () => {
      expect(
        parse(
          "2020 Oct Mo 12:00-18:00; 2021-2022 Mo 13:00-17:00; 2023+ Mo 12:00-18:00",
        ),
      ).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "12:00",
          endTime: "18:00",
          startDay: "10-01",
          endDay: "10-31",
          startYear: 2020,
          endYear: 2020,
        },
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "13:00",
          endTime: "17:00",
          startYear: 2021,
          endYear: 2022,
        },
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "12:00",
          endTime: "18:00",
          startYear: 2023,
        },
      ])
    })

    it("covering overlapping year ranges", () => {
      expect(parse("2021 Mo 12:00-19:00; 2020-2024 Mo 12:00-18:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "12:00",
          endTime: "19:00",
          startYear: 2021,
          endYear: 2021,
        },
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "12:00",
          endTime: "18:00",
          startYear: 2020,
          endYear: 2024,
        },
      ])
    })
  })
})

describe("parse three expressions", () => {
  context("three single days", () => {
    it("Mo 08:00-12:00; We 08:00-13:00; Fr 08:00-14:00", () => {
      expect(parse("Mo 08:00-12:00; We 08:00-13:00; Fr 08:00-14:00")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 3, startTime: "08:00", endTime: "13:00"},
        {type: "open", dayOfWeek: 5, startTime: "08:00", endTime: "14:00"},
      ])
    })
  })

  context("Test from real life", () => {
    it("We-Su; Fr,Sa off; ph 00:00-24:00", () => {
      expect(parse("We-Su; Fr,Sa off; ph 00:00-24:00")).to.eql([
        {type: "open", dayOfWeek: 3, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 4, startTime: "00:00", endTime: "24:00"},
        {type: "open", dayOfWeek: 7, startTime: "00:00", endTime: "24:00"},
        {
          type: "publicHoliday",
          isOpen: true,
          startTime: "00:00",
          endTime: "24:00",
        },
      ])
    })
  })
})

describe("Days of the year", () => {
  context("Only open for a season, 1st Aug to 21st Oct", () => {
    it("Aug 01 - Oct 31 00:00-24:00", () => {
      expect(parse("Aug 01 - Oct 31 00:00-24:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 2,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 3,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 4,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 5,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 6,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 7,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "10-31",
        },
      ])
    })
  })

  context("Only open on a specific date", () => {
    it("Aug 01 00:00-24:00", () => {
      expect(parse("Aug 01 00:00-24:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 2,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 3,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 4,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 5,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 6,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 7,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
      ])
    })
  })

  context("Only open on a specific date, with optional colon", () => {
    it("Aug 01: 00:00-24:00", () => {
      expect(parse("Aug 01: 00:00-24:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 2,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 3,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 4,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 5,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 6,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
        {
          type: "open",
          dayOfWeek: 7,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-01",
        },
      ])
    })
  })

  context("Only open for month", () => {
    it("Aug 00:00-24:00", () => {
      expect(parse("Aug 00:00-24:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "open",
          dayOfWeek: 2,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "open",
          dayOfWeek: 3,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "open",
          dayOfWeek: 4,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "open",
          dayOfWeek: 5,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "open",
          dayOfWeek: 6,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "open",
          dayOfWeek: 7,
          startTime: "00:00",
          endTime: "24:00",
          startDay: "08-01",
          endDay: "08-31",
        },
      ])
    })
  })

  context("Open for two date ranges without overlap", () => {
    it("Aug Mo 08:00-18:00; Sep Mo 10:00-18:00", () => {
      expect(parse("Aug Mo 08:00-18:00; Sep Mo 10:00-18:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "18:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "18:00",
          startDay: "09-01",
          endDay: "09-30",
        },
      ])
    })
  })

  context("Open for two dates separated by commas", () => {
    it("Aug 10, Aug 12 Mo 08:00-18:00", () => {
      expect(parse("Aug 10, Aug 12 Mo 08:00-18:00")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "18:00",
          startDay: "08-10",
          endDay: "08-10",
        },
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "18:00",
          startDay: "08-12",
          endDay: "08-12",
        },
      ])
    })
  })

  context("Date range with a specific date closed", () => {
    it("Aug Mo 08:00-18:00; Aug 10 off", () => {
      expect(parse("Aug Mo 08:00-18:00; Aug 10 off")).to.eql([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "18:00",
          startDay: "08-01",
          endDay: "08-31",
        },
        {
          type: "closed",
          startDay: "08-10",
          endDay: "08-10",
        },
      ])
    })
  })

  context("Two completely overlapping closed date periods", () => {
    it("Mo 08:00-18:00; Aug 10 - Aug 30 off; Aug 15 - Aug 20: off", () => {
      expect(
        parse("Mo 08:00-18:00; Aug 10 - Aug 30 off; Aug 15 - Aug 20: off"),
      ).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "08:00", endTime: "18:00"},
        {type: "closed", startDay: "08-10", endDay: "08-30"},
        {type: "closed", startDay: "08-15", endDay: "08-20"},
      ])
    })
  })

  context("Open all year, but with a single month off", () => {
    it("08:00-18:00; Aug off", () => {
      expect(parse("08:00-18:00; Aug off")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 2, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 3, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 4, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 5, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 6, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 7, startTime: "08:00", endTime: "18:00"},
        {type: "closed", startDay: "08-01", endDay: "08-31"},
      ])
    })
  })

  context("Open all year, but with two dates off", () => {
    it("08:00-18:00; Aug 01, Sep 10 off", () => {
      expect(parse("08:00-18:00; Aug 01, Sep 10 off")).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 2, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 3, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 4, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 5, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 6, startTime: "08:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 7, startTime: "08:00", endTime: "18:00"},
        {type: "closed", startDay: "08-01", endDay: "08-01"},
        {type: "closed", startDay: "09-10", endDay: "09-10"},
      ])
    })
  })

  context("Days with different times", () => {
    it("Mo-We, PH 11:00-18:00, Fr-Sa 12:00-17:00, Su 08:00-12:00, 13:00-18:00", () => {
      expect(
        parse(
          "Mo-We, PH 11:00-18:00, Fr-Sa 12:00-17:00, Su 08:00-12:00, 13:00-18:00",
        ),
      ).to.eql([
        {type: "open", dayOfWeek: 1, startTime: "11:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 2, startTime: "11:00", endTime: "18:00"},
        {type: "open", dayOfWeek: 3, startTime: "11:00", endTime: "18:00"},
        {
          type: "publicHoliday",
          isOpen: true,
          startTime: "11:00",
          endTime: "18:00",
        },
        {type: "open", dayOfWeek: 5, startTime: "12:00", endTime: "17:00"},
        {type: "open", dayOfWeek: 6, startTime: "12:00", endTime: "17:00"},
        {type: "open", dayOfWeek: 7, startTime: "08:00", endTime: "12:00"},
        {type: "open", dayOfWeek: 7, startTime: "13:00", endTime: "18:00"},
      ])
    })

    it("Apr 02 - Oct 31 Th-Sa, PH 11:00-18:00, Su 12:00-17:00", () => {
      expect(
        parse("Apr 02 - Oct 31 Th-Sa, PH 11:00-18:00, Su 12:00-17:00"),
      ).to.eql([
        {
          type: "open",
          dayOfWeek: 4,
          startTime: "11:00",
          endTime: "18:00",
          startDay: "04-02",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 5,
          startTime: "11:00",
          endTime: "18:00",
          startDay: "04-02",
          endDay: "10-31",
        },
        {
          type: "open",
          dayOfWeek: 6,
          startTime: "11:00",
          endTime: "18:00",
          startDay: "04-02",
          endDay: "10-31",
        },
        {
          type: "publicHoliday",
          isOpen: true,
          startTime: "11:00",
          endTime: "18:00",
        },
        {
          type: "open",
          dayOfWeek: 7,
          startTime: "12:00",
          endTime: "17:00",
          startDay: "04-02",
          endDay: "10-31",
        },
      ])
    })
  })
})
