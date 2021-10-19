import {expect} from "chai"
import {openingHours, Options, parse} from "../"

const zonedOpeningHours = (unparsed: string, options?: Options) =>
  openingHours(parse(unparsed), {...options, timezone: "UTC"})

function test({
  input,
  open = [],
  closed = [],
}: {
  input: string
  open?: Array<Date>
  closed?: Array<Date>
}) {
  it(input, () => {
    const {isOpenOn} = zonedOpeningHours(input)
    for (const openDate of open) {
      expect(isOpenOn(openDate)).to.eql(true, openDate.toISOString())
    }
    for (const closedDate of closed) {
      expect(isOpenOn(closedDate)).to.eql(false, closedDate.toISOString())
    }
  })
}

describe("isOpenOn", () => {
  context("single year", () => {
    test({
      input: "2020 Mo-Su",
      open: [new Date("2020-01-01T12:00:00.000Z")],
      closed: [
        new Date("2019-01-01T12:00:00.000Z"),
        new Date("2021-01-01T12:00:00.000Z"),
      ],
    })
  })

  context("year ranges", () => {
    test({
      input: "2020-2024 Mo-Su",
      open: [
        new Date("2020-01-01T12:00:00.000Z"),
        new Date("2022-01-01T12:00:00.000Z"),
        new Date("2024-01-01T12:00:00.000Z"),
      ],
      closed: [
        new Date("2019-01-01T12:00:00.000Z"),
        new Date("2025-01-01T12:00:00.000Z"),
      ],
    })
  })

  context("unbounded year ranges", () => {
    test({
      input: "2020+ Mo-Su",
      open: [
        new Date("2020-01-01T12:00:00.000Z"),
        new Date("2040-01-01T12:00:00.000Z"),
      ],
      closed: [new Date("2019-01-01T12:00:00.000Z")],
    })
  })

  context("two year ranges with different times", () => {
    test({
      input: "2020-2024 Mo-Su 12:00-18:00; 2025+ Mo-Su 12:00-20:00",
      open: [
        new Date("2020-01-01T12:00:00.000Z"),
        new Date("2025-01-01T20:00:00.000Z"),
      ],
      closed: [
        new Date("2019-01-01T12:00:00.000Z"),
        new Date("2020-01-01T20:00:00.000Z"),
      ],
    })
  })

  context("one year and one default", () => {
    test({
      input: "Mo-Su 12:00-20:00; 2020 Mo-Su 12:00-18:00",
      open: [
        new Date("2020-01-01T12:00:00.000Z"),
        new Date("2019-01-01T20:00:00.000Z"),
      ],
      closed: [new Date("2020-01-01T19:00:00.000Z")],
    })
  })

  context("one default and one year", () => {
    test({
      input: "2020 Mo-Su 12:00-20:00; Mo-Su 12:00-18:00",
      open: [
        new Date("2020-01-01T12:00:00.000Z"),
        new Date("2019-01-01T18:00:00.000Z"),
      ],
      closed: [new Date("2020-01-01T19:00:00.000Z")],
    })
  })

  context("one month and one year", () => {
    test({
      input: "Dec Mo-Su 12:00-20:00; 2020 Mo-Su 12:00-18:00",
      open: [
        new Date("2020-01-01T12:00:00.000Z"),
        new Date("2019-12-01T18:00:00.000Z"),
      ],
      closed: [new Date("2019-01-01T19:00:00.000Z")],
    })
  })

  context("lunch break", () => {
    test({
      input: "Mo-Su 10:00-12:00, 13:00-17:00",
      open: [new Date("2020-06-01T10:30:00.000Z")],
      closed: [
        new Date("2020-06-01T12:30:00.000Z"),
        new Date("2020-06-01T17:30:00.000Z"),
      ],
    })
  })

  context("override", () => {
    test({
      input: "Mo-Su 10:00-12:00; Mo-Su 13:00-17:00",
      open: [new Date("2020-06-01T13:30:00.000Z")],
      closed: [new Date("2020-06-01T10:30:00.000Z")],
    })
  })

  // context("one month and one default", () => {
  //   test({
  //     input: "Mo-Su 10:00-12:00; Dec Mo-Su 13:00-17:00",
  //     open: [new Date("2020-06-01T10:30:00.000Z")],
  //     closed: [new Date("2020-12-01T10:30:00.000Z")],
  //   })
  // })

  context("monday and tuesday", () => {
    test({
      input: "2020 Tu 10:00-12:00; 2020 Mo 13:00-17:00",
      open: [
        new Date("2020-12-07T13:30:00.000Z"),
        new Date("2020-12-08T10:30:00.000Z"),
      ],
      closed: [new Date("2020-12-07T10:30:00.000Z")],
    })
  })
})
