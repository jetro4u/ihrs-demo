export interface DataValuePayload {
	source: string;
	period: string;
	dataElement: string;
	categoryOptionCombo: string;
	attributeOptionCombo: string;
	value: string;
	date: Date;
    storedBy: string
    comment?: string
    created: string
    lastUpdated: string
    deleted: boolean
	followup?: boolean;
}


export type DataValueAuditDto = {
    attributeOptionCombo: UID_CategoryOptionCombo
    auditType: DataValueAuditDto.auditType
    categoryOptionCombo: UID_CategoryOptionCombo
    created: string
    dataElement: UID_DataElement
    modifiedBy: string
    org: UID_Organisation
    period: string
    value: string
}

export namespace DataValueAuditDto {
    export enum auditType {
        CREATE = 'CREATE',
        UPDATE = 'UPDATE',
        DELETE = 'DELETE',
        READ = 'READ',
        SEARCH = 'SEARCH',
    }
}

export type DataValueCategoryDto = {
    combo: UID_CategoryCombo
    options: Array<Record<string, any>>
}

export type DataValueContextDto = {
    audits: Array<DataValueAuditDto>
    history: Array<DataValueDto>
}

export type DataValueDto = {
    attribute: DataValueCategoryDto
    categoryOptionCombo: UID_CategoryOptionCombo
    comment: string
    created: string
    dataElement: UID_DataElement
    dataSet: UID_DataSet
    followUp: boolean
    force: boolean
    lastUpdated: string
    org: UID_Organisation
    period: string
    storedBy: string
    value: string
}

export type DataValueFollowUpRequest = {
    attribute: DataValueCategoryDto
    attributeOptionCombo: UID_CategoryOptionCombo
    categoryOptionCombo: UID_CategoryOptionCombo
    dataElement: UID_DataSet
    followup: boolean
    org: UID_Organisation
    period: string
}

export type DataValuesDto = {
    completeStatus: CompleteStatusDto
    dataValues: Array<DataValueDto>
    lockStatus: DataValuesDto.lockStatus
    minMaxValues: Array<MinMaxValueDto>
}

export namespace DataValuesDto {
    export enum lockStatus {
        LOCKED = 'LOCKED',
        APPROVED = 'APPROVED',
        OPEN = 'OPEN',
    }
}

export type DataValueSet = {
    attributeCategoryOptions: Array<string>
    attributeOptionCombo: string
    categoryOptionComboIdScheme: string
    completeDate: string
    dataElementIdScheme: string
    dataSet: string
    dataSetIdScheme: string
    dataValues: Array<DataValue>
    dryRun: boolean
    idScheme: string
    org: string
    orgIdScheme: string
    period: string
    strategy: string
}

export type DataValuesFollowUpRequest = {
    values: Array<DataValueFollowUpRequest>
}

export type DeflatedDataValue = {
    attributeOptionComboId: number
    categoryOptionComboId: number
    categoryOptionComboName: string
    comment: string
    dataElementId: number
    dataElementName: string
    deleted: boolean
    followup: boolean
    max: number
    min: number
    period: string
    periodId: number
    sourceId: number
    sourceName: string
    sourcePath: string
    value: string
}
