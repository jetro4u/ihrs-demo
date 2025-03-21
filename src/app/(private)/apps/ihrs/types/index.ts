import { Access, FieldType, Sharing, PeriodType, QueryModifiers, Translation, AggregationType } from './shared';
type User = {}
// TypeScript Interfaces for Metadata Structure
export interface Metadata {
	attributeValues: AttributeValue[];
	categoryOptionGroups: CategoryOptionGroup[];
	categoryOptionGroupSets: CategoryOptionGroupSet[];
	categoryOptions: CategoryOption[];
	categories: Category[];
	categoryCombos: CategoryCombo[];
	categoryOptionCombos: CategoryOptionCombo[];
	dataElementGroupSets: DataElementGroupSet[];
	dataElementGroups: DataElementGroup[];
	dataElements: DataElement[];
	indicatorGroupSets: IndicatorGroupSet[];
	indicatorGroups: IndicatorGroup[];
	indicators: Indicator[];
	indicatorType: IndicatorType;
	legendSets: LegendSet[];
	optionSets: OptionSet[];
	optionGroups: OptionGroup[];
	optionGroupSets: OptionGroupSet[];
	dataSets: DataSet[];
	sections: Section[];
	constants: Constant[];
	organisationGroupSets: OrganisationGroupSet[]
	organisationGroups: OrganisationGroup[]
	organisations: Organisation[]
	organisationLevel: OrganisationLevel
  fields: Record<string, Field>;
  fieldGroups: Record<string, FieldGroup>;
  fieldTemplates: Record<string, FieldTemplate>;
  forms: Record<string, Form>;
    // Dynamic form templates
  formTemplates: {
    [key: string]: {
      template: string;
      variables: string[];
      generateForm: (variables: Record<string, any>) => Form;
    }
  };
	formBlocks: {
	  [key: string]: FormBlockConfig;
	};
	uiConfig: UIConfig;
	systemConfig: {
	  caching: DataCaching;
	  performance: PerformanceConfig;
	};
	workflows: {
	  [key: string]: Workflow;
	};
	validationRules: GlobalValidationRule[];
    
    // Business domain-specific configurations
    businessForms: {
      invoice: {},
      order: {},
      product: {},
      customer: {},
      survey: {},
      newsletter: {}
    };
    
    // Integration mappings for business systems
    integrations: {
      erp: {},
      crm: {},
      accounting: {},
      ecommerce: {}
    };
}
/* DEPENDENCIES */
export type ID = {
	id: string;
}
export type IdName
 = {
	id: string;
	name: string;
}
export type AttributeValue = {
	attribute: Attribute
	value: string
}
export type CategoryOptionGroupSet = {
	aggregationType: AggregationType
	categoryOptionGroups: CategoryOptionGroup[]
	id: string
	name: string
	shortName: string
	user: User
	valueType: ValueType
}
export type CategoryOptionGroup = {
	aggregationType: AggregationType
	categoryOptions: CategoryOption[]
	groupSets: CategoryOptionGroupSet[]
	id: string
	name: string
	shortName: string
	user: User
}
export interface CategoryOption {
	code: string;
	name: string;
	categories?: ID[];
	categoryOptionCombos?: ID[];
	id: string;
	isDefault?: boolean;
}
  
export interface Category {
	code: string;
	name: string;
	shortName?: string;
	dimensionType: string;
	dataDimensionType: string;
	categoryOptions?: ID[];
	categoryCombos?: ID[];
	dimension: string;
	id: string;
}
  
export interface CategoryCombo {
	code: string;
	name: string;
	dataDimensionType: string;
	id: string;
	categoryOptionCombos?: ID[];
	isDefault?: boolean;
}
  
export interface CategoryOptionCombo {
	name: string;
	categoryCombo: ID;
	sortOrder: number;
	categoryOptions: ID[];
	id: string;
}
export type DataElementGroupSet = {
	aggregationType: AggregationType
	id: string
	name: string
	optionSet: OptionSet
	shortName: string
	user: User
	valueType: ValueType
}

export type DataElementGroup = {
	dataElements: DataElement[]
	groupSets: DataElementGroupSet[]
	id: string
	name: string
	shortName: string
	user: User
}

