import {OpenSpan, PublicHoliday, Schedule, Day} from "./types"
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

function getDay(text: string): Day {
  return dayHash[text.toUpperCase()] ?? Day.Monday
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
  DayOff,
  Day,
  Time,
  AllWeek,

  // Seprators
  To,
  ExpressionSeperator,
  InternalSeperator,
  EOF,

  // No capture
  Space,
}

const lexer = buildLexer([
  [true, /^off/g, TokenKind.DayOff],
  [true, /^\w{2}/g, TokenKind.Day],
  [true, /^24\/7/g, TokenKind.AllWeek],
  [true, /^\d{2}:\d{2}/g, TokenKind.Time],

  [true, /^-/g, TokenKind.To],
  [true, /^;/g, TokenKind.ExpressionSeperator],
  [true, /^,/g, TokenKind.InternalSeperator],
  [true, /^$/g, TokenKind.EOF],

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
  dayPart: DaySpan | Token<TokenKind.Day> | Token<TokenKind.AllWeek>,
): Array<Day> => {
  if ("length" in dayPart) {
    if (dayPart[1].kind === TokenKind.InternalSeperator) {
      return [getDay(dayPart[0].text), getDay(dayPart[2].text)]
    }

    const startDay = getDay(dayPart[0].text)
    let endDay = getDay(dayPart[2].text)

    if (endDay < startDay) {
      endDay = endDay + 7
    }

    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].reduce(
      (memo: Array<Day>, item: number) => {
        if (item < startDay) {
          return memo
        }

        if (item > endDay) {
          return memo
        }

        return [...memo, item > 6 ? item - 7 : item]
      },
      [],
    )
  }

  if (dayPart.kind === TokenKind.AllWeek) {
    return [0, 1, 2, 3, 4, 5, 6]
  }

  return [getDay(dayPart.text)]
}

const buildSchedule = (
  days: Array<Day>,
  timePart: Array<TimeSpan> | Token<TokenKind.DayOff> | undefined,
): ParsedSchedule => {
  if (timePart === undefined) {
    return days.map((dayOfWeek) => ({
      type: "open" as const,
      dayOfWeek,
      start: "00:00",
      end: "24:00",
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
          seq(tok(TokenKind.Day), tok(TokenKind.To), tok(TokenKind.Day)),
          seq(
            tok(TokenKind.Day),
            tok(TokenKind.InternalSeperator),
            tok(TokenKind.Day),
          ),
          tok(TokenKind.Day),
          tok(TokenKind.AllWeek),
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
    ([dayPart, timePart]) => buildSchedule(dayPart, timePart),
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
