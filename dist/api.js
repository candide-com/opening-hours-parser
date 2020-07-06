"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openingTimes = void 0;
const types_1 = require("./types");
const moment = require("moment-timezone");
exports.openingTimes = (schedule, options) => ({
    isOpen: (date) => {
        const mDate = options !== undefined && options.timezone !== undefined
            ? moment(date).tz(options.timezone)
            : moment(date);
        const hoursAndMinutes = mDate.format("HH:mm");
        const span = schedule.find((span) => types_1.isOpenSpan(span) && span.dayOfWeek === mDate.isoWeekday());
        const holidayRule = schedule.find((span) => types_1.isPublicHoliday(span));
        if (options !== undefined &&
            options.publicHolidays !== undefined &&
            holidayRule !== undefined &&
            options.publicHolidays.some((holiday) => holiday === mDate.format("YYYY-MM-DD"))) {
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
});
