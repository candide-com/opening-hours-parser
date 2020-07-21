import { Schedule, Options, OpeningHours } from "./types";
export declare const parse: (pattern: string) => Schedule;
export declare const openingHours: (schedule: Schedule, options?: Options | undefined) => OpeningHours;
