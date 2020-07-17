import {OpenSpan, PublicHoliday, Schedule, Day, Month} from "./types"
import {
  Token,
  alt,
  apply,
  buildLexer,
  expectEOF,
  expectSingleResult,
  kright,
  list_sc as listSc,
  lrec_sc as lrecSc,
  nil,
  rule,
  seq,
  tok,
} from "typescript-parsec"

const PUBLIC_HOLIDAY_DAY = 8

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

function getDay(text: string): Day {
  return dayHash[text.toUpperCase()] ?? Day.Monday
}

function getMonth(text: string): Month {
  return monthHash[text.toUpperCase()] ?? Month.January
}

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

const isDayOff = (span: OpenSpan | PublicHoliday | DayOff): span is DayOff =>
  (span as DayOff).type === "off"

const removeDaysOff = (
  arr: Array<OpenSpan | PublicHoliday | DayOff>,
): Schedule =>
  arr.filter((span): span is OpenSpan | PublicHoliday => !isDayOff(span))

type ParsedSchedule = Array<OpenSpan | PublicHoliday | DayOff>

enum TokenKind {
  // Semantic
  Month,
  Day,
  Num,
  Time,

  // Spcial cases
  DayOff,
  AllWeek,

  // Seprators
  To,
  ExpressionSeperator,
  InternalSeperator,
  EOF,

  // Non-capturing
  Space,
}

// Matches on longest string first, then earlier in array
const lexer = buildLexer([
  // Number based
  [true, /^\d{2}/g, TokenKind.Num],
  [true, /^\d{2}:\d{2}/g, TokenKind.Time],
  [true, /^24\/7/g, TokenKind.AllWeek],

  // Letter based
  [true, /^off/g, TokenKind.DayOff], // has to be above Month to take priority
  [true, /^[a-zA-Z]{3}/g, TokenKind.Month],
  [true, /^[a-zA-Z]{2}/g, TokenKind.Day],

  // Symbol based
  [true, /^-/g, TokenKind.To],
  [true, /^;/g, TokenKind.ExpressionSeperator],
  [true, /^,/g, TokenKind.InternalSeperator],
  [true, /^$/g, TokenKind.EOF],

  // Non-capturing
  [false, /^\s+/g, TokenKind.Space],
])

const makeDayArray = (
  dayTokens:
    | [Token<TokenKind.Day>, Token<TokenKind.To>, Token<TokenKind.Day>]
    | [
        Token<TokenKind.Day>,
        Token<TokenKind.InternalSeperator>,
        Token<TokenKind.Day>,
      ]
    | Token<TokenKind.Day>
    | Token<TokenKind.AllWeek>
    | undefined,
): Array<Day> => {
  if (dayTokens === undefined) {
    return [1, 2, 3, 4, 5, 6, 7]
  }

  if ("length" in dayTokens) {
    if (dayTokens[1].kind === TokenKind.InternalSeperator) {
      return [getDay(dayTokens[0].text), getDay(dayTokens[2].text)]
    }

    const startDay = getDay(dayTokens[0].text)
    let endDay = getDay(dayTokens[2].text)

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

  if (dayTokens.kind === TokenKind.AllWeek) {
    return [1, 2, 3, 4, 5, 6, 7]
  }

  return [getDay(dayTokens.text)]
}

const makeMonthDefinition = (
  monthTokens:
    | [
        Token<TokenKind.Month>,
        Token<TokenKind.Num>,
        Token<TokenKind.To>,
        Token<TokenKind.Month>,
        Token<TokenKind.Num>,
      ]
    | undefined,
): DayRange | null => {
  if (monthTokens === undefined) {
    return null
  }

  return {
    startDay: `${getMonth(monthTokens[0].text).toString().padStart(2, "0")}-${
      monthTokens[1].text
    }`,
    endDay: `${getMonth(monthTokens[3].text).toString().padStart(2, "0")}-${
      monthTokens[4].text
    }`,
  }
}

const makeTimesArray = (
  timeTokens:
    | Array<[Token<TokenKind.Time>, Token<TokenKind.To>, Token<TokenKind.Time>]>
    | Token<TokenKind.DayOff>
    | undefined,
): Array<TimeSpan> | "day off" => {
  if (timeTokens === undefined) {
    return [{startTime: "00:00", endTime: "24:00"}]
  }

  if ("kind" in timeTokens) {
    return "day off" as const
  }

  return timeTokens.map((time) => ({
    startTime: time[0].text,
    endTime: time[2].text,
  }))
}

const buildSchedule = (
  months: DayRange | null,
  days: Array<Day>,
  times: Array<TimeSpan> | "day off",
): ParsedSchedule => {
  if (times === "day off") {
    return days.map((dayOfWeek) =>
      dayOfWeek === PUBLIC_HOLIDAY_DAY
        ? {type: "publicHoliday" as const, isOpen: false as const}
        : {
            type: "off" as const,
            dayOfWeek,
          },
    )
  }

  return days.flatMap((dayOfWeek) =>
    times.map((time) =>
      dayOfWeek === PUBLIC_HOLIDAY_DAY
        ? {
            type: "publicHoliday" as const,
            isOpen: true,
            ...(time ?? {}),
          }
        : {
            type: "open" as const,
            dayOfWeek,
            ...(time ?? {}),
            ...(months ?? {}),
          },
    ),
  )
}

const combineSchedules = (
  prevSchedule: ParsedSchedule,
  nextSchedule: ParsedSchedule,
) => {
  return [
    prevSchedule.filter(
      (oldSpan) =>
        !nextSchedule.some(
          (newSpan) =>
            "dayOfWeek" in newSpan &&
            "dayOfWeek" in oldSpan &&
            newSpan.dayOfWeek === oldSpan.dayOfWeek,
        ),
    ),
    nextSchedule,
  ].flat()
}

const EXPR = rule<TokenKind, ParsedSchedule>()
const SCHED = rule<TokenKind, ParsedSchedule>()

EXPR.setPattern(
  apply(
    seq(
      apply(
        alt(
          seq(
            tok(TokenKind.Month),
            tok(TokenKind.Num),
            tok(TokenKind.To),
            tok(TokenKind.Month),
            tok(TokenKind.Num),
          ),
          nil(),
        ),
        makeMonthDefinition,
      ),
      apply(
        alt(
          seq(tok(TokenKind.Day), tok(TokenKind.To), tok(TokenKind.Day)),
          seq(
            tok(TokenKind.Day),
            tok(TokenKind.InternalSeperator),
            tok(TokenKind.Day),
          ),
          tok(TokenKind.Day),
          tok(TokenKind.AllWeek),
          nil(),
        ),
        makeDayArray,
      ),
      apply(
        alt(
          listSc(
            seq(tok(TokenKind.Time), tok(TokenKind.To), tok(TokenKind.Time)),
            tok(TokenKind.InternalSeperator),
          ),
          tok(TokenKind.DayOff),
          nil(),
        ),
        makeTimesArray,
      ),
    ),
    ([months, days, times]) => buildSchedule(months, days, times),
  ),
)

SCHED.setPattern(
  lrecSc(
    EXPR,
    kright(tok(TokenKind.ExpressionSeperator), EXPR),
    combineSchedules,
  ),
)

export const parse = (pattern: string): Schedule => {
  if (pattern.trim() === "") {
    return []
  }

  return removeDaysOff(
    expectSingleResult(expectEOF(SCHED.parse(lexer.parse(pattern)))),
  )
}
