import { OpenSpan, PublicHoliday, Schedule, Day, ClosedDateSpan } from "./types";
import { TokenKind } from "./lexer";
interface DayOff {
    type: "off";
    dayOfWeek: Day;
}
declare type ParsedSpan = OpenSpan | ClosedDateSpan | PublicHoliday | DayOff;
declare type ParsedSchedule = Array<ParsedSpan>;
export declare function removeDaysOff(arr: ParsedSchedule): Schedule;
export declare const parser: import("typescript-parsec").Rule<TokenKind, ParsedSchedule>;
export {};
