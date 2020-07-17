"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openingHours = void 0;
const types_1 = require("./types");
const date_fns_1 = require("date-fns");
exports.openingHours = (schedule, options) => {
    const openingHours = {
        isOpenOn(date) {
            const hoursAndMinutes = date_fns_1.format(date, "HH:mm");
            const monthAndDay = date_fns_1.format(date, "MM-dd");
            const spans = schedule.filter((span) => types_1.isOpenSpan(span) && span.dayOfWeek === date_fns_1.getISODay(date));
            const holidayRule = schedule.find((span) => types_1.isPublicHoliday(span));
            if (options !== undefined &&
                options.publicHolidays !== undefined &&
                holidayRule !== undefined &&
                options.publicHolidays.some((holiday) => holiday === date_fns_1.format(date, "yyyy-MM-dd"))) {
                if (holidayRule !== undefined && holidayRule.isOpen === false) {
                    return false;
                }
                if (hoursAndMinutes >= holidayRule.startTime &&
                    hoursAndMinutes <= holidayRule.endTime) {
                    return true;
                }
                return false;
            }
            if (spans.length === 0) {
                return false;
            }
            const withinTimes = (span) => hoursAndMinutes >= span.startTime && hoursAndMinutes <= span.endTime;
            const withinDays = (span) => (span.startDay !== undefined &&
                span.endDay !== undefined &&
                monthAndDay >= span.startDay &&
                monthAndDay <= span.endDay) ||
                (span.startDay !== undefined &&
                    span.endDay !== undefined &&
                    span.endDay < span.startDay &&
                    (monthAndDay >= span.startDay || monthAndDay <= span.endDay));
            const noDaysSpecified = (span) => span.startDay === undefined && span.endDay === undefined;
            if (spans.some((span) => (withinTimes(span) && noDaysSpecified(span)) ||
                (withinTimes(span) && withinDays(span)))) {
                return true;
            }
            return false;
        },
    };
    return openingHours;
};
