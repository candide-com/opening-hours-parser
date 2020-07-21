import { OpenSpan, PublicHoliday, Schedule, Day } from "./types";
import { TokenKind } from "./lexer";
interface DayOff {
    type: "off";
    dayOfWeek: Day;
}
export declare const removeDaysOff: (arr: Array<OpenSpan | PublicHoliday | DayOff>) => Schedule;
declare type ParsedSchedule = Array<OpenSpan | PublicHoliday | DayOff>;
export declare const parser: import("typescript-parsec").Rule<TokenKind, ParsedSchedule>;
export {};
