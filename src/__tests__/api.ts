import {expect} from "chai"
import {openingHours, Options, parse} from "../"

const zonedOpeningHours = (oh: string, options?: Options) =>
  openingHours(parse(oh), {...options, timezone: "Europe/London"})

describe("isOpenOn", () => {
  context("a time well within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = zonedOpeningHours("Mo,Su 10:00-14:00")

      expect(isOpenOn(new Date("2020-01-05T12:00:00.000Z"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T12:00:00.000Z"))).to.eq(true)
    })
  })

  context("times narrowly within open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-14:00")

      expect(isOpenOn(new Date("2020-01-06T10:00:00.000Z"))).to.eq(true)
      expect(isOpenOn(new Date("2020-01-06T14:00:00.000Z"))).to.eq(true)
    })
  })

  context("a time well within open times on a full day", () => {
    it("returns true", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 00:00-24:00")

      expect(isOpenOn(new Date("2020-01-06T12:00:00.000Z"))).to.eq(true)
    })
  })

  context("a time well outside open times on an open day", () => {
    it("returns true", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-14:00")

      expect(isOpenOn(new Date("2020-01-06T18:00:00.000Z"))).to.eq(false)
    })
  })

  context("a time on a closed day", () => {
    it("returns false", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-14:00")

      expect(isOpenOn(new Date("2020-06-30T11:00:00.000Z"))).to.eq(false)
    })
  })

  context("a time on a closed date", () => {
    it("returns false", () => {
      const {isOpenOn} = zonedOpeningHours("10:00-14:00; Jun 30 off")

      expect(isOpenOn(new Date("2020-06-30T11:00:00.000Z"))).to.eq(false)
    })
  })

  context("a time inside a closed date span", () => {
    it("returns false", () => {
      const {isOpenOn} = zonedOpeningHours(
        "10:00-14:00; Jun 01 - Jun 31 off; Jun 10 - Jun 15 off",
      )

      expect(isOpenOn(new Date("2020-06-11:00:00.000Z"))).to.eq(false)
    })
  })

  context("a time NOT on a specifically closed date", () => {
    it("returns true", () => {
      const {isOpenOn} = zonedOpeningHours("10:00-14:00; Jun 30 off")

      expect(isOpenOn(new Date("2020-06-23T11:00:00.000Z"))).to.eq(true)
    })
  })

  context("lunch breaks", () => {
    it("returns true in the morning", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-12:00,13:00-17:00")

      expect(isOpenOn(new Date("2020-06-01T10:30:00.000Z"))).to.eq(true)
    })

    it("returns false at lunch", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-12:00,13:00-17:00")

      expect(isOpenOn(new Date("2020-06-01T11:30:00.000Z"))).to.eq(false)
    })

    it("returns true in the afternoon", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-12:00,13:00-17:00")

      expect(isOpenOn(new Date("2020-06-01T13:30:00.000Z"))).to.eq(true)
    })
  })

  context("on a public holiday, when it's closed on a public holiday", () => {
    it("returns false", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-14:00; PH off", {
        publicHolidays: ["2020-01-06"],
      })

      expect(isOpenOn(new Date("2020-01-06T11:00:00.000Z"))).to.eq(false)
    })
  })

  context("on a public holiday, when it's open on a public holiday", () => {
    it("returns true", () => {
      const {isOpenOn} = zonedOpeningHours("Mo 10:00-14:00; PH 10:00-18:00", {
        publicHolidays: ["2020-01-06"],
      })

      expect(isOpenOn(new Date("2020-01-06T17:00:00.000Z"))).to.eq(true)
    })
  })

  context("out of season, when a season is specified", () => {
    it("returns false", () => {
      const {isOpenOn} = zonedOpeningHours("Aug 01 - Oct 31 Mo 10:00-14:00")

      expect(isOpenOn(new Date("2020-01-06T12:00:00.000Z"))).to.eq(false)
    })
  })

  context("season that wraps around end of the year", () => {
    it("returns true", () => {
      const {isOpenOn} = zonedOpeningHours("Oct 31 - Mar 01 Mo 10:00-14:00")

      expect(isOpenOn(new Date("2020-02-03T12:00:00.000Z"))).to.eq(true)
    })
  })
})

