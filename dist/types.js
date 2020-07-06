"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOpenSpan = exports.isPublicHoliday = exports.Day = void 0;
var Day;
(function (Day) {
    Day[Day["Monday"] = 1] = "Monday";
    Day[Day["Tuesday"] = 2] = "Tuesday";
    Day[Day["Wednesday"] = 3] = "Wednesday";
    Day[Day["Thursday"] = 4] = "Thursday";
    Day[Day["Friday"] = 5] = "Friday";
    Day[Day["Saturday"] = 6] = "Saturday";
    Day[Day["Sunday"] = 7] = "Sunday";
})(Day = exports.Day || (exports.Day = {}));
exports.isPublicHoliday = (span) => span.type === "publicHoliday";
exports.isOpenSpan = (span) => span.type === "open";
