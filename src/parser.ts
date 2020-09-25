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

function makeDayToDaySpan(
  days: [Token<TokenKind.Day>, Token<TokenKind.To>, Token<TokenKind.Day>],
) {
  const startDay = getDay(days[0].text)
  let endDay = getDay(days[2].text)

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

const makeDayArray = (
  dayTokens:
    | Array<
        | [Token<TokenKind.Day>, Token<TokenKind.To>, Token<TokenKind.Day>]
        | Token<TokenKind.Day>
      >
    | Token<TokenKind.AllWeek>
    | undefined,
): Array<Day> => {
  if (dayTokens === undefined) {
    return [1, 2, 3, 4, 5, 6, 7]
  }

  if (Array.isArray(dayTokens)) {
    return dayTokens.flatMap((days) => {
      if (Array.isArray(days)) {
        return makeDayToDaySpan(days)
      }

      return getDay(days.text)
    })
  }

  return [1, 2, 3, 4, 5, 6, 7]
}

const makeMonthDefinition = (
  tokens:
    | Array<
        | [
            Token<TokenKind.Month>,
            Token<TokenKind.Num>,
            Token<TokenKind.To>,
            Token<TokenKind.Month>,
            Token<TokenKind.Num>,
          ]
        | [Token<TokenKind.Month>, Token<TokenKind.Num>]
        | Token<TokenKind.Month>
      >
    | undefined,
): Array<DayRange> | null => {
  if (tokens === undefined) {
    return null
  }

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
  months: Array<DayRange> | null,
  days: Array<Day>,
  times: Array<TimeSpan> | "day off",
): ParsedSchedule => {
  if (times === "day off") {
    if (months === null) {
      return days.map((dayOfWeek) =>
        dayOfWeek === PUBLIC_HOLIDAY_DAY
          ? {type: "publicHoliday" as const, isOpen: false as const}
          : {
              type: "off" as const,
              dayOfWeek,
            },
      )
    }

    return months.map((month) => ({
      type: "closed",
      startDay: month.startDay,
      endDay: month.endDay,
    }))
  }

  if (months == null) {
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
            },
      ),
    )
  }

  return months.flatMap((month) =>
    days.flatMap((dayOfWeek) =>
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
              ...(month ?? {}),
            },
      ),
    ),
  )
}

const coverSameDates = (span1: ParsedSpan, span2: ParsedSpan): boolean => {
  if (isDayOff(span1) || isDayOff(span2)) {
    return true
  }

  if (!isOpenSpan(span1) || !isOpenSpan(span2)) {
    return true
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

const combineSchedules = (
  prevSchedule: ParsedSchedule,
  nextSchedule: ParsedSchedule,
): ParsedSchedule => {
  return [
    prevSchedule.filter(
      (oldSpan) =>
        !nextSchedule.some(
          (newSpan) =>
            "dayOfWeek" in newSpan &&
            "dayOfWeek" in oldSpan &&
            newSpan.dayOfWeek === oldSpan.dayOfWeek &&
            coverSameDates(oldSpan, newSpan),
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
          nil(),
        ),
        makeMonthDefinition,
      ),
      apply(
        alt(
          listSc(
            alt(
              seq(tok(TokenKind.Day), tok(TokenKind.To), tok(TokenKind.Day)),
              tok(TokenKind.Day),
            ),
            tok(TokenKind.InternalSeperator),
          ),
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

export const parser = SCHED
