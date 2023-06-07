export interface SyndigoResult {
    syndigoData: SyndigoData[];
}

export interface SyndigoData {
    ImportMode:                        string;
    ProductIdentifierPropertyOverride: string;
    ProductIdentifierValue:            string;
    SourceParties:                     string[];
    TaxonomyNodes:                     string[];
    CatalogItems:                      any[];
    PackageType:                       string;
    ImmediateParentDetails:            ImmediateParentDetails;
    RecipientsToLink:                  any[];
    RecipientsRequirementSets:         ImmediateParentDetails;
    WorkflowId:                        null;
    ComplexValues:                     any[];
    NutritionalInformationModule:      NutritionalInformationModule;
    LifeCycle:                         LifeCycle;
    AuditInfo:                         AuditInfo;
    Archived:                          boolean;
    ArchivedMetadata:                  null;
    Values:                            Value[];
    MultiValues:                       any[];
    ContainerValues:                   any[];
    AssetValues:                       AssetValue[];
    IsExplicitNullValue:               boolean;
}

export interface AssetValue {
    Name:                string;
    ValuesByLocale:      AssetValueValuesByLocale;
    SourceParty:         string;
    Recipient:           string;
    Delete:              boolean;
    IsExplicitNullValue: boolean;
}

export interface AssetValueValuesByLocale {
    "en-US": EnUS;
}

export interface EnUS {
    Name:      string;
    Url:       string;
    SourceUrl: string;
    Format:    string;
}

export interface AuditInfo {
    CreatedDate:      Date;
    LastModifiedDate: Date;
}

export interface ImmediateParentDetails {
}

export interface LifeCycle {
    CreatedDate:     CreatedDate;
    DiscontinueDate: null;
    DeleteDate:      null;
}

export interface CreatedDate {
    Value:  Date;
    Delete: boolean;
}

export interface NutritionalInformationModule {
    Values:              any[];
    MultiValues:         any[];
    ContainerValues:     any[];
    AssetValues:         any[];
    DocumentValues:      any[];
    IsExplicitNullValue: boolean;
}

export interface Value {
    Name:                string;
    ValuesByLocale:      string;
    SourceParty:         string;
    Recipient:           string;
    Delete:              boolean;
    IsExplicitNullValue: boolean;
}

