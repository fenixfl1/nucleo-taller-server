import { Unit } from 'ms'

export const normalizeUnit = (
  unit: Unit
): moment.unitOfTime.DurationConstructor => {
  const mapping: Record<Unit, moment.unitOfTime.DurationConstructor> = {
    Years: 'years',
    Year: 'years',
    Yrs: 'years',
    Yr: 'years',
    Y: 'years',

    Weeks: 'weeks',
    Week: 'weeks',
    W: 'weeks',

    Days: 'days',
    Day: 'days',
    D: 'days',

    Hours: 'hours',
    Hour: 'hours',
    Hrs: 'hours',
    Hr: 'hours',
    H: 'hours',

    Minutes: 'minutes',
    Minute: 'minutes',
    Mins: 'minutes',
    Min: 'minutes',
    M: 'minutes',

    Seconds: 'seconds',
    Second: 'seconds',
    Secs: 'seconds',
    Sec: 'seconds',
    s: 'seconds',

    Milliseconds: 'milliseconds',
    Millisecond: 'milliseconds',
    Msecs: 'milliseconds',
    Msec: 'milliseconds',
    Ms: 'milliseconds',
  }

  return mapping[unit?.toUpperCase()]
}