export interface DataElement {
	uid: string;
	name: string;
	shortName: string;
	code: string;
	description?: string;
  displayDescription: string
  displayFormName: string
  displayName: string
  displayShortName: string
	valueType: ValueType;
  zeroIsSignificant: boolean
	iconText?: string;
	fieldType?: string;
  aggregationLevels: number[]
  aggregationType: AggregationType
	app?: string;
	dataElementOrder?: number;
	dataElementQuestionType?: number;
  section: {
    name?: string;
    sortOrder?: number;
    deOrder?: number;
  }
	dataSets?: ID[];
	organisationTypes?: string[];
	dataElementGroups?: IdName;
	categoryCombo?: ID;
	metrics?: Record<string, any>;
	value?: string;
  componentName: string
	answered?: boolean;
	disabled?: boolean;
  optionSet: OptionSet
  optionSetValue: boolean
  queryMods: QueryModifiers
  commentOptionSet: OptionSet
	validationRules?: ValidationRule;
	visibility?: Visibility;
  access: Access
  showSubmitIndicator: boolean
  autoSaveDelay?: number;
  disableAnimation?: boolean;
	readOnly?: boolean;
	defaultValue?: any;
  formStyles?: {
    fieldMask: string
    helpText?: string;
    placeholder?: string;
    fieldSize?: 'small' | 'medium';
    variant?: 'outlined' | 'filled' | 'standard';
    row?: boolean;
    muiColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    color?: string;
    icon: string;
    sx?: any;
    minSelected?: number; // Minimum number of checkboxes that must be selected
    maxSelected?: number; // Maximum number of checkboxes that can be selected
    limitTags?: number; // Controls how many selected items are shown before collapsing
    autoHighlight?: boolean; // Enables auto-highlighting of matching text
    autoComplete?: boolean; // Enables browser autocomplete
    disableCloseOnSelect?: boolean // Keeps dropdown open after selection (default true)
  }
	calculatedValue?: CalculatedValue;
	displayInReview?: boolean;
	displayConditions?: DisplayConditions;
	sortOrder?: number;
	unitOfMeasurement?: string;
	valueTypeOptions: FileTypeValueOptions
  legendSet: LegendSet
  legendSets: LegendSet[]
}
export type FileTypeValueOptions = {
    allowedContentTypes: Array<string>
    maxFileSize: number
    version: number
}

export type Indicator = {
    aggregateExportAttributeOptionCombo: string
    aggregateExportCategoryOptionCombo: string
    aggregationType: AggregationType
    annualized: boolean
    dataSets: DataSet[]
    decimals: number
    denominator: string
    denominatorDescription: string
    description: string
    dimensionItem: string
    displayDenominatorDescription: string
    displayDescription: string
    displayFormName: string
    displayName: string
    displayNumeratorDescription: string
    displayShortName: string
    explodedDenominator: string
    explodedNumerator: string
    formName: string
    id: string
    indicatorGroups: IndicatorGroup[]
    indicatorType: IndicatorType
    legendSet: LegendSet
    legendSets: LegendSet[]
    name: string
    numerator: string
    numeratorDescription: string
    queryMods: QueryModifiers
    shortName: string
    style: ObjectStyle
    user: User
}
export type ObjectStyle = {
    color: string
    icon: string
}

export type IndicatorGroup = {
    description: string
    displayName: string
    groupSets: IndicatorGroupSet[]
    id: string
    indicatorGroupSet: IndicatorGroupSet
    indicators: Indicator[]
    name: string
    user: User
}

export type IndicatorGroupSet = {
    compulsory: boolean
    description: string
    displayName: String
    id: string
    indicatorGroups: IndicatorGroup[]
    name: string
    shortName: string
    user: User
}

export type IndicatorType = {
    displayName: string
    factor: number
    id: String
    name: string
    number: boolean
    user: User
}

export type LegendSet = {
	displayName: string
	id: string
	legends: Legend[]
	name: string
	symbolizer: string
	user: User
}
export type Legend = {
    color: string
    displayName: string
	description?: string;
    endValue: number
    startValue: number
    id: string
    iconText: string
    name: string
    user: User
}

