export declare enum TokenKind {
    Month = 0,
    Day = 1,
    Num = 2,
    Time = 3,
    DayOff = 4,
    AllWeek = 5,
    To = 6,
    ExpressionSeperator = 7,
    InternalSeperator = 8,
    EOF = 9,
    Space = 10,
    OptionalSeperator = 11
}
export declare const lexer: import("typescript-parsec").Lexer<TokenKind>;
