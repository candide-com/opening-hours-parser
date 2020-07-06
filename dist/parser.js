"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const types_1 = require("./types");
const typescript_parsec_1 = require("typescript-parsec");
const PUBLIC_HOLIDAY_DAY = 8;
const dayHash = {
    Su: types_1.Day.Sunday,
    Mo: types_1.Day.Monday,
    Tu: types_1.Day.Tuesday,
    We: types_1.Day.Wednesday,
    Th: types_1.Day.Thursday,
    Fr: types_1.Day.Friday,
    Sa: types_1.Day.Saturday,
    PH: PUBLIC_HOLIDAY_DAY,
};
function getDay(text) {
    var _a;
    return (_a = dayHash[text]) !== null && _a !== void 0 ? _a : types_1.Day.Monday;
}
const isDayOff = (span) => span.type === "off";
const removeDaysOff = (arr) => arr.filter((span) => !isDayOff(span));
var TokenKind;
(function (TokenKind) {
    // Semantic
    TokenKind[TokenKind["DayOff"] = 0] = "DayOff";
    TokenKind[TokenKind["Day"] = 1] = "Day";
    TokenKind[TokenKind["Time"] = 2] = "Time";
    // Seprators
    TokenKind[TokenKind["To"] = 3] = "To";
    TokenKind[TokenKind["ExpressionSeperator"] = 4] = "ExpressionSeperator";
    TokenKind[TokenKind["InternalSeperator"] = 5] = "InternalSeperator";
    TokenKind[TokenKind["EOF"] = 6] = "EOF";
    // No capture
    TokenKind[TokenKind["Space"] = 7] = "Space";
})(TokenKind || (TokenKind = {}));
const lexer = typescript_parsec_1.buildLexer([
    [true, /^off/g, TokenKind.DayOff],
    [true, /^\w{2}/g, TokenKind.Day],
    [true, /^\d{2}:\d{2}/g, TokenKind.Time],
    [true, /^-/g, TokenKind.To],
    [true, /^;/g, TokenKind.ExpressionSeperator],
    [true, /^,/g, TokenKind.InternalSeperator],
    [true, /^$/g, TokenKind.EOF],
    [false, /^\s+/g, TokenKind.Space],
]);
const makeDayArray = (dayPart) => {
    if ("length" in dayPart) {
        return [0, 1, 2, 3, 4, 5, 6].reduce((memo, item) => {
            if (item < getDay(dayPart[0].text)) {
                return memo;
            }
            if (item > getDay(dayPart[2].text)) {
                return memo;
            }
            return [...memo, item];
        }, []);
    }
    return [getDay(dayPart.text)];
};
const buildSchedule = (days, timePart) => {
    if (timePart === undefined) {
        return days.map((dayOfWeek) => ({
            type: "open",
            dayOfWeek,
            start: "00:00",
            end: "00:00",
        }));
    }
    if ("kind" in timePart) {
        return days.map((dayOfWeek) => dayOfWeek === PUBLIC_HOLIDAY_DAY
            ? { type: "publicHoliday", isOpen: false }
            : {
                type: "off",
                dayOfWeek,
            });
    }
    return days.flatMap((dayOfWeek) => timePart.map((time) => dayOfWeek === PUBLIC_HOLIDAY_DAY
        ? {
            type: "publicHoliday",
            isOpen: true,
            start: time[0].text,
            end: time[2].text,
        }
        : {
            type: "open",
            dayOfWeek,
            start: time[0].text,
            end: time[2].text,
        }));
};
const combineSchedules = (prevSchedule, nextSchedule) => {
    return [
        prevSchedule.filter((oldSpan) => !nextSchedule.some((newSpan) => "dayOfWeek" in newSpan &&
            "dayOfWeek" in oldSpan &&
            newSpan.dayOfWeek === oldSpan.dayOfWeek)),
        nextSchedule,
    ].flat();
};
const EXPR = typescript_parsec_1.rule();
const SCHED = typescript_parsec_1.rule();
EXPR.setPattern(typescript_parsec_1.apply(typescript_parsec_1.seq(typescript_parsec_1.apply(typescript_parsec_1.alt(typescript_parsec_1.seq(typescript_parsec_1.tok(TokenKind.Day), typescript_parsec_1.tok(TokenKind.To), typescript_parsec_1.tok(TokenKind.Day)), typescript_parsec_1.tok(TokenKind.Day)), makeDayArray), typescript_parsec_1.alt(typescript_parsec_1.list_sc(typescript_parsec_1.seq(typescript_parsec_1.tok(TokenKind.Time), typescript_parsec_1.tok(TokenKind.To), typescript_parsec_1.tok(TokenKind.Time)), typescript_parsec_1.tok(TokenKind.InternalSeperator)), typescript_parsec_1.tok(TokenKind.DayOff), typescript_parsec_1.nil())), ([dayPart, timePart]) => buildSchedule(dayPart, timePart)));
SCHED.setPattern(typescript_parsec_1.lrec_sc(EXPR, typescript_parsec_1.kright(typescript_parsec_1.tok(TokenKind.ExpressionSeperator), EXPR), combineSchedules));
exports.parse = (pattern) => removeDaysOff(typescript_parsec_1.expectSingleResult(typescript_parsec_1.expectEOF(SCHED.parse(lexer.parse(pattern)))));