describe("nextOpenOn", () => {
  context("currently open", () => {
    it("returns current date", () => {
      const {nextOpenOn} = zonedOpeningHours("10:00-14:00")
      expect(
        nextOpenOn(new Date("2020-02-02T12:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-02T12:00:00.000Z").toISOString())
    })
  })

  context("Currently open on a date that is open 24 hours a day", () => {
    it("returns current date", () => {
      const {nextOpenOn} = zonedOpeningHours("Mo 10:00-24:00")

      expect(
        nextOpenOn(new Date("2020-01-20T23:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-01-20T23:00:00.000Z").toISOString())
    })
  })

  context("closed today, open tomorrow", () => {
    it("returns tomorrows date", () => {
      const {nextOpenOn} = zonedOpeningHours(
        "Mo-Tu 10:00-14:00; Th-Su 10:00-14:00",
      )
      expect(
        nextOpenOn(new Date("2020-02-05T12:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-06T10:00:00.000Z").toISOString())
    })
  })

  context("closed until next week", () => {
    it("returns next Monday", () => {
      const {nextOpenOn} = zonedOpeningHours("Mo-Tu 10:00-14:00")
      expect(
        nextOpenOn(new Date("2020-02-05T12:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-10T10:00:00.000Z").toISOString())
    })
  })

  context("closed until next week, with seasonal dates", () => {
    it("returns next Tuesday", () => {
      const {nextOpenOn} = zonedOpeningHours("Apr 13 - Sep 30 Tu 11:00-16:00")
      expect(
        nextOpenOn(new Date("2021-06-23T12:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2021-06-29T10:00:00.000Z").toISOString())
    })
  })

  context("open earlier today but now closed, opening tomorrow", () => {
    it("returns tomorrow", () => {
      const {nextOpenOn} = zonedOpeningHours("We-Th 10:00-14:00")
      expect(
        nextOpenOn(new Date("2020-02-05T16:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-06T10:00:00.000Z").toISOString())
    })
  })

  context("open later today but currently closed, opening today", () => {
    it("returns today", () => {
      const {nextOpenOn} = zonedOpeningHours("We-Th 10:00-14:00")
      expect(
        nextOpenOn(new Date("2020-02-05T09:55:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-05T10:00:00.000Z").toISOString())
    })
  })

  context("out of season, season starts this year", () => {
    it("returns start of next season", () => {
      const {nextOpenOn} = zonedOpeningHours("Aug 01 - Oct 31 Mo 10:00-14:00")
      expect(
        nextOpenOn(new Date("2020-02-05T16:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-08-03T09:00:00.000Z").toISOString())
    })
  })

  context(
    "out of season, season starts this year and season is one specific date",
    () => {
      it("returns start of next season", () => {
        const {nextOpenOn} = zonedOpeningHours("Oct 25 10:00-14:00")
        expect(
          nextOpenOn(new Date("2020-02-05T16:00:00.000Z"))?.toISOString(),
        ).to.eq(new Date("2020-10-25T10:00:00.000Z").toISOString())
      })
    },
  )

  context("out of season, season starts next year", () => {
    it("returns start of next season", () => {
      const {nextOpenOn} = zonedOpeningHours(
        "Feb 01 - Feb 28, Aug 01 - Aug 28 Mo 10:00-14:00",
      )
      expect(
        nextOpenOn(new Date("2020-09-03T16:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2021-02-03T10:00:00.000Z").toISOString())
    })
  })

  context(
    "inside season dates, but no matching day of the week left in season",
    () => {
      it("returns start of next season", () => {
        const {nextOpenOn} = zonedOpeningHours(
          "Feb 01 - Feb 28, Aug 01 - Aug 28 Mo 10:00-14:00",
        )
        expect(
          nextOpenOn(new Date("2020-02-26T16:00:00.000Z"))?.toISOString(),
        ).to.eq(new Date("2020-08-03T09:00:00.000Z").toISOString())
      })
    },
  )

  context("within season and within opening hours", () => {
    it("returns current date", () => {
      const {nextOpenOn} = zonedOpeningHours("Feb 01 - Feb 28 Mo 10:00-14:00")
      expect(
        nextOpenOn(new Date("2020-02-03T12:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-03T12:00:00.000Z").toISOString())
    })
  })

  context("within season and before opening hours on an open day", () => {
    it("returns current date", () => {
      const {nextOpenOn} = zonedOpeningHours("Feb 01 - Feb 28 Mo 10:00-14:00")
      expect(
        nextOpenOn(new Date("2020-02-03T09:55:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-03T10:00:00.000Z").toISOString())
    })
  })

  context("within season but closed for today", () => {
    it("returns the following day", () => {
      const {nextOpenOn} = zonedOpeningHours(
        "Feb 01 - Feb 28 Mo-Tu 10:00-14:00",
      )
      expect(
        nextOpenOn(new Date("2020-02-03T16:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-04T10:00:00.000Z").toISOString())
    })
  })

  context("usually open for a season, but closed this week", () => {
    it("returns start of next week", () => {
      const {nextOpenOn} = zonedOpeningHours(
        "Apr 01 - Sep 30 We-Su 10:00-17:00; Jun 23 - Jun 27 off",
      )

      expect(
        nextOpenOn(new Date("2021-06-21T12:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2021-06-30T09:00:00.000Z").toISOString())
    })
  })

  context("usually open all week but closed this week", () => {
    it("returns the day after the closed period ends", () => {
      const {nextOpenOn} = zonedOpeningHours("10:00-14:00; Jan 27 - Feb 02 off")
      expect(
        nextOpenOn(new Date("2020-01-27T12:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-02-03T10:00:00.000Z").toISOString())
    })
  })

  context("Opens on Wednesdays and public holidays", () => {
    it("returns Monday", () => {
      const {nextOpenOn} = zonedOpeningHours("We 10:00-14:00; PH 08:00-16:00", {
        publicHolidays: ["2020-01-06"],
      })

      expect(
        nextOpenOn(new Date("2020-01-03T11:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-01-06T08:00:00.000Z").toISOString())
    })
  })

  context("usually open on Monday, but closes on bank holidays", () => {
    it("returns Tuesday", () => {
      const {nextOpenOn} = zonedOpeningHours("Mo-Fr 10:00-14:00; PH off", {
        publicHolidays: ["2020-01-06"],
      })

      expect(
        nextOpenOn(new Date("2020-01-03T17:00:00.000Z"))?.toISOString(),
      ).to.eq(new Date("2020-01-07T10:00:00.000Z").toISOString())
    })
  })

  context(
    "Public holidays are open, and a public holiday from the past is supplied",
    () => {
      it("returns the next open day", () => {
        const {
          nextOpenOn,
        } = zonedOpeningHours(
          "May 01 - Oct 31 Sa 11:00-18:00; PH 11:00-18:00",
          {publicHolidays: ["2021-04-05", "2021-05-03", "2021-05-31"]},
        )

        expect(
          nextOpenOn(new Date("2021-04-14T11:36:00.000Z"))?.toISOString(),
        ).to.eq(new Date("2021-05-01T10:00:00.000Z").toISOString())
      })
    },
  )

  context(
    "Last Sunday of the season, with a single open day the week after",
    () => {
      it("Returns the expected date because there is no startOfWeek problem", () => {
        const {isOpenOn, nextOpenOn} = zonedOpeningHours(
          "Apr 13 - Sep 30 Tu 11:00-16:00",
        )

        expect(isOpenOn(new Date("2021-09-28T12:00:00.000Z"))).to.eql(true)

        expect(nextOpenOn(new Date("2021-09-26T11:00:00.000Z"))).to.eql(
          new Date("2021-09-28T10:00:00.000Z"),
        )
      })
    },
  )

  context("A date within a season that wraps around end of the year", () => {
    it("Returns the next open date within the season", () => {
      const schedule = "Oct 01 - Mar 31 Tu-Sa 10:00-17:00"

      const {nextOpenOn} = zonedOpeningHours(schedule)

      expect(nextOpenOn(new Date("2021-10-04T09:00:00.000Z"))).to.eql(
        new Date("2021-10-05T09:00:00.000Z"),
      )
    })
  })
})

describe("isOpenOnDate", () => {
  context("A date on an open day", () => {
    it("return true", () => {
      const {isOpenOnDate} = zonedOpeningHours("Su 10:00-18:00")

      expect(isOpenOnDate(new Date("2020-12-06"))).to.eq(true)
    })
  })

  context("A date on a non-open day due to the day of the week", () => {
    it("return false", () => {
      const {isOpenOnDate} = zonedOpeningHours("Su 10:00-18:00")

      expect(isOpenOnDate(new Date("2020-12-05"))).to.eq(false)
    })
  })

  context("A date on a non-open day due to the season being over", () => {
    it("return false", () => {
      const {isOpenOnDate} = zonedOpeningHours("Oct 01 - Dec 06 Mo 10:00-18:00")

      expect(isOpenOnDate(new Date("2020-12-07"))).to.eq(false)
    })
  })

  context("A date on an explicitly closed day", () => {
    it("return false", () => {
      const {isOpenOnDate} = zonedOpeningHours("Oct 01 - Oct 03 off")

      expect(isOpenOnDate(new Date("2020-10-02"))).to.eq(false)
    })
  })

  context("A date on a public holiday, when public holidays are open", () => {
    it("returns true", () => {
      const {isOpenOnDate} = zonedOpeningHours(
        "Mo 10:00-18:00; PH 10:00-18:00",
        {publicHolidays: ["2020-12-04"]},
      )

      expect(isOpenOnDate(new Date("2020-12-04"))).to.eq(true)
    })
  })

  context("A date on a public holiday, when public holidays are closed", () => {
    it("returns false", () => {
      const {isOpenOnDate} = zonedOpeningHours("Mo 10:00-18:00; PH off", {
        publicHolidays: ["2020-12-04"],
      })

      expect(isOpenOnDate(new Date("2020-12-04"))).to.eq(false)
    })
  })
})
