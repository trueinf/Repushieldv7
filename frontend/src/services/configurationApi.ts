import { apiClient, ApiError } from './api';

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

export interface CreateConfigurationDto {
  entityType: EntityType;
  entityDetails: EntityDetails;
  ontology: OntologyData;
  platformConfig: PlatformConfig;
  isActive?: boolean;
}

export class ConfigurationApi {
  static async getAll(): Promise<Configuration[]> {
    try {
      return await apiClient.get<Configuration[]>('/configurations');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getById(id: string): Promise<Configuration> {
    try {
      return await apiClient.get<Configuration>(`/configurations/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getActive(): Promise<Configuration | null> {
    try {
      return await apiClient.get<Configuration>('/configurations/active');
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  static async create(data: CreateConfigurationDto): Promise<Configuration> {
    try {
      return await apiClient.post<Configuration>('/configurations', data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async update(id: string, data: Partial<CreateConfigurationDto>): Promise<Configuration> {
    try {
      return await apiClient.put<Configuration>(`/configurations/${id}`, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/configurations/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async activate(id: string): Promise<Configuration> {
    try {
      return await apiClient.post<Configuration>(`/configurations/${id}/activate`, {});
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private static handleError(error: unknown): Error {
    const apiError = error as ApiError;
    
    if (apiError.details && apiError.details.length > 0) {
      const details = apiError.details.map(d => `${d.path}: ${d.message}`).join(', ');
      return new Error(`${apiError.message} (${details})`);
    }
    
    return new Error(apiError.message || 'An unexpected error occurred');
  }
}








