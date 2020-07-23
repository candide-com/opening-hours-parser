# opening-hours-parser

This library is designed to parse a growing subset of the OpenStreetMap opening hours format, after finding that existing libraries weren't suitable for our needs.

https://wiki.openstreetmap.org/wiki/Key:opening_hours

It was initally developed to represent the most common requirements of venues we were working with, and has been expanded over time.

## API

The first step in using the parser is to parse the OpenStreetMap string into our data format

```
  import {parse} from "@candide/opening-hours-parser"

  const schedule = parse("Mo-Fr 08:00-12:00,13:00-17:30")
```

After that, initialise the openingHours factory with the parsed schedule and any options

```
  import {parse, openingHours} from "@candide/opening-hours-parser"

  const publicHolidays = [ "2020-08-13" ] // etc... obtain from a reputable source for your region

  const schedule = parse("Mo-Fr 08:00-12:00,13:00-17:30")

  const {isOpenOn} = openingHours(schedule, {publicHolidays})

  isOpenOn(new Date("2020-07-23T12:30")) // returns false
```
