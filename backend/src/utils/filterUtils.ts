export interface FilterCriteria {
  entityName: string;
  alternateNames: string[];
  ontologyKeywords: {
    coreKeywords: string[];
    associatedKeywords: string[];
    narrativeKeywords: string[];
    exclusionKeywords: string[];
  };
  socialHandles: {
    twitter: string[];
    youtube: string[];
    facebook: string[];
    website: string[];
  };
}

export function matchesFilterCriteria(
  text: string,
  authorUsername: string | null,
  authorName: string | null,
  criteria: FilterCriteria
): boolean {
  const searchText = (text || '').toLowerCase();
  const username = (typeof authorUsername === 'string' ? authorUsername : String(authorUsername || '')).toLowerCase();
  const name = (typeof authorName === 'string' ? authorName : String(authorName || '')).toLowerCase();

  // Check exclusion keywords first - if found, exclude
  for (const exclusionKeyword of criteria.ontologyKeywords.exclusionKeywords) {
    if (searchText.includes(exclusionKeyword.toLowerCase())) {
      return false;
    }
  }

  // Normalize entity name (remove spaces, special chars for flexible matching)
  const normalizedEntityName = criteria.entityName.toLowerCase().replace(/\s+/g, '');
  const normalizedSearchText = searchText.replace(/\s+/g, '');
  const normalizedName = name.replace(/\s+/g, '');
  
  // Check if matches entity name or alternate names (with flexible matching)
  const entityNameMatch = 
    searchText.includes(criteria.entityName.toLowerCase()) ||
    normalizedSearchText.includes(normalizedEntityName) ||
    name.includes(criteria.entityName.toLowerCase()) ||
    normalizedName.includes(normalizedEntityName);
  
  const alternateNameMatch = criteria.alternateNames.some(altName => {
    const normalizedAltName = altName.toLowerCase().replace(/\s+/g, '');
    return searchText.includes(altName.toLowerCase()) || 
           normalizedSearchText.includes(normalizedAltName) ||
           name.includes(altName.toLowerCase()) ||
           normalizedName.includes(normalizedAltName);
  });

  // Check if matches core keywords
  const coreKeywordMatch = criteria.ontologyKeywords.coreKeywords.some(keyword =>
    searchText.includes(keyword.toLowerCase())
  );

  // Check if matches associated keywords
  const associatedKeywordMatch = criteria.ontologyKeywords.associatedKeywords.some(keyword =>
    searchText.includes(keyword.toLowerCase())
  );

  // Check if matches narrative keywords
  const narrativeKeywordMatch = criteria.ontologyKeywords.narrativeKeywords.some(keyword =>
    searchText.includes(keyword.toLowerCase())
  );

  // Check if author username/handle matches
  const handleMatch = 
    criteria.socialHandles.twitter.some(handle => 
      username.includes(handle.replace('@', '').toLowerCase()) ||
      searchText.includes(handle.toLowerCase())
    ) ||
    criteria.socialHandles.facebook.some(handle =>
      username.includes(handle.toLowerCase()) ||
      searchText.includes(handle.toLowerCase())
    );

  // Must match at least one criteria
  const matches = entityNameMatch ||
    alternateNameMatch ||
    coreKeywordMatch ||
    associatedKeywordMatch ||
    narrativeKeywordMatch ||
    handleMatch;

  // Enhanced debug logging for filtered posts
  if (!matches) {
    const debugInfo = {
      entityNameMatch,
      alternateNameMatch,
      coreKeywordMatch,
      associatedKeywordMatch,
      narrativeKeywordMatch,
      handleMatch,
      entityName: criteria.entityName,
      coreKeywords: criteria.ontologyKeywords.coreKeywords.slice(0, 3),
      textPreview: text.substring(0, 150),
    };
    
    // Log first few filtered posts for debugging
    if (Math.random() < 0.2) {
      console.log(`[Filter] Post filtered out:`, debugInfo);
    }
  }

  return matches;
}

export function buildSearchQuery(criteria: FilterCriteria): string {
  const terms: string[] = [];

  // Add entity name
  terms.push(criteria.entityName);

  // Add alternate names
  terms.push(...criteria.alternateNames);

  // Add core keywords
  terms.push(...criteria.ontologyKeywords.coreKeywords);

  // Add associated keywords (limit to avoid query too long)
  terms.push(...criteria.ontologyKeywords.associatedKeywords.slice(0, 10));

  // Remove duplicates and join
  return [...new Set(terms)].join(' OR ');
}
