import * as R from "ramda"
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
  Su: Day.Sunday,
  Mo: Day.Monday,
  Tu: Day.Tuesday,
  We: Day.Wednesday,
  Th: Day.Thursday,
  Fr: Day.Friday,
  Sa: Day.Saturday,
  PH: PUBLIC_HOLIDAY_DAY,
}

function getDay(text: string): Day {
  return dayHash[text] ?? Day.Monday
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
  [true, /^\d{2}:\d{2}/g, TokenKind.Time],

  [true, /^-/g, TokenKind.To],
  [true, /^;/g, TokenKind.ExpressionSeperator],
  [true, /^,/g, TokenKind.InternalSeperator],
  [true, /^$/g, TokenKind.EOF],

  [false, /^\s+/g, TokenKind.Space],
])

type DaySpan = [Token<TokenKind.Day>, Token<TokenKind.To>, Token<TokenKind.Day>]

type TimeSpan = [
  Token<TokenKind.Time>,
  Token<TokenKind.To>,
  Token<TokenKind.Time>,
]

const makeDayArray = (dayPart: DaySpan | Token<TokenKind.Day>): Array<Day> => {
  if ("length" in dayPart) {
    return R.reduce<number, Array<Day>>(
      (memo, item) => {
        if (item < getDay(dayPart[0].text)) {
          return memo
        }

        if (item > getDay(dayPart[2].text)) {
          return memo
        }

        return [...memo, item]
      },
      [],
      R.times(R.add(0), 7),
    )
  }

  return [getDay(dayPart.text)]
}

const buildSchedule = (
  days: Array<Day>,
  timePart: Array<TimeSpan> | Token<TokenKind.DayOff> | undefined,
) => {
  if (timePart === undefined) {
    return R.map(
      (dayOfWeek) => ({
        type: "open" as const,
        dayOfWeek,
        start: "00:00",
        end: "00:00",
      }),
      days,
    )
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

  return R.chain(
    (dayOfWeek) =>
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
    days,
  )
}

const combineSchedules = (
  prevSchedule: ParsedSchedule,
  nextSchedule: ParsedSchedule,
) => {
  return R.flatten([
    R.reject(
      (oldSpan) =>
        R.any(
          (newSpan) =>
            "dayOfWeek" in newSpan &&
            "dayOfWeek" in oldSpan &&
            newSpan.dayOfWeek === oldSpan.dayOfWeek,
          nextSchedule,
        ),
      prevSchedule,
    ),
    nextSchedule,
  ])
}

const EXPR = rule<TokenKind, ParsedSchedule>()
const SCHED = rule<TokenKind, ParsedSchedule>()

EXPR.setPattern(
  apply(
    seq(
      apply(
        alt(
          seq(tok(TokenKind.Day), tok(TokenKind.To), tok(TokenKind.Day)),
          tok(TokenKind.Day),
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
