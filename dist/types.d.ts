export declare enum Day {
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
    Sunday = 7
}
export declare enum Month {
    January = 1,
    February = 2,
    March = 3,
    April = 4,
    May = 5,
    June = 6,
    July = 7,
    August = 8,
    September = 9,
    October = 10,
    November = 11,
    December = 12
}
export interface OpenSpan {
    type: "open";
    dayOfWeek: Day;
    startTime: string;
    endTime: string;
    startDay?: string;
    endDay?: string;
}
export interface ClosedDateSpan {
    type: "closed";
    startDay: string;
    endDay: string;
}
export declare type PublicHoliday = {
    type: "publicHoliday";
} & ({
    isOpen: true;
    startTime: string;
    endTime: string;
} | {
    isOpen: false;
});
export declare type Schedule = Array<OpenSpan | ClosedDateSpan | PublicHoliday>;
export declare const isPublicHoliday: (span: OpenSpan | ClosedDateSpan | PublicHoliday) => span is PublicHoliday;
export declare const isOpenSpan: (span: OpenSpan | ClosedDateSpan | PublicHoliday) => span is OpenSpan;
export declare const isClosedDateSpan: (span: OpenSpan | ClosedDateSpan | PublicHoliday) => span is ClosedDateSpan;
export interface Options {
    publicHolidays?: Array<string>;
}
export interface OpeningHours {
    isOpenOn(date: Date): boolean;
}
