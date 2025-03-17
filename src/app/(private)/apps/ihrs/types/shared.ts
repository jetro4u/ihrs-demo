export type Access = {
    data?: AccessData
    delete: boolean
    externalize: boolean
    manage: boolean
    read: boolean
    update: boolean
    write: boolean
}

export type AccessData = {
    read: boolean
    write: boolean
}

export type Sharing = {
    external: boolean
    owner: string
    public: string
    userGroups: Record<string, UserGroupAccess>
    users: Record<string, UserAccess>
}

export type UserGroupAccess = {
    access: string
    displayName: string
    id: string
}
export type UserAccess = {
    access: string
    displayName: string
    id: string
}

export type Translation = {
    locale: string
    property: string
    value: string
}

export type QueryModifiers = {
    aggregationType: AggregationType
    maxDate: string
    minDate: string
    periodOffset: number
    valueType: ValueType
    yearToDate: boolean
}

export enum ValueType {
	TEXT = 'TEXT',
	LONG_TEXT = 'LONG_TEXT',
	MULTI_TEXT = 'MULTI_TEXT',
	LETTER = 'LETTER',
	PHONE_NUMBER = 'PHONE_NUMBER',
	EMAIL = 'EMAIL',
	BOOLEAN = 'BOOLEAN',
	TRUE_ONLY = 'TRUE_ONLY',
	DATE = 'DATE',
	DATETIME = 'DATETIME',
	TIME = 'TIME',
	NUMBER = 'NUMBER',
	_INTERVAL = '_INTERVAL',
	PERCENTAGE = 'PERCENTAGE',
	INTEGER = 'INTEGER',
	INTEGER_POSITIVE = 'INTEGER_POSITIVE',
	INTEGER_NEGATIVE = 'INTEGER_NEGATIVE',
	INTEGER_ZERO_OR_POSITIVE = 'INTEGER_ZERO_OR_POSITIVE',
	TRACKER_ASSOCIATE = 'TRACKER_ASSOCIATE',
	USERNAME = 'USERNAME',
	COORDINATE = 'COORDINATE',
	ORGANISATION_ = 'ORGANISATION_',
	REFERENCE = 'REFERENCE',
	AGE = 'AGE',
	URL = 'URL',
	FILE_RESOURCE = 'FILE_RESOURCE',
	IMAGE = 'IMAGE',
	GEOJSON = 'GEOJSON',
}

export enum AggregationType {
	SUM = 'SUM',
	AVERAGE = 'AVERAGE',
	AVERAGE_SUM_ORG_ = 'AVERAGE_SUM_ORG_',
	LAST = 'LAST',
	LAST_AVERAGE_ORG_ = 'LAST_AVERAGE_ORG_',
	LAST_LAST_ORG_ = 'LAST_LAST_ORG_',
	LAST_IN_PERIOD = 'LAST_IN_PERIOD',
	LAST_IN_PERIOD_AVERAGE_ORG_ = 'LAST_IN_PERIOD_AVERAGE_ORG_',
	FIRST = 'FIRST',
	FIRST_AVERAGE_ORG_ = 'FIRST_AVERAGE_ORG_',
	FIRST_FIRST_ORG_ = 'FIRST_FIRST_ORG_',
	COUNT = 'COUNT',
	STDDEV = 'STDDEV',
	VARIANCE = 'VARIANCE',
	MIN = 'MIN',
	MAX = 'MAX',
	MIN_SUM_ORG_ = 'MIN_SUM_ORG_',
	MAX_SUM_ORG_ = 'MAX_SUM_ORG_',
	NONE = 'NONE',
	CUSTOM = 'CUSTOM',
	DEFAULT = 'DEFAULT',
}

export enum PeriodType {
	BI_MONTHLY = 'BiMonthly',
	BI_WEEKLY = 'BiWeekly',
	DAILY = 'Daily',
	FINANCIAL_APRIL = 'FinancialApril',
	FINANCIAL_JULY = 'FinancialJuly',
	FINANCIAL_NOV = 'FinancialNov',
	FINANCIAL_OCT = 'FinancialOct',
	MONTHLY = 'Monthly',
	QUARTERLY = 'Quarterly',
	QUARTERLY_NOV = 'QuarterlyNov',
	SIX_MONTHLY_APRIL = 'SixMonthlyApril',
	SIX_MONTHLY_NOV = 'SixMonthlyNov',
	SIX_MONTHLY = 'SixMonthly',
	TWO_YEARLY = 'TwoYearly',
	WEEKLY = 'Weekly',
	WEEKLY_SATURDAY = 'WeeklySaturday',
	WEEKLY_SUNDAY = 'WeeklySunday',
	WEEKLY_THURSDAY = 'WeeklyThursday',
	WEEKLY_WEDNESDAY = 'WeeklyWednesday',
	YEARLY = 'Yearly',
}

export enum FieldType {
	TEXT = 'TEXT',
	LONG_TEXT = 'LONG_TEXT',
	MULTI_TEXT = 'MULTI_TEXT',
	LETTER = 'LETTER',
	PHONE_NUMBER = 'PHONE_NUMBER',
	EMAIL = 'EMAIL',
	BOOLEAN = 'BOOLEAN',
	TRUE_ONLY = 'TRUE_ONLY',
	DATE = 'DATE',
	DATETIME = 'DATETIME',
	TIME = 'TIME',
	NUMBER = 'NUMBER',
	_INTERVAL = '_INTERVAL',
	PERCENTAGE = 'PERCENTAGE',
	INTEGER = 'INTEGER',
	INTEGER_POSITIVE = 'INTEGER_POSITIVE',
	INTEGER_NEGATIVE = 'INTEGER_NEGATIVE',
	INTEGER_ZERO_OR_POSITIVE = 'INTEGER_ZERO_OR_POSITIVE',
	TRACKER_ASSOCIATE = 'TRACKER_ASSOCIATE',
	USERNAME = 'USERNAME',
	COORDINATE = 'COORDINATE',
	ORGANISATION_ = 'ORGANISATION_',
	REFERENCE = 'REFERENCE',
	AGE = 'AGE',
	URL = 'URL',
	FILE_RESOURCE = 'FILE_RESOURCE',
	IMAGE = 'IMAGE',
	GEOJSON = 'GEOJSON',
}