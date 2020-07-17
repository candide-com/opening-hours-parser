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

type DaySpan =
  | [Token<TokenKind.Day>, Token<TokenKind.To>, Token<TokenKind.Day>]
  | [
      Token<TokenKind.Day>,
      Token<TokenKind.InternalSeperator>,
      Token<TokenKind.Day>,
    ]

type TimeSpan = [
  Token<TokenKind.Time>,
  Token<TokenKind.To>,
  Token<TokenKind.Time>,
]

const makeDayArray = (
  dayPart:
    | DaySpan
    | Token<TokenKind.Day>
    | Token<TokenKind.AllWeek>
    | undefined,
): Array<Day> => {
  if (dayPart === undefined) {
    return [1, 2, 3, 4, 5, 6, 7]
  }

  if ("length" in dayPart) {
    if (dayPart[1].kind === TokenKind.InternalSeperator) {
      return [getDay(dayPart[0].text), getDay(dayPart[2].text)]
    }

    const startDay = getDay(dayPart[0].text)
    let endDay = getDay(dayPart[2].text)

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

  if (dayPart.kind === TokenKind.AllWeek) {
    return [1, 2, 3, 4, 5, 6, 7]
  }

  return [getDay(dayPart.text)]
}

const makeMonthPart = (
  months:
    | [
        Token<TokenKind.Month>,
        Token<TokenKind.Num>,
        Token<TokenKind.To>,
        Token<TokenKind.Month>,
        Token<TokenKind.Num>,
      ]
    | undefined,
): {startDay: string; endDay: string} | null => {
  if (months === undefined) {
    return null
  }

  return {
    startDay: `${getMonth(months[0].text).toString().padStart(2, "0")}-${
      months[1].text
    }`,
    endDay: `${getMonth(months[3].text).toString().padStart(2, "0")}-${
      months[4].text
    }`,
  }
}

const buildSchedule = (
  months: {startDay: string; endDay: string} | null,
  days: Array<Day>,
  timePart: Array<TimeSpan> | Token<TokenKind.DayOff> | undefined,
): ParsedSchedule => {
  if (timePart === undefined) {
    return days.map((dayOfWeek) => ({
      type: "open" as const,
      dayOfWeek,
      start: "00:00",
      end: "24:00",
      ...(months ?? {}),
    }))
  }

  if ("kind" in timePart) {
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
    timePart.map((time) =>
      dayOfWeek === PUBLIC_HOLIDAY_DAY
        ? {
            type: "publicHoliday" as const,
            isOpen: true,
            start: time[0].text,
            end: time[2].text,
          }
        : {
            type: "open" as const,
            dayOfWeek,
            start: time[0].text,
            end: time[2].text,
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
        makeMonthPart,
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
      alt(
        listSc(
          seq(tok(TokenKind.Time), tok(TokenKind.To), tok(TokenKind.Time)),
          tok(TokenKind.InternalSeperator),
        ),
        tok(TokenKind.DayOff),
        nil(),
      ),
    ),
    ([monthPart, dayPart, timePart]) =>
      buildSchedule(monthPart, dayPart, timePart),
  ),
)

SCHED.setPattern(
  lrecSc(
    EXPR,
    kright(tok(TokenKind.ExpressionSeperator), EXPR),
    combineSchedules,
  ),
)

export const parse = (pattern: string): Schedule =>
  removeDaysOff(
    expectSingleResult(expectEOF(SCHED.parse(lexer.parse(pattern)))),
  )
