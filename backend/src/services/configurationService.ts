import { v4 as uuidv4 } from 'uuid';
import { Configuration } from '../types/configuration.js';

const configurations: Map<string, Configuration> = new Map();

export class ConfigurationService {
  static getAll(): Configuration[] {
    return Array.from(configurations.values());
  }

  static getById(id: string): Configuration | null {
    return configurations.get(id) || null;
  }

  static getActive(): Configuration | null {
    const all = this.getAll();
    return all.find(config => config.isActive) || null;
  }

  static create(data: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>): Configuration {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const config: Configuration = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (data.isActive) {
      this.deactivateAll();
    }

    configurations.set(id, config);
    return config;
  }

  static update(id: string, data: Partial<Omit<Configuration, 'id' | 'createdAt'>>): Configuration | null {
    const existing = configurations.get(id);
    if (!existing) {
      return null;
    }

    if (data.isActive && data.isActive !== existing.isActive) {
      this.deactivateAll();
    }

    const updated: Configuration = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    configurations.set(id, updated);
    return updated;
  }

  static delete(id: string): boolean {
    return configurations.delete(id);
  }

  static deactivateAll(): void {
    configurations.forEach((config) => {
      if (config.isActive) {
        config.isActive = false;
        config.updatedAt = new Date().toISOString();
      }
    });
  }

  static activate(id: string): Configuration | null {
    const config = configurations.get(id);
    if (!config) {
      return null;
    }

    this.deactivateAll();
    return this.update(id, { isActive: true });
  }
}








