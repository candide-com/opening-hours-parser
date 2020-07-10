"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openingHours = void 0;
const types_1 = require("./types");
const date_fns_1 = require("date-fns");
exports.openingHours = (schedule, options) => {
    const openingHours = {
        isOpenOn(date) {
            const hoursAndMinutes = date_fns_1.format(date, "HH:mm");
            const span = schedule.find((span) => types_1.isOpenSpan(span) && span.dayOfWeek === date_fns_1.getISODay(date));
            const holidayRule = schedule.find((span) => types_1.isPublicHoliday(span));
            if (options !== undefined &&
                options.publicHolidays !== undefined &&
                holidayRule !== undefined &&
                options.publicHolidays.some((holiday) => holiday === date_fns_1.format(date, "yyyy-MM-dd"))) {
                if (holidayRule !== undefined && holidayRule.isOpen === false) {
                    return false;
                }
                if (hoursAndMinutes >= holidayRule.start &&
                    hoursAndMinutes <= holidayRule.end) {
                    return true;
                }
                return false;
            }
            if (span === undefined) {
                return false;
            }
            if (hoursAndMinutes >= span.start && hoursAndMinutes <= span.end) {
                return true;
            }
            return false;
        },
    };
    return openingHours;
};
