# opening-hours-parser

This library is designed to parse a growing subset of the OpenStreetMap opening hours format, after finding that existing libraries weren't suitable for our needs.

https://wiki.openstreetmap.org/wiki/Key:opening_hours

It was initally developed to represent the most common requirements of venues we were working with, and has been expanded over time.

## Quick start

The first step in using the parser is to `parse` the OpenStreetMap string into our data format, called a `Schedule`.

```
  import {parse} from "@candide/opening-hours-parser"

  const schedule = parse("Mo-Fr 08:00-12:00,13:00-17:30")
```

After that, initialise the `openingHours` factory with the parsed `Schedule` and any `Options` that you need to provide.

```
  import {parse, openingHours} from "@candide/opening-hours-parser"

  const publicHolidays = [ "2020-08-13" ] // etc... obtain from a reputable source for your region

  const schedule = parse("Mo-Fr 08:00-12:00,13:00-17:30")

  const {isOpenOn} = openingHours(schedule, {publicHolidays})

  isOpenOn(new Date("2020-07-23T12:30")) // returns false
```

## API

### parse

This takes an OpenStreetMap format string and returns a `Schedule`.

### openingHours

This takes a `Schedule` and an optional `Options` object and returns helper functions.

### Options

This is a type with the following two properties.

#### publicHolidays

publicHolidays is an optional `Array` of `Strings` that represent the public holidays in the region of the venue.

#### timezone

timezone is an optional `String` that sets the timezone of the venue.

## Helper functions returned by the openingHours factory

### isOpenOn

This takes a `Date` and returns a `boolean` that represents if the venue is open at exactly that date and time.

### isOpenOnDate

This takes a `Date` and returns a `boolean` that represents if the venue is, has been, or will be open at any point on that calendar date.

### nextOpenOn

This takes a `Date` and returns a `Date` that represents the next time the venue will be open. If it returns the same `Date` then the venue is open right now.

## A note on Timezones

The OpenStreetMap format explicity uses local dates and times whenever they are defined in the schedule.

This library assumes that all javascript datetimes passed in to our utility functions are in the _same_ timezone as the dates and times in the schedule _and_ the same timezone that the code is running.

If that is not the case, you must pass a timezone to the factory that produces our helper functions.

```
  import {parse, openingHours} from "@candide/opening-hours-parser"

  const schedule = parse("Mo-Fr 08:00-12:00,13:00-17:30")

  const {isOpenOn} = openingHours(schedule, {timezone: "Europe/Amsterdam"})

  isOpenOn(new Date("2020-07-23T12:30:00.000Z")) // returns true since that's 13:30 locally

```