export type OptionSet = {
	description: string
	id: string
	name: string
	options: Option[]
	user: User
	valueType: ValueType
	version: number
}

export type OptionGroup = {
	aggregationType: AggregationType
	dimensionItem: string
	formName: string
	id: string
	legendSet: LegendSet
	legendSets: LegendSet[]
	name: string
	optionSet: OptionSet
	options: Option[]
	queryMods: QueryModifiers
	shortName: string
	user: User
}

export type OptionGroupSet = {
	aggregationType: AggregationType
	dataDimension: boolean
	dataDimensionType: DataDimensionType
	dimension: string
	dimensionItemKeywords: DimensionItemKeywords
	filter: string
	formName: string
	id: string
	legendSet: LegendSet
	name: string
	optionGroups: OptionGroup[]
	optionSet: OptionSet
	programStage: ProgramStage
	repetition: EventRepetition
	shortName: string
	user: User
	valueType: ValueType
}
export type Option = {
	description: string
	displayFormName: string
	formName: string
	id: string
	name: string
	optionSet: OptionSet
	sharing: Sharing
	shortName: string
	sortOrder: number
	style: ObjectStyle
	user: User
}

export interface DataSet {
	uid: string;
	name: string;
  access?: Access
  aggregationType: AggregationType
  categoryCombo: ID
  compulsoryDataElementOperands?: DataElementOperand[]
  compulsoryFieldsCompleteOnly?: boolean
  dataEntryForm?: DataEntryForm
  dataInputPeriods: DataInputPeriod[]
	periodTypeId?: number;
  periodType: PeriodType
	shortname?: string;
	shortName?: string;
	sections?: Section[];
	sectionOverviews?: SectionOverview[]
  showSectionOverview: boolean
	code: string;
	formBlock?: string;
  formName: string
  formType: FormType
  indicators: Indicator[]
  interpretations: Interpretation[]
  legendSet: LegendSet
  legendSets: LegendSet[]
  mobile: boolean
	description?: string;
  dimensionItem: string
  displayDescription: string
  displayFormName: string
  displayName: string
  displayShortName: string
  expiryDays: number
	status?: string;
	version?: string;
	createdBy?: string;
	createdAt?: string;
	updatedAt?: string;
	tags?: string[];
  noValueRequiresComment: boolean
  notificationRecipients: UserGroup["id"[]]
  notifyCompletingUser: boolean
  openFuturePeriods: number
  openPeriodsAfterCoEndDate: number
  queryMods: QueryModifiers
  renderAsTabs: boolean
  renderHorizontally: boolean
  skipOffline: boolean
  style: ObjectStyle
  timelyDays: number
  validCompleteOnly: boolean
	permissions?: {
	  view: string[];
	  edit: string[];
	  approve: string[];
	};
	workflow?: DataApprovalWorkflow;
	uiConfig?: {
	  theme: string;
	  logo: string;
	  headerText: string;
	  footerText: string;
	};
	exportOptions?: {
	  formats: string[];
	  templates: string[];
	};
	notifications?: {
	  onSubmit: boolean;
	  onApprove: boolean;
	  onReject: boolean;
	  recipients: string[];
	};
	organisations?: Organisation["id"];
}
export type DataApprovalWorkflow = {
    access: Access
	requiresApproval: boolean;
	approvalLevels: string[];
	rejectionEnabled: boolean;
    categoryCombo: CategoryCombo
    dataApprovalLevels: Array<DataApprovalLevel>
    dataSets: DataSet[]
    displayName: string
    id: string
    name: string
    periodType: PeriodType
    user: User
}
export type DataApprovalLevel = {
    access: Access
    categoryOptionGroupSet: CategoryOptionGroupSet
    id: string
    level: number
    name: string
    orgLevel: number
    orgLevelName: string
    user: User
}

