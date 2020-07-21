"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexer = exports.TokenKind = void 0;
const typescript_parsec_1 = require("typescript-parsec");
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
    TokenKind[TokenKind["OptionalSeperator"] = 11] = "OptionalSeperator";
})(TokenKind = exports.TokenKind || (exports.TokenKind = {}));
// Matches on longest string first, then earlier in array
exports.lexer = typescript_parsec_1.buildLexer([
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
    [false, /^:/g, TokenKind.OptionalSeperator],
]);
