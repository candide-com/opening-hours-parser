import {expect} from "chai"
import {openingHours, Options, parse} from "../"

const zonedOpeningHours = (unparsed: string, options?: Options) =>
  openingHours(parse(unparsed), {...options, timezone: "Europe/London"})

function test({
  input,
  open = [],
  closed = [],
}: {
  input: string
  open?: Date[]
  closed?: Date[]
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
      closed: [new Date("2020-01-01T20:00:00.000Z")],
    })
  })
})
