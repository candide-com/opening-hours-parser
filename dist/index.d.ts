declare const _default: {
    parse: (pattern: string) => import("./types").Schedule;
    openingTimes: (schedule: import("./types").Schedule, options?: import("./api").Options | undefined) => {
        isOpen: (date: Date) => boolean;
    };
};
export default _default;