export type Section = {
	id: string;
	name: string;
	type: "main" | "dynamic";
    sortOrder: number
	formBlock?: string;
    access: Access
    categoryCombos: CategoryCombo[]
	dataElements: DataElement[]
    indicators: Indicator[]
    showColumnTotals: boolean
    showRowTotals: boolean
	totalQuestions: number
	attemptedQuestions?: number
	totalScore?: number
	obtainedScore?: number
	showScore: boolean;
	dataSet: DataSet
	enabled?: boolean;
	description?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	conditional?: {
	  showIf: string | null;
	  dependsOn: string[];
	};
	layout?: {
	  columns: number;
	  style: string;
	};
	summary?: {
	  enabled: boolean;
	  calculations: Array<{
		type: string;
		fields: string[];
	  }>;
	};
	printOptions?: {
	  pageBreakBefore: boolean;
	  includeInTOC: boolean;
	};
}

export type SectionOverview = Pick<
  Section,
  "id" | "name" | "totalQuestions" | "attemptedQuestions" | "totalScore" | "obtainedScore" | "showScore"
>;

export type OrganisationGroupSet = {
    aggregationType: AggregationType
    filter: string
    formName: string
    id: string
    includeSubhierarchyInAnalytics: boolean
    legendSet: LegendSet
    name: string
    optionSet: OptionSet
    organisationGroups: OrganisationGroup[]
    shortName: string
    user: User
    valueType: ValueType
}

export type OrganisationGroup = {
    aggregationType: AggregationType
    color: string
    featureType: FeatureType
    formName: string
    geometry: Record<string, any>
    groupSets: OrganisationGroupSet[]
    id: string
    legendSet: LegendSet
    legendSets: LegendSet[]
    name: string
    organisations: Organisation[]
    queryMods: QueryModifiers
    shortName: string
    symbol: string
    user: User
}
export type Organisation = {
    id: string
    level: number
    levelName: string
    name: string
    shortName: string
}

export type OrganisationLevel = {
    displayName: string
    id: string
    level: number
    name: string
    offlineLevels: number
    user: User
}

export enum FormType {
	DEFAULT = 'DEFAULT',
	CUSTOM = 'CUSTOM',
	SECTION = 'SECTION',
	SECTION_MULTIORG = 'SECTION_MULTIORG',
}

interface ValidationRule {
	required?: boolean;
	min?: number | null;
	max?: number | null;
	regex?: string | null;
	errorMessage?: string;
}
  
interface Visibility {
	condition: string | null; // E.g., "dataElement.Bl34mYCskmv === 'Yes'"
	dependsOn: string[]; // IDs of data elements this field depends on
}
  
interface CalculatedValue {
	formula: string | null; // E.g., "dataElement.field1 + dataElement.field2"
	dependencies: string[]; // IDs of data elements used in formula
}
  
interface DisplayConditions {
	roles?: string[];
	organisations?: string[];
}
  
  
export interface FormBlockConfig {
    type: 'standard' | 'table' | 'vertical-matrix-table' | 'horizontal-matrix-table' | 'card' | 'wizard' | 'template-menu-value' | 'template-menu-record' 
	layout: string;
    formTypes: string[]; // Types of forms this block can be used with
    fieldTypes: FieldType[]; // Types of fields this block can render
	showLabels?: boolean;
	labelPosition?: string;
	spacing?: string;
	validation?: string;
	showTotals?: boolean;
	allowBulkEdit?: boolean;
	freezeHeader?: boolean;
	responsiveMode?: string;
    renderComponent?: string; // React component name for rendering
    renderProps?: Record<string, any>; // Additional props for the component
}
  
export type Constant = {
    description: string
    formName: string
    id: string
    name: string
    shortName: string
    user: User
    value: number
}

export type CompleteDatasetPayload = {
	dataSet: string;
	source: string;
	period: string;
	attributeOptionCombo?: string;
	date: Date;
	signatures: Point[][];
	completed: boolean;
}

export interface Point {
	x: number;
	y: number;
}

interface Field {
    categoryOptionCombo: string;
    comment?: string;
    dataElement: string;
    label: string;
    optionSet?: string;
    type: Field.type;
    value?: string;
    required?: boolean;
    disabled?: boolean;
    visible?: boolean;
    description?: string;
    placeholder?: string;
    validationRules?: ValidationRule;
    defaultValue?: any;
    dependencies?: string[];
    renderProps?: {
      component?: string;
      props?: Record<string, any>;
      variant?: string;
      size?: string;
      fullWidth?: boolean;
    };
    fieldPath?: FieldPath;
 }
  
  // Field Path (from your definition)
