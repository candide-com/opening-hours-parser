import {
  OpenSpan,
  PublicHoliday,
  Schedule,
  Day,
  Month,
  isOpenSpan,
  ClosedDateSpan,
} from "./types"
import {
  Token,
  alt,
  apply,
  kright,
  list_sc as listSc,
  lrec_sc as lrecSc,
  nil,
  rule,
  seq,
  tok,
} from "typescript-parsec"
import {TokenKind} from "./lexer"
import {fillLeftTuple} from "./utils"

const PUBLIC_HOLIDAY_DAY = 8

interface DayOff {
  type: "off"
  dayOfWeek: Day
}

interface DayRange {
  startDay: string
  endDay: string
}

interface TimeSpan {
  startTime: string
  endTime: string
}

interface YearRange {
  startYear: number
  endYear?: number
}

type ParsedSpan = OpenSpan | ClosedDateSpan | PublicHoliday | DayOff

type ParsedSchedule = Array<ParsedSpan>

const dayHash: Record<string, Day> = {
  SU: Day.Sunday,
  MO: Day.Monday,
  TU: Day.Tuesday,
  WE: Day.Wednesday,
  TH: Day.Thursday,
  FR: Day.Friday,
  SA: Day.Saturday,
  PH: PUBLIC_HOLIDAY_DAY,
}

const monthHash: Record<string, Month> = {
  JAN: Month.January,
  FEB: Month.February,
  MAR: Month.March,
  APR: Month.April,
  MAY: Month.May,
  JUN: Month.June,
  JUL: Month.July,
  AUG: Month.August,
  SEP: Month.September,
  OCT: Month.October,
  NOV: Month.November,
  DEC: Month.December,
}

const endDayOfMonthHash: Record<string, Month> = {
  JAN: 31,
  FEB: 29,
  MAR: 31,
  APR: 30,
  MAY: 31,
  JUN: 30,
  JUL: 31,
  AUG: 31,
  SEP: 30,
  OCT: 31,
  NOV: 30,
  DEC: 31,
}

const fullWeek: Array<Day> = [1, 2, 3, 4, 5, 6, 7]

function getDay(text: string): Day {
  return dayHash[text.toUpperCase()] ?? Day.Monday
}

function getMonth(text: string): Month {
  return monthHash[text.toUpperCase()] ?? Month.January
}

function getEndDayOfMonth(text: string): number {
  return endDayOfMonthHash[text.toUpperCase()] ?? 31
}

function isDayOff(span: ParsedSpan): span is DayOff {
  return (span as DayOff).type === "off"
}

export function removeDaysOff(arr: ParsedSchedule): Schedule {
  return arr.filter(
    (span): span is OpenSpan | ClosedDateSpan | PublicHoliday =>
      !isDayOff(span),
  )
}

function makeDayRange(
  tokens: [Token<TokenKind.Day>, Token<TokenKind.To>, Token<TokenKind.Day>],
): Array<Day> {
  const startDay = getDay(tokens[0].text)
  let endDay = getDay(tokens[2].text)

  if (endDay < startDay) {
    endDay = endDay + 7
  }

  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].reduce(
    (memo: Array<Day>, item: number) => {
      if (item < startDay) {
        return memo
      }

      if (item > endDay) {
        return memo
      }

      return [...memo, item > 7 ? item - 7 : item]
    },
    [],
  )
}

function makeYear(
  token:
    | Token<TokenKind.Year>
    | [Token<TokenKind.Year>, Token<TokenKind.Plus>]
    | [Token<TokenKind.Year>, Token<TokenKind.To>, Token<TokenKind.Year>],
): YearRange {
  if ("kind" in token) {
    const year = parseInt(token.text, 10)
    return {startYear: year, endYear: year}
  }

  if (token.length === 2) {
    const startYear = parseInt(token[0].text, 10)
    return {startYear}
  }

  const startYear = parseInt(token[0].text, 10)
  const endYear = parseInt(token[2].text, 10)
  return {startYear, endYear}
}

function makeMonth(
  tokens: Array<
    | [
        Token<TokenKind.Month>,
        Token<TokenKind.Num>,
        Token<TokenKind.To>,
        Token<TokenKind.Month>,
        Token<TokenKind.Num>,
      ]
    | [Token<TokenKind.Month>, Token<TokenKind.Num>]
    | Token<TokenKind.Month>
  >,
): Array<DayRange> {
  return tokens.flatMap((monthTokens) => {
    if ("kind" in monthTokens) {
      const startDay = `${getMonth(monthTokens.text)
        .toString()
        .padStart(2, "0")}-01`

      const endDay = `${getMonth(monthTokens.text)
        .toString()
        .padStart(2, "0")}-${getEndDayOfMonth(monthTokens.text)}`

      return {startDay, endDay}
    }

    const startDay = `${getMonth(monthTokens[0].text)
      .toString()
      .padStart(2, "0")}-${monthTokens[1].text}`

    const endDay =
      monthTokens.length === 2
        ? startDay
        : `${getMonth(monthTokens[3].text).toString().padStart(2, "0")}-${
            monthTokens[4].text
          }`

    return {startDay, endDay}
  })
}

function makeTimeSpan(
  token:
    | [Token<TokenKind.Time>, Token<TokenKind.To>, Token<TokenKind.Time>]
    | Token<TokenKind.DayOff>
    | undefined,
): TimeSpan | "day off" {
  if (token === undefined) {
    return {startTime: "00:00", endTime: "24:00"}
  }

  if ("kind" in token) {
    return "day off" as const
  }

  return {
    startTime: token[0].text,
    endTime: token[2].text,
  }
}

