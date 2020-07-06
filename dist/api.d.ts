import { Schedule } from "./types";
export interface Options {
    timezone?: string;
    publicHolidays?: Array<string>;
}
export declare const openingTimes: (schedule: Schedule, options?: Options | undefined) => {
    isOpen: (date: Date) => boolean;
};
