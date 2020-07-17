"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const types_1 = require("./types");
const typescript_parsec_1 = require("typescript-parsec");
const PUBLIC_HOLIDAY_DAY = 8;
const dayHash = {
    SU: types_1.Day.Sunday,
    MO: types_1.Day.Monday,
    TU: types_1.Day.Tuesday,
    WE: types_1.Day.Wednesday,
    TH: types_1.Day.Thursday,
    FR: types_1.Day.Friday,
    SA: types_1.Day.Saturday,
    PH: PUBLIC_HOLIDAY_DAY,
};
const monthHash = {
    JAN: types_1.Month.January,
    FEB: types_1.Month.February,
    MAR: types_1.Month.March,
    APR: types_1.Month.April,
    MAY: types_1.Month.May,
    JUN: types_1.Month.June,
    JUL: types_1.Month.July,
    AUG: types_1.Month.August,
    SEP: types_1.Month.September,
    OCT: types_1.Month.October,
    NOV: types_1.Month.November,
    DEC: types_1.Month.December,
};
function getDay(text) {
    var _a;
    return (_a = dayHash[text.toUpperCase()]) !== null && _a !== void 0 ? _a : types_1.Day.Monday;
}
function getMonth(text) {
    var _a;
    return (_a = monthHash[text.toUpperCase()]) !== null && _a !== void 0 ? _a : types_1.Month.January;
}
const isDayOff = (span) => span.type === "off";
const removeDaysOff = (arr) => arr.filter((span) => !isDayOff(span));
var TokenKind;
(function (TokenKind) {
    // Semantic
    TokenKind[TokenKind["Month"] = 0] = "Month";
    TokenKind[TokenKind["Day"] = 1] = "Day";
    TokenKind[TokenKind["Num"] = 2] = "Num";
    TokenKind[TokenKind["Time"] = 3] = "Time";
    // Spcial cases
    TokenKind[TokenKind["DayOff"] = 4] = "DayOff";
    TokenKind[TokenKind["AllWeek"] = 5] = "AllWeek";
    // Seprators
    TokenKind[TokenKind["To"] = 6] = "To";
    TokenKind[TokenKind["ExpressionSeperator"] = 7] = "ExpressionSeperator";
    TokenKind[TokenKind["InternalSeperator"] = 8] = "InternalSeperator";
    TokenKind[TokenKind["EOF"] = 9] = "EOF";
    // Non-capturing
    TokenKind[TokenKind["Space"] = 10] = "Space";
})(TokenKind || (TokenKind = {}));
// Matches on longest string first, then earlier in array
const lexer = typescript_parsec_1.buildLexer([
    // Number based
    [true, /^\d{2}/g, TokenKind.Num],
    [true, /^\d{2}:\d{2}/g, TokenKind.Time],
    [true, /^24\/7/g, TokenKind.AllWeek],
    // Letter based
    [true, /^off/g, TokenKind.DayOff],
    [true, /^[a-zA-Z]{3}/g, TokenKind.Month],
    [true, /^[a-zA-Z]{2}/g, TokenKind.Day],
    // Symbol based
    [true, /^-/g, TokenKind.To],
    [true, /^;/g, TokenKind.ExpressionSeperator],
    [true, /^,/g, TokenKind.InternalSeperator],
    [true, /^$/g, TokenKind.EOF],
    // Non-capturing
    [false, /^\s+/g, TokenKind.Space],
]);
const makeDayArray = (dayTokens) => {
    if (dayTokens === undefined) {
        return [1, 2, 3, 4, 5, 6, 7];
    }
    if ("length" in dayTokens) {
        if (dayTokens[1].kind === TokenKind.InternalSeperator) {
            return [getDay(dayTokens[0].text), getDay(dayTokens[2].text)];
        }
        const startDay = getDay(dayTokens[0].text);
        let endDay = getDay(dayTokens[2].text);
        if (endDay < startDay) {
            endDay = endDay + 7;
        }
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].reduce((memo, item) => {
            if (item < startDay) {
                return memo;
            }
            if (item > endDay) {
                return memo;
            }
            return [...memo, item > 7 ? item - 7 : item];
        }, []);
    }
    if (dayTokens.kind === TokenKind.AllWeek) {
        return [1, 2, 3, 4, 5, 6, 7];
    }
    return [getDay(dayTokens.text)];
};
const makeMonthDefinition = (monthTokens) => {
    if (monthTokens === undefined) {
        return null;
    }
    return {
        startDay: `${getMonth(monthTokens[0].text).toString().padStart(2, "0")}-${monthTokens[1].text}`,
        endDay: `${getMonth(monthTokens[3].text).toString().padStart(2, "0")}-${monthTokens[4].text}`,
    };
};
const makeTimesArray = (timeTokens) => {
    if (timeTokens === undefined) {
        return [{ startTime: "00:00", endTime: "24:00" }];
    }
    if ("kind" in timeTokens) {
        return "day off";
    }
    return timeTokens.map((time) => ({
        startTime: time[0].text,
        endTime: time[2].text,
    }));
};
const buildSchedule = (months, days, times) => {
    if (times === "day off") {
        return days.map((dayOfWeek) => dayOfWeek === PUBLIC_HOLIDAY_DAY
            ? { type: "publicHoliday", isOpen: false }
            : {
                type: "off",
                dayOfWeek,
            });
    }
    return days.flatMap((dayOfWeek) => times.map((time) => dayOfWeek === PUBLIC_HOLIDAY_DAY
        ? Object.assign({ type: "publicHoliday", isOpen: true }, (time !== null && time !== void 0 ? time : {})) : Object.assign(Object.assign({ type: "open", dayOfWeek }, (time !== null && time !== void 0 ? time : {})), (months !== null && months !== void 0 ? months : {}))));
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
EXPR.setPattern(typescript_parsec_1.apply(typescript_parsec_1.seq(typescript_parsec_1.apply(typescript_parsec_1.alt(typescript_parsec_1.seq(typescript_parsec_1.tok(TokenKind.Month), typescript_parsec_1.tok(TokenKind.Num), typescript_parsec_1.tok(TokenKind.To), typescript_parsec_1.tok(TokenKind.Month), typescript_parsec_1.tok(TokenKind.Num)), typescript_parsec_1.nil()), makeMonthDefinition), typescript_parsec_1.apply(typescript_parsec_1.alt(typescript_parsec_1.seq(typescript_parsec_1.tok(TokenKind.Day), typescript_parsec_1.tok(TokenKind.To), typescript_parsec_1.tok(TokenKind.Day)), typescript_parsec_1.seq(typescript_parsec_1.tok(TokenKind.Day), typescript_parsec_1.tok(TokenKind.InternalSeperator), typescript_parsec_1.tok(TokenKind.Day)), typescript_parsec_1.tok(TokenKind.Day), typescript_parsec_1.tok(TokenKind.AllWeek), typescript_parsec_1.nil()), makeDayArray), typescript_parsec_1.apply(typescript_parsec_1.alt(typescript_parsec_1.list_sc(typescript_parsec_1.seq(typescript_parsec_1.tok(TokenKind.Time), typescript_parsec_1.tok(TokenKind.To), typescript_parsec_1.tok(TokenKind.Time)), typescript_parsec_1.tok(TokenKind.InternalSeperator)), typescript_parsec_1.tok(TokenKind.DayOff), typescript_parsec_1.nil()), makeTimesArray)), ([months, days, times]) => buildSchedule(months, days, times)));
SCHED.setPattern(typescript_parsec_1.lrec_sc(EXPR, typescript_parsec_1.kright(typescript_parsec_1.tok(TokenKind.ExpressionSeperator), EXPR), combineSchedules));
exports.parse = (pattern) => {
    if (pattern.trim() === "") {
        return [];
    }
    return removeDaysOff(typescript_parsec_1.expectSingleResult(typescript_parsec_1.expectEOF(SCHED.parse(lexer.parse(pattern)))));
};
