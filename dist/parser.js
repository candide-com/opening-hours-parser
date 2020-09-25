"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parser = exports.removeDaysOff = void 0;
const types_1 = require("./types");
const typescript_parsec_1 = require("typescript-parsec");
const lexer_1 = require("./lexer");
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
const endDayOfMonthHash = {
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
};
function getDay(text) {
    var _a;
    return (_a = dayHash[text.toUpperCase()]) !== null && _a !== void 0 ? _a : types_1.Day.Monday;
}
function getMonth(text) {
    var _a;
    return (_a = monthHash[text.toUpperCase()]) !== null && _a !== void 0 ? _a : types_1.Month.January;
}
function getEndDayOfMonth(text) {
    var _a;
    return (_a = endDayOfMonthHash[text.toUpperCase()]) !== null && _a !== void 0 ? _a : 31;
}
function isDayOff(span) {
    return span.type === "off";
}
function removeDaysOff(arr) {
    return arr.filter((span) => !isDayOff(span));
}
exports.removeDaysOff = removeDaysOff;
const makeDayArray = (dayTokens) => {
    if (dayTokens === undefined) {
        return [1, 2, 3, 4, 5, 6, 7];
    }
    if ("length" in dayTokens) {
        if (dayTokens[1].kind === lexer_1.TokenKind.InternalSeperator) {
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
    if (dayTokens.kind === lexer_1.TokenKind.AllWeek) {
        return [1, 2, 3, 4, 5, 6, 7];
    }
    return [getDay(dayTokens.text)];
};
const makeMonthDefinition = (monthTokens) => {
    if (monthTokens === undefined) {
        return null;
    }
    if ("kind" in monthTokens) {
        const startDay = `${getMonth(monthTokens.text)
            .toString()
            .padStart(2, "0")}-01`;
        const endDay = `${getMonth(monthTokens.text)
            .toString()
            .padStart(2, "0")}-${getEndDayOfMonth(monthTokens.text)}`;
        return { startDay, endDay };
    }
    const startDay = `${getMonth(monthTokens[0].text)
        .toString()
        .padStart(2, "0")}-${monthTokens[1].text}`;
    const endDay = monthTokens.length === 2
        ? startDay
        : `${getMonth(monthTokens[3].text).toString().padStart(2, "0")}-${monthTokens[4].text}`;
    return { startDay, endDay };
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
        if (months === null) {
            return days.map((dayOfWeek) => dayOfWeek === PUBLIC_HOLIDAY_DAY
                ? { type: "publicHoliday", isOpen: false }
                : {
                    type: "off",
                    dayOfWeek,
                });
        }
        return [
            {
                type: "closed",
                startDay: months.startDay,
                endDay: months.endDay,
            },
        ];
    }
    return days.flatMap((dayOfWeek) => times.map((time) => dayOfWeek === PUBLIC_HOLIDAY_DAY
        ? Object.assign({ type: "publicHoliday", isOpen: true }, (time !== null && time !== void 0 ? time : {})) : Object.assign(Object.assign({ type: "open", dayOfWeek }, (time !== null && time !== void 0 ? time : {})), (months !== null && months !== void 0 ? months : {}))));
};
const coverSameDates = (span1, span2) => {
    if (isDayOff(span1) || isDayOff(span2)) {
        return true;
    }
    if (!types_1.isOpenSpan(span1) || !types_1.isOpenSpan(span2)) {
        return true;
    }
    if (span1.startDay === undefined ||
        span1.endDay === undefined ||
        span2.startDay === undefined ||
        span2.endDay === undefined) {
        return true;
    }
    return span1.startDay === span2.startDay && span1.endDay === span2.endDay;
};
const combineSchedules = (prevSchedule, nextSchedule) => {
    return [
        prevSchedule.filter((oldSpan) => !nextSchedule.some((newSpan) => "dayOfWeek" in newSpan &&
            "dayOfWeek" in oldSpan &&
            newSpan.dayOfWeek === oldSpan.dayOfWeek &&
            coverSameDates(oldSpan, newSpan))),
        nextSchedule,
    ].flat();
};
const EXPR = typescript_parsec_1.rule();
const SCHED = typescript_parsec_1.rule();
EXPR.setPattern(typescript_parsec_1.apply(typescript_parsec_1.seq(typescript_parsec_1.apply(typescript_parsec_1.alt(typescript_parsec_1.seq(typescript_parsec_1.tok(lexer_1.TokenKind.Month), typescript_parsec_1.tok(lexer_1.TokenKind.Num), typescript_parsec_1.tok(lexer_1.TokenKind.To), typescript_parsec_1.tok(lexer_1.TokenKind.Month), typescript_parsec_1.tok(lexer_1.TokenKind.Num)), typescript_parsec_1.seq(typescript_parsec_1.tok(lexer_1.TokenKind.Month), typescript_parsec_1.tok(lexer_1.TokenKind.Num)), typescript_parsec_1.tok(lexer_1.TokenKind.Month), typescript_parsec_1.nil()), makeMonthDefinition), typescript_parsec_1.apply(typescript_parsec_1.alt(typescript_parsec_1.seq(typescript_parsec_1.tok(lexer_1.TokenKind.Day), typescript_parsec_1.tok(lexer_1.TokenKind.To), typescript_parsec_1.tok(lexer_1.TokenKind.Day)), typescript_parsec_1.seq(typescript_parsec_1.tok(lexer_1.TokenKind.Day), typescript_parsec_1.tok(lexer_1.TokenKind.InternalSeperator), typescript_parsec_1.tok(lexer_1.TokenKind.Day)), typescript_parsec_1.tok(lexer_1.TokenKind.Day), typescript_parsec_1.tok(lexer_1.TokenKind.AllWeek), typescript_parsec_1.nil()), makeDayArray), typescript_parsec_1.apply(typescript_parsec_1.alt(typescript_parsec_1.list_sc(typescript_parsec_1.seq(typescript_parsec_1.tok(lexer_1.TokenKind.Time), typescript_parsec_1.tok(lexer_1.TokenKind.To), typescript_parsec_1.tok(lexer_1.TokenKind.Time)), typescript_parsec_1.tok(lexer_1.TokenKind.InternalSeperator)), typescript_parsec_1.tok(lexer_1.TokenKind.DayOff), typescript_parsec_1.nil()), makeTimesArray)), ([months, days, times]) => buildSchedule(months, days, times)));
SCHED.setPattern(typescript_parsec_1.lrec_sc(EXPR, typescript_parsec_1.kright(typescript_parsec_1.tok(lexer_1.TokenKind.ExpressionSeperator), EXPR), combineSchedules));
exports.parser = SCHED;