function combineDaysAndTimes(
  yearRange: YearRange | undefined,
  month: DayRange | undefined,
  daysAndTimes: Array<[Array<Day> | undefined, TimeSpan | "day off"]>,
): ParsedSchedule {
  return fillLeftTuple(daysAndTimes).flatMap(([days, time]) => {
    if (time === "day off") {
      if (days === undefined && month !== undefined) {
        return {
          type: "closed" as const,
          ...month,
        }
      }

      return (days ?? fullWeek).map((dayOfWeek) =>
        (dayOfWeek as number) === PUBLIC_HOLIDAY_DAY
          ? {
              type: "publicHoliday" as const,
              isOpen: false as const,
            }
          : {
              type: "off" as const,
              dayOfWeek,
            },
      )
    }

    return (days ?? fullWeek).map((dayOfWeek) => {
      const span =
        (dayOfWeek as number) === PUBLIC_HOLIDAY_DAY
          ? {
              type: "publicHoliday" as const,
              isOpen: true as const,
              ...time,
            }
          : {
              type: "open" as const,
              dayOfWeek,
              ...time,
              ...month,
              ...yearRange,
            }

      return span as ParsedSpan
    })
  })
}

function buildSchedule(
  yearRange: YearRange | undefined,
  months: Array<DayRange> | undefined,
  daysAndTimes: Array<[Array<Day> | undefined, TimeSpan | "day off"]>,
): ParsedSchedule {
  return months === undefined
    ? combineDaysAndTimes(yearRange, undefined, daysAndTimes)
    : months.flatMap((month) =>
        combineDaysAndTimes(yearRange, month, daysAndTimes),
      )
}

function coversSameDates(span1: ParsedSpan, span2: ParsedSpan): boolean {
  if (isDayOff(span1) || isDayOff(span2)) {
    return true
  }

  if (!isOpenSpan(span1) || !isOpenSpan(span2)) {
    return true
  }

  if (span1.startYear !== span2.startYear && span1.endYear !== span2.endYear) {
    return false
  }

  if (
    span1.startDay === undefined ||
    span1.endDay === undefined ||
    span2.startDay === undefined ||
    span2.endDay === undefined
  ) {
    return true
  }

  return span1.startDay === span2.startDay && span1.endDay === span2.endDay
}

function combineSchedules(
  prevSchedule: ParsedSchedule,
  nextSchedule: ParsedSchedule,
): ParsedSchedule {
  return [
    prevSchedule.filter(
      (oldSpan) =>
        !nextSchedule.some(
          (newSpan) =>
            "dayOfWeek" in newSpan &&
            "dayOfWeek" in oldSpan &&
            newSpan.dayOfWeek === oldSpan.dayOfWeek &&
            coversSameDates(oldSpan, newSpan),
        ),
    ),
    nextSchedule,
  ].flat()
}

const yearPart = rule<TokenKind, YearRange | undefined>()
const monthPart = rule<TokenKind, Array<DayRange> | undefined>()
const dayPart = rule<TokenKind, Array<Day> | undefined>()
const timePart = rule<TokenKind, TimeSpan | "day off">()

const repeatingExpression = rule<TokenKind, ParsedSchedule>()
const scheduleParser = rule<TokenKind, ParsedSchedule>()

yearPart.setPattern(
  alt(
    apply(
      alt(
        tok(TokenKind.Year),
        seq(tok(TokenKind.Year), tok(TokenKind.Plus)),
        seq(tok(TokenKind.Year), tok(TokenKind.To), tok(TokenKind.Year)),
      ),
      makeYear,
    ),
    nil(),
  ),
)

monthPart.setPattern(
  alt(
    apply(
      listSc(
        alt(
          seq(
            tok(TokenKind.Month),
            tok(TokenKind.Num),
            tok(TokenKind.To),
            tok(TokenKind.Month),
            tok(TokenKind.Num),
          ),
          seq(tok(TokenKind.Month), tok(TokenKind.Num)),
          tok(TokenKind.Month),
        ),
        tok(TokenKind.InternalSeperator),
      ),
      makeMonth,
    ),
    nil(),
  ),
)

dayPart.setPattern(
  alt(
    apply(
      listSc(
        alt(
          apply(
            seq(tok(TokenKind.Day), tok(TokenKind.To), tok(TokenKind.Day)),
            makeDayRange,
          ),
          apply(tok(TokenKind.Day), (token) => [getDay(token.text)]),
        ),
        tok(TokenKind.InternalSeperator),
      ),
      (days) => days.flat(),
    ),
    nil(),
  ),
)

timePart.setPattern(
  apply(
    alt(
      seq(tok(TokenKind.Time), tok(TokenKind.To), tok(TokenKind.Time)),
      tok(TokenKind.DayOff),
      nil(),
    ),
    makeTimeSpan,
  ),
)

repeatingExpression.setPattern(
  alt(
    apply(tok(TokenKind.AllWeek), () =>
      buildSchedule(undefined, undefined, [
        [fullWeek, makeTimeSpan(undefined)],
      ]),
    ),
    apply(
      seq(
        yearPart,
        monthPart,
        listSc(seq(dayPart, timePart), tok(TokenKind.InternalSeperator)),
      ),
      ([yearRange, months, daysAndTimes]) =>
        buildSchedule(yearRange, months, daysAndTimes),
    ),
  ),
)

scheduleParser.setPattern(
  lrecSc(
    repeatingExpression,
    kright(tok(TokenKind.ExpressionSeperator), repeatingExpression),
    combineSchedules,
  ),
)

export const parser = scheduleParser
