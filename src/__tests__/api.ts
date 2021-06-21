import {expect} from "chai"
import {openingHours, Schedule} from "../"

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
    it("returns true", () => {
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

describe("nextOpenOn", () => {
  context("currently open", () => {
    it("returns current date", () => {
      const {nextOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 6, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "14:00"},
      ])
      expect(
        nextOpenOn(new Date("2020-02-02T12:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-02T12:00:00.000").toISOString())
    })
  })

  context("closed today, open tomorrow", () => {
    it("returns tomorrows date", () => {
      const {nextOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 6, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "14:00"},
      ])
      expect(
        nextOpenOn(new Date("2020-02-05T12:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-06T10:00:00.000").toISOString())
    })
  })

  context("closed until next week", () => {
    it("returns next Monday", () => {
      const {nextOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
      ])
      expect(
        nextOpenOn(new Date("2020-02-05T12:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-10T10:00:00.000").toISOString())
    })
  })

  context("open earlier today but now closed, opening tomorrow", () => {
    it("returns tomorrow", () => {
      const {nextOpenOn} = openingHours([
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
      ])
      expect(
        nextOpenOn(new Date("2020-02-05T16:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-06T10:00:00.000").toISOString())
    })
  })

  context("open later today but currently closed, opening today", () => {
    it("returns today", () => {
      const {nextOpenOn} = openingHours([
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
      ])
      expect(
        nextOpenOn(new Date("2020-02-05T09:55:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-05T10:00:00.000").toISOString())
    })
  })

  context("out of season, season starts this year", () => {
    it("returns start of next season", () => {
      const {nextOpenOn} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "08-01",
          endDay: "10-31",
        },
      ])
      expect(
        nextOpenOn(new Date("2020-02-05T16:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-08-03T10:00:00.000").toISOString())
    })
  })

  context(
    "out of season, season starts this year and season is one specific date",
    () => {
      it("returns start of next season", () => {
        const {nextOpenOn} = openingHours([
          {
            type: "open",
            dayOfWeek: 1,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "10-25",
            endDay: "10-25",
          },
          {
            type: "open",
            dayOfWeek: 2,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "10-25",
            endDay: "10-25",
          },
          {
            type: "open",
            dayOfWeek: 3,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "10-25",
            endDay: "10-25",
          },
          {
            type: "open",
            dayOfWeek: 4,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "10-25",
            endDay: "10-25",
          },
          {
            type: "open",
            dayOfWeek: 5,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "10-25",
            endDay: "10-25",
          },
          {
            type: "open",
            dayOfWeek: 6,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "10-25",
            endDay: "10-25",
          },
          {
            type: "open",
            dayOfWeek: 7,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "10-25",
            endDay: "10-25",
          },
        ])
        expect(
          nextOpenOn(new Date("2020-02-05T16:00:00.000"))?.toISOString(),
        ).to.eq(new Date("2020-10-25T10:00:00.000").toISOString())
      })
    },
  )

  context("out of season, season starts next year", () => {
    it("returns start of next season", () => {
      const {nextOpenOn} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "02-01",
          endDay: "02-28",
        },
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "08-01",
          endDay: "08-28",
        },
      ])
      expect(
        nextOpenOn(new Date("2020-09-03T16:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2021-02-03T10:00:00.000").toISOString())
    })
  })

  context(
    "inside season dates, but no matching day of the week left in season",
    () => {
      it("returns start of next season", () => {
        const {nextOpenOn} = openingHours([
          {
            type: "open",
            dayOfWeek: 1,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "02-01",
            endDay: "02-28",
          },
          {
            type: "open",
            dayOfWeek: 1,
            startTime: "10:00",
            endTime: "14:00",
            startDay: "08-01",
            endDay: "08-28",
          },
        ])
        expect(
          nextOpenOn(new Date("2020-02-26T16:00:00.000"))?.toISOString(),
        ).to.eq(new Date("2020-08-03T10:00:00.000").toISOString())
      })
    },
  )

  context("within season and within opening hours", () => {
    it("returns current date", () => {
      const {nextOpenOn} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "02-01",
          endDay: "02-28",
        },
      ])
      expect(
        nextOpenOn(new Date("2020-02-03T12:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-03T12:00:00.000").toISOString())
    })
  })

  context("within season and before opening hours on an open day", () => {
    it("returns current date", () => {
      const {nextOpenOn} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "02-01",
          endDay: "02-28",
        },
      ])
      expect(
        nextOpenOn(new Date("2020-02-03T09:55:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-03T10:00:00.000").toISOString())
    })
  })

  context("within season but closed for today", () => {
    it("returns the following day", () => {
      const {nextOpenOn} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "02-01",
          endDay: "02-28",
        },
        {
          type: "open",
          dayOfWeek: 2,
          startTime: "10:00",
          endTime: "14:00",
          startDay: "02-01",
          endDay: "02-28",
        },
      ])
      expect(
        nextOpenOn(new Date("2020-02-03T16:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-04T10:00:00.000").toISOString())
    })
  })

  context("usually open for a season, but closed this week", () => {
    it("returns start of next week", () => {
      const schedule = [
        {
          type: "open",
          dayOfWeek: 3,
          startTime: "10:00",
          endTime: "17:00",
          startDay: "04-01",
          endDay: "09-30",
        },
        {
          type: "open",
          dayOfWeek: 4,
          startTime: "10:00",
          endTime: "17:00",
          startDay: "04-01",
          endDay: "09-30",
        },
        {
          type: "open",
          dayOfWeek: 5,
          startTime: "10:00",
          endTime: "17:00",
          startDay: "04-01",
          endDay: "09-30",
        },
        {
          type: "open",
          dayOfWeek: 6,
          startTime: "10:00",
          endTime: "17:00",
          startDay: "04-01",
          endDay: "09-30",
        },
        {
          type: "open",
          dayOfWeek: 7,
          startTime: "10:00",
          endTime: "17:00",
          startDay: "04-01",
          endDay: "09-30",
        },
        {type: "closed", startDay: "06-23", endDay: "06-27"},
      ] as Schedule

      const {nextOpenOn} = openingHours(schedule)

      expect(
        nextOpenOn(new Date("2021-06-21T12:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2021-06-30T10:00:00.000").toISOString())
    })
  })

  context("usually open all week but closed this week", () => {
    it("returns the day after the closed period ends", () => {
      const {nextOpenOn} = openingHours([
        {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 6, startTime: "10:00", endTime: "14:00"},
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "14:00"},
        {type: "closed", startDay: "01-27", endDay: "02-02"},
      ])
      expect(
        nextOpenOn(new Date("2020-01-27T12:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-02-03T10:00:00.000").toISOString())
    })
  })

  context("Opens on Wednesdays and public holidays", () => {
    it("returns Monday", () => {
      const {nextOpenOn} = openingHours(
        [
          {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
          {
            type: "publicHoliday",
            isOpen: true,
            startTime: "08:00",
            endTime: "16:00",
          },
        ],
        {publicHolidays: ["2020-01-06"]},
      )

      expect(
        nextOpenOn(new Date("2020-01-03T11:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-01-06T08:00:00.000").toISOString())
    })
  })

  context("usually open on Monday, but closes on bank holidays", () => {
    it("returns Tuesday", () => {
      const {nextOpenOn} = openingHours(
        [
          {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "14:00"},
          {type: "open", dayOfWeek: 2, startTime: "10:00", endTime: "14:00"},
          {type: "open", dayOfWeek: 3, startTime: "10:00", endTime: "14:00"},
          {type: "open", dayOfWeek: 4, startTime: "10:00", endTime: "14:00"},
          {type: "open", dayOfWeek: 5, startTime: "10:00", endTime: "14:00"},
          {
            type: "publicHoliday",
            isOpen: false,
          },
        ],
        {publicHolidays: ["2020-01-06"]},
      )

      expect(
        nextOpenOn(new Date("2020-01-03T17:00:00.000"))?.toISOString(),
      ).to.eq(new Date("2020-01-07T10:00:00.000").toISOString())
    })
  })

  context(
    "Public holidays are open, and a public holiday from the past is supplied",
    () => {
      it("returns the next open day", () => {
        const {nextOpenOn} = openingHours(
          [
            {
              type: "open",
              dayOfWeek: 6,
              startTime: "11:00",
              endTime: "18:00",
              startDay: "05-01",
              endDay: "10-31",
            },
            {
              type: "publicHoliday",
              isOpen: true,
              startTime: "11:00",
              endTime: "18:00",
            },
          ],
          {publicHolidays: ["2021-04-05", "2021-05-03", "2021-05-31"]},
        )

        expect(
          nextOpenOn(new Date("2021-04-14T11:36:00.000"))?.toISOString(),
        ).to.eq(new Date("2021-05-01T11:00:00.000").toISOString())
      })
    },
  )
})

describe("isOpenOnDate", () => {
  context("A date on an open day", () => {
    it("return true", () => {
      const {isOpenOnDate} = openingHours([
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "18:00"},
      ])

      expect(isOpenOnDate(new Date("2020-12-06"))).to.eq(true)
    })
  })

  context("A date on a non-open day due to the day of the week", () => {
    it("return false", () => {
      const {isOpenOnDate} = openingHours([
        {type: "open", dayOfWeek: 7, startTime: "10:00", endTime: "18:00"},
      ])

      expect(isOpenOnDate(new Date("2020-12-05"))).to.eq(false)
    })
  })

  context("A date on a non-open day due to the season being over", () => {
    it("return false", () => {
      const {isOpenOnDate} = openingHours([
        {
          type: "open",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "18:00",
          startDay: "10-01",
          endDay: "12-06",
        },
      ])

      expect(isOpenOnDate(new Date("2020-12-07"))).to.eq(false)
    })
  })

  context("A date on an explicitly closed day", () => {
    it("return false", () => {
      const {isOpenOnDate} = openingHours([
        {
          type: "closed",
          startDay: "10-01",
          endDay: "10-03",
        },
      ])

      expect(isOpenOnDate(new Date("2020-10-02"))).to.eq(false)
    })
  })

  context("A date on a public holiday, when public holidays are open", () => {
    it("returns true", () => {
      const {isOpenOnDate} = openingHours(
        [
          {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "18:00"},
          {
            type: "publicHoliday",
            isOpen: true,
            startTime: "10:00",
            endTime: "18:00",
          },
        ],
        {publicHolidays: ["2020-12-04"]},
      )

      expect(isOpenOnDate(new Date("2020-12-04"))).to.eq(true)
    })
  })

  context("A date on a public holiday, when public holidays are closed", () => {
    it("returns false", () => {
      const {isOpenOnDate} = openingHours(
        [
          {type: "open", dayOfWeek: 1, startTime: "10:00", endTime: "18:00"},
          {
            type: "publicHoliday",
            isOpen: false,
          },
        ],
        {publicHolidays: ["2020-12-04"]},
      )

      expect(isOpenOnDate(new Date("2020-12-04"))).to.eq(false)
    })
  })
})
