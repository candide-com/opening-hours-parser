import {buildLexer} from "typescript-parsec"

export enum TokenKind {
  // Semantic
  Year,
  Month,
  Day,
  Num,
  Time,

  // Spcial cases
  DayOff,
  AllWeek,

  // Symbols
  Plus,
  To,
  ExpressionSeperator,
  InternalSeperator,
  EOF,

  // Non-capturing
  Space,
  OptionalSeperator,
}

// Matches on longest string first, then earlier in array
export const lexer = buildLexer([
  // Number based
  [true, /^\d{4}/g, TokenKind.Year],
  [true, /^\d{2}/g, TokenKind.Num],
  [true, /^\d{2}:\d{2}/g, TokenKind.Time],
  [true, /^24\/7/g, TokenKind.AllWeek],

  // Letter based
  [true, /^off/g, TokenKind.DayOff], // has to be above Month to take priority
  [true, /^[a-zA-Z]{3}/g, TokenKind.Month],
  [true, /^[a-zA-Z]{2}/g, TokenKind.Day],

  // Symbol based
  [true, /^\+/g, TokenKind.Plus],
  [true, /^-/g, TokenKind.To],
  [true, /^;/g, TokenKind.ExpressionSeperator],
  [true, /^,/g, TokenKind.InternalSeperator],
  [true, /^$/g, TokenKind.EOF],

  // Non-capturing
  [false, /^\s+/g, TokenKind.Space],
  [false, /^:/g, TokenKind.OptionalSeperator],
])
