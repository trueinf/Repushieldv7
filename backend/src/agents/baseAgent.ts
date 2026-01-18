import { Configuration } from '../types/configuration';
import { FilterCriteria, matchesFilterCriteria, buildSearchQuery } from '../utils/filterUtils';

export interface AgentResult {
  platform: string;
  postsFetched: number;
  postsStored: number;
  errors: string[];
}

export abstract class BaseAgent {
  protected config: Configuration;
  protected filterCriteria: FilterCriteria;

  constructor(config: Configuration) {
    this.config = config;
    this.filterCriteria = {
      entityName: config.entityDetails.name,
      alternateNames: config.entityDetails.alternateNames,
      ontologyKeywords: config.ontology,
      socialHandles: config.entityDetails.handles,
    };
  }

  protected matchesFilter(text: string, authorUsername: string | null, authorName: string | null): boolean {
    return matchesFilterCriteria(text, authorUsername, authorName, this.filterCriteria);
  }

  protected buildQuery(): string {
    return buildSearchQuery(this.filterCriteria);
  }

  abstract execute(): Promise<AgentResult>;
}








