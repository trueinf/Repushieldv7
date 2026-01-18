export type EntityType = 'individual' | 'political-party' | 'brand' | 'organization';

export interface EntityDetails {
  name: string;
  alternateNames: string[];
  description: string;
  handles: {
    twitter: string[];
    youtube: string[];
    facebook: string[];
    website: string[];
  };
  spokespersons: string[];
  leadership: string[];
  abbreviations: string[];
}

export interface OntologyData {
  coreKeywords: string[];
  associatedKeywords: string[];
  narrativeKeywords: string[];
  exclusionKeywords: string[];
}

export interface PlatformOptions {
  languages: string[];
  regions: string[];
  verifiedOnly: boolean;
}

export interface PlatformConfig {
  platforms: string[];
  options: {
    [key: string]: PlatformOptions;
  };
}

export interface Configuration {
  id: string;
  entityType: EntityType;
  entityDetails: EntityDetails;
  ontology: OntologyData;
  platformConfig: PlatformConfig;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}








