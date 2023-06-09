export class SyndigoResult {
    syndigoData: SyndigoData = new SyndigoData(); 
}

export class SyndigoData {
    DefaultLocale:                string;
    ErrorMode:                    string;
    MarketplaceProductImportData: MarketplaceProductImportData;
    heinensLayout:                     HeinensSyndigo[]; 
    imageURLs: any = [];
    imageFilenames: any = [];
}

export class ProducingOperationDetails {
    ResultCount:                  number;
    TotalHitCount:                number;
}

export class MarketplaceProductImportData {
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

export class HeinensSyndigo {
    indexSyndigo:       number;
    productName:        string= 'no data';
    height:             string= 'no data';
    depth:              string= 'no data';
    weight:             string= 'no data';
    width:              string= 'no data';
    heightUOM:          string= 'no data';
    depthUOM:           string= 'no data';
    weightUOM:          string= 'no data';
    widthUOM:           string= 'no data';
    UPC:                string;
    frontImageURL:      string;
    backImageURL:       string;
    topImageURL:        string;
    leftImageURL:       string;
    rightImageURL:      string;
    bottomImageURL:     string;
    source: any[] = [];
}

export class AssetValue {
    Name:                string;
    ValuesByLocale:      AssetValueValuesByLocale;
    SourceParty:         string;
    Recipient:           string;
    Delete:              boolean;
    IsExplicitNullValue: boolean;
}

export class AssetValueValuesByLocale {
    "en-US": EnUS;
}

export class EnUS {
    Name:      string;
    Url:       string;
    SourceUrl: string;
    Format:    string;
}

export class AuditInfo {
    CreatedDate:      Date;
    LastModifiedDate: Date;
}

export class ImmediateParentDetails {
}

export class LifeCycle {
    CreatedDate:     CreatedDate;
    DiscontinueDate: null;
    DeleteDate:      null;
}

export class CreatedDate {
    Value:  Date;
    Delete: boolean;
}

export class NutritionalInformationModule {
    Values:              any[];
    MultiValues:         any[];
    ContainerValues:     any[];
    AssetValues:         any[];
    DocumentValues:      any[];
    IsExplicitNullValue: boolean;
}

export class Value {
    Name:                string;
    ValuesByLocale:      string;
    SourceParty:         string;
    Recipient:           string;
    Delete:              boolean;
    IsExplicitNullValue: boolean;
}