interface FieldPath {
  exclude: boolean;
  fullPath: string;
  name: string;
  path: Array<string>;
  preset: boolean;
  property: Property;
  root: boolean;
  transformer: boolean;
  transformers: Array<FieldPathTransformer>;
}

interface FieldPathTransformer {
  name: string;
  parameters: Array<string>;
}

interface Property {
  name: string;
  type: string;
}

// Form Definition - for reusable form templates
interface Form {
  id: string;
  name: string;
  description?: string;
  type: string; // "report", "survey", "invoice", "order", etc.
  version: string;
  sections: FormSection[];
  permissions?: {
    view: string[];
    edit: string[];
    approve: string[];
  };
  validationRules?: GlobalValidationRule[];
  dataElements?: string[]; // Links to data elements this form uses
  dataSet?: string; // Optional link to a dataSet (for report forms)
  workflow?: string; // Reference to workflow definition
  created?: {
    by: string;
    at: string;
  };
  updated?: {
    by: string;
    at: string;
  };
  uiConfig?: {
    theme?: string;
    layout?: string;
    showProgress?: boolean;
  };
  templateVars?: Record<string, any>; // For dynamic form templates
}

// Form Section - grouping of fields in a form
interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  formBlock?: string;
  fields: FormField[];
  conditional?: {
    showIf: string | null;
    dependsOn: string[];
  };
  layout?: {
    type: string; // "grid", "table", "cards", etc.
    columns?: number;
    spacing?: number;
  };
  repeat?: {
    enabled: boolean;
    min?: number;
    max?: number;
    addButtonText?: string;
    removeButtonText?: string;
  };
}

// Form Field - instance of a field in a form
interface FormField {
  id: string;
  fieldId: string; // Reference to the Field definition
  path?: string; // For nested data structures
  order: number;
  width?: string; // For layout control - "full", "half", etc.
  overrides?: {
    label?: string;
    required?: boolean;
    disabled?: boolean;
    visible?: boolean;
    defaultValue?: any;
    renderProps?: Record<string, any>;
  };
  valueMapping?: {
    source?: string;
    transform?: string;
    target?: string;
  };
}

// Field Group - for reusable groups of fields
interface FieldGroup {
  id: string;
  name: string;
  description?: string;
  fields: string[]; // References to Field IDs
  defaultFormBlock?: string;
  categories?: string[]; // For organizing field groups
}

// Field Template - for generating dynamic fields
interface FieldTemplate {
  id: string;
  name: string;
  description?: string;
  baseType: FieldType;
  template: string; // Template with variables
  variables: Record<string, {
    type: string;
    defaultValue?: any;
    options?: any[];
  }>;
  generateFields: (variables: Record<string, any>) => Field[];
}
export interface DataRecordPayload {
	source: string;
	period: string;
	dataElement: string;
	attributeOptionCombo: string;
	data: Record<string, any>;
	date: Date;
	comment?: string | null;
	followup?: boolean;
}
export type StoredDataRecord = DataRecordPayload & { uniqueKey: string };

export type DataValueMapping = {
	dataElementId: string;
	value: Record<string, any>;
}

export interface DataValuePayload {
	source: string;
	period: string;
	dataElement: string;
	categoryOptionCombo: string;
	attributeOptionCombo: string;
	value: string;
	date: Date;
    comment?: string
	followup?: boolean;
}
export type StoredDataValue = DataValuePayload & { uniqueKey: string };

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

export enum FieldStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
  WARNING = 'warning'
}

export const QuestionTypes = {
	INTEGER_SELECT: 1,
	TEXT_SELECT: 2,
	MULTIPLE_SELECT: 3,
	INTEGER_BOOLEAN: 4,
	TEXT_BOOLEAN: 5,
	INTEGER_INPUT: 6,
	TEXT_INPUT: 7,
	MENU_VALUE_SELECT: 8,
	MENU_OBJECT_SELECT: 9,
	CUSTOM: 10,
	HIDDEN: 11
  } as const;