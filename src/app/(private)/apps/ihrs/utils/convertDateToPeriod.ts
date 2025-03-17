import { format } from 'date-fns';

export enum PeriodTypeEnum {
	BI_MONTHLY = "BiMonthly",
	BI_WEEKLY = "BiWeekly",
	DAILY = "Daily",
	FINANCIAL_APRIL = "FinancialApril",
	FINANCIAL_JULY = "FinancialJuly",
	FINANCIAL_NOV = "FinancialNov",
	FINANCIAL_OCT = "FinancialOct",
	MONTHLY = "Monthly",
	QUARTERLY = "Quarterly",
	QUARTERLY_NOV = "QuarterlyNov",
	SIX_MONTHLY_APRIL = "SixMonthlyApril",
	SIX_MONTHLY_NOV = "SixMonthlyNov",
	SIX_MONTHLY = "SixMonthly",
	TWO_YEARLY = "TwoYearly",
	WEEKLY = "Weekly",
	WEEKLY_SATURDAY = "WeeklySaturday",
	WEEKLY_SUNDAY = "WeeklySunday",
	WEEKLY_THURSDAY = "WeeklyThursday",
	WEEKLY_WEDNESDAY = "WeeklyWednesday",
	YEARLY = "Yearly"
}

export interface GeneratedPeriod {
  type: string;
  format: string;
  period: string;
}

export function convertDateToPeriod(date: Date, periodType: PeriodTypeEnum): GeneratedPeriod {
  let formattedPeriod = '';
  let formatStr = '';

  switch (periodType) {
    case PeriodTypeEnum.DAILY:
      formatStr = 'yyyyMMdd';
      formattedPeriod = format(date, formatStr);
      break;

    case PeriodTypeEnum.WEEKLY:
      formatStr = "yyyy'W'ww";
      formattedPeriod = format(date, formatStr);
      break;

    case PeriodTypeEnum.WEEKLY_WEDNESDAY:
      formatStr = "yyyy'WedW'ww";
      formattedPeriod = format(date, formatStr);
      break;

    case PeriodTypeEnum.WEEKLY_THURSDAY:
      formatStr = "yyyy'ThuW'ww";
      formattedPeriod = format(date, formatStr);
      break;

    case PeriodTypeEnum.WEEKLY_SATURDAY:
      formatStr = "yyyy'SatW'ww";
      formattedPeriod = format(date, formatStr);
      break;

    case PeriodTypeEnum.WEEKLY_SUNDAY:
      formatStr = "yyyy'SunW'ww";
      formattedPeriod = format(date, formatStr);
      break;

    case PeriodTypeEnum.BI_WEEKLY: {
      // For biweekly, we calculate the week number and derive a biweekly period
      const weekNum = parseInt(format(date, 'ww'));
      const biWeek = Math.ceil(weekNum / 2);
      formatStr = "yyyy'BiW'ww";
      formattedPeriod = `${format(date, 'yyyy')}BiW${biWeek}`;
      break;
    }

    case PeriodTypeEnum.MONTHLY:
      formatStr = 'yyyyMM';
      formattedPeriod = format(date, formatStr);
      break;

    case PeriodTypeEnum.BI_MONTHLY:
      // Use monthly format and append B.
      formatStr = 'yyyyMMB';
      formattedPeriod = format(date, 'yyyyMM') + 'B';
      break;

    case PeriodTypeEnum.QUARTERLY: {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      formatStr = "yyyy'Q'Q";
      formattedPeriod = `${format(date, 'yyyy')}Q${quarter}`;
      break;
    }

    case PeriodTypeEnum.QUARTERLY_NOV: {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      formatStr = "yyyyNov'Q'Q";
      formattedPeriod = `${format(date, 'yyyy')}NovQ${quarter}`;
      break;
    }

    case PeriodTypeEnum.SIX_MONTHLY: {
      // If month is less than June then S1; otherwise S2.
      const half = date.getMonth() < 6 ? 1 : 2;
      formatStr = "yyyys#";
      formattedPeriod = `${format(date, 'yyyy')}S${half}`;
      break;
    }

    case PeriodTypeEnum.SIX_MONTHLY_APRIL: {
      // Assuming fiscal year starts in April: months April-September = S1; others = S2.
      const month = date.getMonth();
      const half = (month >= 3 && month <= 8) ? 1 : 2;
      formatStr = "yyyyAprilS#";
      formattedPeriod = `${format(date, 'yyyy')}AprilS${half}`;
      break;
    }

    case PeriodTypeEnum.SIX_MONTHLY_NOV: {
      // Assuming November-based half-year: for example, if month >= October or month < April, S1; else S2.
      const month = date.getMonth();
      const half = (month >= 9 || month < 3) ? 1 : 2;
      formatStr = "yyyyNovS#";
      formattedPeriod = `${format(date, 'yyyy')}NovS${half}`;
      break;
    }

    case PeriodTypeEnum.TWO_YEARLY: {
      // For two-yearly, assume a period that spans two consecutive years.
      const startYear = format(date, 'yyyy');
      const endYear = (parseInt(startYear) + 1).toString();
      formatStr = "yyyy-yyyy";
      formattedPeriod = `${startYear}-${endYear}`;
      break;
    }

    case PeriodTypeEnum.FINANCIAL_APRIL:
      formatStr = "yyyyApril";
      formattedPeriod = `${format(date, 'yyyy')}April`;
      break;

    case PeriodTypeEnum.FINANCIAL_JULY:
      formatStr = "yyyyJuly";
      formattedPeriod = `${format(date, 'yyyy')}July`;
      break;

    case PeriodTypeEnum.FINANCIAL_OCT:
      formatStr = "yyyyOct";
      formattedPeriod = `${format(date, 'yyyy')}Oct`;
      break;

    case PeriodTypeEnum.FINANCIAL_NOV:
      formatStr = "yyyyNov";
      formattedPeriod = `${format(date, 'yyyy')}Nov`;
      break;

    case PeriodTypeEnum.YEARLY:
      formatStr = 'yyyy';
      formattedPeriod = format(date, formatStr);
      break;

    default:
      formatStr = 'yyyyMM';
      formattedPeriod = format(date, formatStr);
  }

  return {
    type: periodType,
    format: formatStr,
    period: formattedPeriod
  };
}
