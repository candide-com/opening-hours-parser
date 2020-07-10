export declare enum Day {
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
    Sunday = 7
}
export interface OpenSpan {
    type: "open";
    dayOfWeek: Day;
    start: string;
    end: string;
}
export declare type PublicHoliday = {
    type: "publicHoliday";
} & ({
    isOpen: true;
    start: string;
    end: string;
} | {
    isOpen: false;
});
export declare type Schedule = Array<OpenSpan | PublicHoliday>;
export declare const isPublicHoliday: (span: OpenSpan | PublicHoliday) => span is PublicHoliday;
export declare const isOpenSpan: (span: OpenSpan | PublicHoliday) => span is OpenSpan;
export interface Options {
    publicHolidays?: Array<string>;
}
export interface OpeningHours {
    isOpenOn(date: Date): boolean;
}
