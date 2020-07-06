"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const api_1 = require("./api");
exports.default = {
    parse: parser_1.parse,
    openingTimes: api_1.openingTimes,
};
