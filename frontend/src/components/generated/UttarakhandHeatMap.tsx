import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';

// Mention counts by district
const MOCK_MENTION_DATA: Record<string, number> = {
  'Almora': 180,
  'Bageshwar': 45,
  'Chamoli': 120,
  'Champawat': 35,
  'Dehradun': 380,
  'Haridwar': 420,
  'Nainital': 250,
  'Pauri Garhwal': 140,
  'Pithoragarh': 95,
  'Rudraprayag': 65,
  'Tehri Garhwal': 160,
  'Udham Singh Nagar': 300,
  'Uttarkashi': 80,
};

// Generate realistic sentiment splits based on district characteristics
const getDistrictSentiment = (district: string, total: number) => {
  // Deterministic hash for consistent results
  const hash = district.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Different districts have different sentiment patterns
  // Urban districts (Dehradun, Haridwar, Nainital) tend to have more mixed sentiment
  // Rural districts vary more
  const isUrban = ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar'].includes(district);
  
  let positivePct: number;
  let negativePct: number;
  
  if (isUrban) {
    // Urban: 45-65% positive, 20-35% negative
    positivePct = 0.45 + ((hash % 21) / 100); // 0.45 to 0.66
    negativePct = 0.20 + (((hash * 3) % 16) / 100); // 0.20 to 0.36
  } else {
    // Rural: 35-55% positive, 25-45% negative
    positivePct = 0.35 + (((hash * 2) % 21) / 100); // 0.35 to 0.56
    negativePct = 0.25 + (((hash * 5) % 21) / 100); // 0.25 to 0.46
  }
  
  // Special cases for high negative districts
  if (district === 'Haridwar' || district === 'Dehradun') {
    negativePct = Math.max(negativePct, 0.32); // Higher negative for major districts
  }
  
  const positive = Math.round(total * positivePct);
  const negative = Math.round(total * negativePct);
  const neutral = total - positive - negative;
  
  return {
    total,
    positive: Math.max(0, positive),
    negative: Math.max(0, negative),
    neutral: Math.max(0, neutral),
  };
};

// Generate device distribution data
const getDistrictDeviceData = (district: string, total: number) => {
  const hash = district.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isUrban = ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar'].includes(district);
  
  let mobilePct: number;
  let desktopPct: number;
  let tabletPct: number;
  
  if (isUrban) {
    // Urban: Higher desktop usage (40-50%), mobile (45-55%), tablet (5-10%)
    desktopPct = 0.40 + ((hash % 11) / 100); // 0.40 to 0.50
    mobilePct = 0.45 + (((hash * 2) % 11) / 100); // 0.45 to 0.55
    tabletPct = 0.05 + (((hash * 3) % 6) / 100); // 0.05 to 0.10
  } else {
    // Rural: Higher mobile usage (60-75%), desktop (20-35%), tablet (5-10%)
    mobilePct = 0.60 + (((hash * 2) % 16) / 100); // 0.60 to 0.75
    desktopPct = 0.20 + (((hash * 3) % 16) / 100); // 0.20 to 0.35
    tabletPct = 0.05 + (((hash * 4) % 6) / 100); // 0.05 to 0.10
  }
  
  // Normalize to ensure they sum to 1
  const sum = mobilePct + desktopPct + tabletPct;
  mobilePct = mobilePct / sum;
  desktopPct = desktopPct / sum;
  tabletPct = tabletPct / sum;
  
  return {
    mobile: Math.round(total * mobilePct),
    desktop: Math.round(total * desktopPct),
    tablet: Math.round(total * tabletPct),
  };
};

// Generate age distribution data
const getDistrictAgeData = (district: string, total: number) => {
  const hash = district.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isUrban = ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar'].includes(district);
  
  let ageGroups: Record<string, number>;
  let averageAge: number;
  
  if (isUrban) {
    // Urban: More diverse age groups, slightly older average (35-42 years)
    const base18_24 = 0.15 + ((hash % 8) / 100); // 0.15 to 0.22
    const base25_34 = 0.25 + (((hash * 2) % 10) / 100); // 0.25 to 0.34
    const base35_44 = 0.22 + (((hash * 3) % 8) / 100); // 0.22 to 0.29
    const base45_54 = 0.18 + (((hash * 4) % 7) / 100); // 0.18 to 0.24
    const base55 = 0.12 + (((hash * 5) % 6) / 100); // 0.12 to 0.17
    
    const sum = base18_24 + base25_34 + base35_44 + base45_54 + base55;
    ageGroups = {
      '18-24': Math.round(total * (base18_24 / sum)),
      '25-34': Math.round(total * (base25_34 / sum)),
      '35-44': Math.round(total * (base35_44 / sum)),
      '45-54': Math.round(total * (base45_54 / sum)),
      '55+': Math.round(total * (base55 / sum)),
    };
    
    averageAge = 35 + ((hash % 8)); // 35 to 42
  } else {
    // Rural: Younger average age (28-35 years), more concentrated in 25-44 range
    const base18_24 = 0.20 + (((hash * 2) % 10) / 100); // 0.20 to 0.29
    const base25_34 = 0.35 + (((hash * 3) % 10) / 100); // 0.35 to 0.44
    const base35_44 = 0.25 + (((hash * 4) % 8) / 100); // 0.25 to 0.32
    const base45_54 = 0.12 + (((hash * 5) % 6) / 100); // 0.12 to 0.17
    const base55 = 0.05 + (((hash * 6) % 5) / 100); // 0.05 to 0.09
    
    const sum = base18_24 + base25_34 + base35_44 + base45_54 + base55;
    ageGroups = {
      '18-24': Math.round(total * (base18_24 / sum)),
      '25-34': Math.round(total * (base25_34 / sum)),
      '35-44': Math.round(total * (base35_44 / sum)),
      '45-54': Math.round(total * (base45_54 / sum)),
      '55+': Math.round(total * (base55 / sum)),
    };
    
    averageAge = 28 + ((hash % 8)); // 28 to 35
  }
  
  return {
    ageGroups,
    averageAge,
  };
};

// Generate realistic analysis content
const getDistrictAnalysis = (district: string, sentiment: { total: number; positive: number; negative: number; neutral: number }) => {
  const sentimentDelta = sentiment.positive - sentiment.negative;
  const isStrong = sentimentDelta > 0;
  const negativeRatio = sentiment.negative / sentiment.total;
  const isHighNegative = negativeRatio > 0.35;
  
  const strongReasons = [
    'Strong support for development initiatives and infrastructure projects in the region',
    'Positive engagement with government policies and welfare schemes',
    'High visibility of successful public service delivery and citizen satisfaction',
    'Active community participation in governance-related discussions',
    'Favorable coverage of local development milestones and achievements',
  ];
  
  const weakReasons = [
    'Concerns about implementation delays in key infrastructure projects',
    'Mixed reactions to policy changes affecting local communities',
    'Increased scrutiny on governance and administrative efficiency',
    'Growing discussion around service delivery gaps and citizen grievances',
    'Heightened attention on regional development priorities and resource allocation',
  ];
  
  const topDrivers = [
    { label: 'Infrastructure Development', w: 65 + (district.length % 20) },
    { label: 'Public Services', w: 55 + ((district.charCodeAt(0) % 15)) },
    { label: 'Policy Implementation', w: 45 + ((sentiment.total % 20)) },
    { label: 'Local Governance', w: 35 + ((sentiment.negative % 15)) },
  ].sort((a, b) => b.w - a.w);
  
  const recommendations = isStrong ? [
    'Continue highlighting successful development projects and citizen testimonials',
    'Maintain proactive communication about ongoing initiatives and future plans',
    'Engage with positive sentiment clusters to amplify supportive narratives',
  ] : [
    'Address specific concerns raised in high-engagement negative posts',
    'Provide transparent updates on project timelines and implementation status',
    'Engage directly with critical voices to clarify policy positions and actions',
  ];
  
  return {
    isStrong,
    isHighNegative,
    sentimentDelta,
    strongReasons: isStrong ? strongReasons.slice(0, 3) : strongReasons.slice(0, 2),
    weakReasons: isStrong ? weakReasons.slice(0, 2) : weakReasons.slice(0, 3),
    topDrivers,
    recommendations,
  };
};

// Color gradient function - returns color based on negative sentiment count with smooth transition
const getColor = (negativeCount: number, minNegative: number, maxNegative: number): string => {
  const range = maxNegative - minNegative;
  let normalized = range > 0 ? (negativeCount - minNegative) / range : 0;
  
  // Apply easing function for smoother transition (ease-in-out cubic)
  normalized = normalized < 0.5 
    ? 4 * normalized * normalized * normalized 
    : 1 - Math.pow(-2 * normalized + 2, 3) / 2;
  
  // Multi-stop gradient: light orange -> orange -> coral -> soft red
  // Using softer colors for a more pleasant visual appearance
  let r, g, b;
  
  if (normalized < 0.25) {
    // Light orange to orange
    const t = normalized / 0.25;
    r = Math.round(255);
    g = Math.round(240 + (220 - 240) * t);
    b = Math.round(200 + (150 - 200) * t);
  } else if (normalized < 0.5) {
    // Orange to deep orange
    const t = (normalized - 0.25) / 0.25;
    r = Math.round(255);
    g = Math.round(220 + (180 - 220) * t);
    b = Math.round(150 + (100 - 150) * t);
  } else if (normalized < 0.75) {
    // Deep orange to coral
    const t = (normalized - 0.5) / 0.25;
    r = Math.round(255);
    g = Math.round(180 + (140 - 180) * t);
    b = Math.round(100 + (60 - 100) * t);
  } else {
    // Coral to soft red (not pure red)
    const t = (normalized - 0.75) / 0.25;
    r = Math.round(255);
    g = Math.round(140 + (100 - 140) * t);
    b = Math.round(60 + (40 - 60) * t);
  }
  
  return `rgb(${r}, ${g}, ${b})`;
};

interface TooltipData {
  district: string;
  total: number;
  positive: number;
  negative: number;
  x: number;
  y: number;
}

interface DistrictMetrics {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
}

interface UttarakhandHeatMapProps {
  viewMode?: 'principal' | 'team';
}

export const UttarakhandHeatMap: React.FC<UttarakhandHeatMapProps> = ({ viewMode = 'principal' }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [stateOutline, setStateOutline] = useState<any>(null);
  const [districts, setDistricts] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceTooltip, setDeviceTooltip] = useState<{ type: string; x: number; y: number } | null>(null);
  const [ageTooltip, setAgeTooltip] = useState<{ ageGroup: string; x: number; y: number } | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  // Load the accurate state outline and districts
  useEffect(() => {
    Promise.all([
      fetch('/uttarakhand-state-outline.geojson').then(res => res.json()),
      fetch('/uttarakhand-districts.geojson').then(res => res.json())
    ])
      .then(([stateData, districtData]) => {
        setStateOutline(stateData);
        setDistricts(districtData);
      })
      .catch(err => {
        console.error('Failed to load GeoJSON data:', err);
      });
  }, []);

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  // Calculate negative sentiment for all districts to get min/max for color scaling
  const districtNegativeSentiments: Record<string, number> = {};
  const districtDeviceData: Record<string, { mobile: number; desktop: number; tablet: number }> = {};
  const districtAgeData: Record<string, { ageGroups: Record<string, number>; averageAge: number }> = {};
  
  Object.keys(MOCK_MENTION_DATA).forEach(district => {
    const total = MOCK_MENTION_DATA[district];
    const sentiment = getDistrictSentiment(district, total);
    districtNegativeSentiments[district] = sentiment.negative;
    districtDeviceData[district] = getDistrictDeviceData(district, sentiment.negative); // Use negative count for device data
    districtAgeData[district] = getDistrictAgeData(district, sentiment.negative); // Use negative count for age data
  });
  
  // For team view, filter to only high-risk districts (above average negative sentiment)
  const allNegativeValues = Object.values(districtNegativeSentiments);
  const averageNegative = allNegativeValues.reduce((a, b) => a + b, 0) / allNegativeValues.length;
  const highRiskDistricts = viewMode === 'team' 
    ? Object.keys(districtNegativeSentiments).filter(district => districtNegativeSentiments[district] >= averageNegative)
    : Object.keys(districtNegativeSentiments);
  
  const maxNegative = Math.max(...allNegativeValues);
  const minNegative = Math.min(...allNegativeValues);

  // Aggregate device and age data for high-risk districts (team view)
  const aggregatedDeviceData = viewMode === 'team' ? (() => {
    let totalMobile = 0;
    let totalDesktop = 0;
    let totalTablet = 0;
    
    highRiskDistricts.forEach(district => {
      const deviceData = districtDeviceData[district];
      totalMobile += deviceData.mobile;
      totalDesktop += deviceData.desktop;
      totalTablet += deviceData.tablet;
    });
    
    const total = totalMobile + totalDesktop + totalTablet;
    return {
      mobile: totalMobile,
      desktop: totalDesktop,
      tablet: totalTablet,
      mobilePct: total > 0 ? Math.round((totalMobile / total) * 100) : 0,
      desktopPct: total > 0 ? Math.round((totalDesktop / total) * 100) : 0,
      tabletPct: total > 0 ? Math.round((totalTablet / total) * 100) : 0,
    };
  })() : null;

  const aggregatedAgeData = viewMode === 'team' ? (() => {
    const ageGroups: Record<string, number> = {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55+': 0,
    };
    let totalAge = 0;
    let totalCount = 0;
    
    highRiskDistricts.forEach(district => {
      const ageData = districtAgeData[district];
      Object.keys(ageGroups).forEach(ageGroup => {
        ageGroups[ageGroup] += ageData.ageGroups[ageGroup];
      });
      totalAge += ageData.averageAge * (districtNegativeSentiments[district] || 0);
      totalCount += districtNegativeSentiments[district] || 0;
    });
    
    const total = Object.values(ageGroups).reduce((a, b) => a + b, 0);
    const averageAge = totalCount > 0 ? Math.round(totalAge / totalCount) : 0;
    
    return {
      ageGroups: {
        '18-24': ageGroups['18-24'],
        '25-34': ageGroups['25-34'],
        '35-44': ageGroups['35-44'],
        '45-54': ageGroups['45-54'],
        '55+': ageGroups['55+'],
      },
      ageGroupPcts: {
        '18-24': total > 0 ? Math.round((ageGroups['18-24'] / total) * 100) : 0,
        '25-34': total > 0 ? Math.round((ageGroups['25-34'] / total) * 100) : 0,
        '35-44': total > 0 ? Math.round((ageGroups['35-44'] / total) * 100) : 0,
        '45-54': total > 0 ? Math.round((ageGroups['45-54'] / total) * 100) : 0,
        '55+': total > 0 ? Math.round((ageGroups['55+'] / total) * 100) : 0,
      },
      averageAge,
    };
  })() : null;

  const selectedMetrics = selectedDistrict 
    ? getDistrictSentiment(selectedDistrict, MOCK_MENTION_DATA[selectedDistrict] || 0)
    : null;
  const selectedAnalysis = selectedDistrict && selectedMetrics
    ? getDistrictAnalysis(selectedDistrict, selectedMetrics)
    : null;

  // Get district-wise breakdown for device type
  const getDistrictWiseDeviceBreakdown = (deviceType: 'mobile' | 'desktop' | 'tablet') => {
    const breakdown: Array<{ district: string; count: number; pct: number }> = [];
    let total = 0;
    
    highRiskDistricts.forEach(district => {
      const deviceData = districtDeviceData[district];
      const count = deviceData[deviceType];
      total += count;
      breakdown.push({ district, count, pct: 0 });
    });
    
    breakdown.forEach(item => {
      item.pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });
    
    return breakdown.sort((a, b) => b.count - a.count);
  };

  // Get district-wise breakdown for age group
  const getDistrictWiseAgeBreakdown = (ageGroup: string) => {
    const breakdown: Array<{ district: string; count: number; pct: number }> = [];
    let total = 0;
    
    highRiskDistricts.forEach(district => {
      const ageData = districtAgeData[district];
      const count = ageData.ageGroups[ageGroup];
      total += count;
      breakdown.push({ district, count, pct: 0 });
    });
    
    breakdown.forEach(item => {
      item.pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });
    
    return breakdown.sort((a, b) => b.count - a.count);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-1">
          {viewMode === 'team' 
            ? 'High-Risk Districts - Negative Sentiment Focus' 
            : 'Uttarakhand Negative Sentiment Heat Map'}
        </h3>
        <p className="text-sm text-gray-500">
          {viewMode === 'team' 
            ? 'Districts requiring immediate attention based on negative sentiment levels.'
            : 'Negative sentiment distribution across districts.'}
        </p>
      </div>

      <div className="relative" ref={mapContainerRef}>
        <div className="w-full h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-4">
          <div className="w-full h-full">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                center: [79.29, 30.09],
                scale: 11500,
              }}
              style={{ width: '100%', height: '100%' }}
            >
            {/* State Outline - exact shape with light fill */}
            {stateOutline && (
              <Geographies geography={stateOutline}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={`state-${geo.rsmKey}`}
                      geography={geo}
                      fill="#E0F2F1"
                      stroke="#1F9D8A"
                      strokeWidth={2}
                      style={{
                        default: {
                          fill: '#E0F2F1',
                          stroke: '#1F9D8A',
                          strokeWidth: 2,
                          outline: 'none',
                        },
                        hover: {
                          fill: '#E0F2F1',
                          stroke: '#1F9D8A',
                          strokeWidth: 2,
                          outline: 'none',
                        },
                        pressed: {
                          fill: '#E0F2F1',
                          stroke: '#1F9D8A',
                          strokeWidth: 2,
                          outline: 'none',
                        },
                      }}
                    />
                  ))
                }
              </Geographies>
            )}
            
            {/* Districts with heat colors - rendered on top */}
            {districts && (
              <Geographies geography={districts}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const districtName = geo.properties.district || geo.properties.NAME_2 || geo.properties.name;
                    
                    // Filter districts for team view
                    if (viewMode === 'team' && !highRiskDistricts.includes(districtName)) {
                      // Gray out or hide low-risk districts in team view
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#E5E7EB"
                          stroke="#D1D5DB"
                          strokeWidth={0.5}
                          style={{
                            default: {
                              fill: '#E5E7EB',
                              stroke: '#D1D5DB',
                              strokeWidth: 0.5,
                              outline: 'none',
                              opacity: 0.3,
                            },
                            hover: {
                              fill: '#E5E7EB',
                              stroke: '#D1D5DB',
                              strokeWidth: 0.5,
                              outline: 'none',
                              opacity: 0.3,
                            },
                          }}
                        />
                      );
                    }
                    
                    const total = MOCK_MENTION_DATA[districtName] || 0;
                    const sentiment = getDistrictSentiment(districtName, total);
                    const negativeCount = sentiment.negative;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(negativeCount, minNegative, maxNegative)}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      style={{
                        default: {
                          fill: getColor(negativeCount, minNegative, maxNegative),
                          stroke: '#FFFFFF',
                          strokeWidth: 1,
                          outline: 'none',
                        },
                        hover: {
                          fill: getColor(negativeCount, minNegative, maxNegative),
                          stroke: '#1F9D8A',
                          strokeWidth: 2,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: getColor(negativeCount, minNegative, maxNegative),
                          stroke: '#1F9D8A',
                          strokeWidth: 2,
                          outline: 'none',
                        },
                      }}
                      onMouseEnter={(event: any) => {
                        const districtName = geo.properties.district || geo.properties.NAME_2 || geo.properties.name;
                        const total = MOCK_MENTION_DATA[districtName] || 0;
                        const sentiment = getDistrictSentiment(districtName, total);
                        if (mapContainerRef.current) {
                          const rect = mapContainerRef.current.getBoundingClientRect();
                          setTooltip({
                            district: districtName,
                            total: sentiment.total,
                            positive: sentiment.positive,
                            negative: sentiment.negative,
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top,
                          });
                        }
                      }}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => {
                        setSelectedDistrict(districtName);
                        setIsModalOpen(true);
                      }}
                    />
                  );
                })
              }
              </Geographies>
            )}
            </ComposableMap>
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 pointer-events-none min-w-[200px]"
              style={{
                left: `${Math.min(tooltip.x + 10, window.innerWidth - 250)}px`,
                top: `${Math.max(tooltip.y - 80, 10)}px`,
              }}
            >
              <div className="text-sm font-semibold text-gray-900 mb-2">{tooltip.district}</div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-gray-50 rounded px-2 py-1.5">
                  <div className="text-gray-500 mb-0.5">Total</div>
                  <div className="font-semibold text-gray-900">{tooltip.total.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50 rounded px-2 py-1.5">
                  <div className="text-emerald-700 mb-0.5">Positive</div>
                  <div className="font-semibold text-emerald-900">{tooltip.positive.toLocaleString()}</div>
                </div>
                <div className="bg-rose-50 rounded px-2 py-1.5">
                  <div className="text-rose-700 mb-0.5">Negative</div>
                  <div className="font-semibold text-rose-900">{tooltip.negative.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 mt-2 text-center">Click for detailed analysis</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* District Analysis Modal */}
      <AnimatePresence>
        {isModalOpen && selectedDistrict && selectedMetrics && selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={{ y: 12, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">District Analysis</div>
                  <h4 className="text-lg font-bold text-gray-900">{selectedDistrict}</h4>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                      Total: {selectedMetrics.total.toLocaleString()}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                      Positive: {selectedMetrics.positive.toLocaleString()}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 font-medium">
                      Negative: {selectedMetrics.negative.toLocaleString()}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 font-medium">
                      Neutral: {selectedMetrics.neutral.toLocaleString()}
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-full font-medium ${
                        selectedAnalysis.isStrong
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      Sentiment: {selectedAnalysis.sentimentDelta >= 0 ? '+' : ''}
                      {selectedAnalysis.sentimentDelta.toLocaleString()}
                    </span>
                    {selectedAnalysis.isHighNegative && (
                      <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-900 font-medium">
                        High Negative Ratio
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <div className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Strength Indicators
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm text-emerald-800 list-disc list-inside">
                    {selectedAnalysis.strongReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                  <div className="text-sm font-semibold text-rose-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                    Areas of Concern
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm text-rose-800 list-disc list-inside">
                    {selectedAnalysis.weakReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-4 border border-gray-200 bg-gray-50">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Top Discussion Drivers</div>
                  <div className="space-y-2.5">
                    {selectedAnalysis.topDrivers.map((driver, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-32 text-xs text-gray-600 truncate font-medium">{driver.label}</div>
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                            style={{ width: `${driver.w}%` }}
                          />
                        </div>
                        <div className="w-10 text-right text-xs text-gray-700 font-semibold">{driver.w}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-4 border border-gray-200 bg-blue-50">
                  <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Recommended Actions
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-700 list-disc list-inside">
                    {selectedAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-600">
                  Analysis based on sentiment patterns and engagement metrics from recent mentions
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-600 font-medium">Low Negative</span>
          <div className="flex items-center space-x-1">
            {[0, 0.25, 0.5, 0.75, 1].map((value) => {
              const negativeCount = Math.round(minNegative + (maxNegative - minNegative) * value);
              return (
                <div
                  key={value}
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: getColor(negativeCount, minNegative, maxNegative) }}
                />
              );
            })}
          </div>
          <span className="text-xs text-gray-600 font-medium">High Negative</span>
        </div>
        <div className="text-xs text-gray-500">
          Range: {minNegative.toLocaleString()} - {maxNegative.toLocaleString()} negative mentions
        </div>
      </div>

      {/* District List */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {Object.entries(MOCK_MENTION_DATA)
          .filter(([district]) => viewMode === 'principal' || highRiskDistricts.includes(district))
          .map(([district, total]) => {
            const sentiment = getDistrictSentiment(district, total);
            return { district, negative: sentiment.negative };
          })
          .sort((a, b) => b.negative - a.negative)
          .map(({ district, negative }) => (
            <div
              key={district}
              className={`flex items-center justify-between p-2 rounded ${
                viewMode === 'team' && highRiskDistricts.includes(district)
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50'
              }`}
            >
              <span className="text-gray-700 font-medium truncate">{district}</span>
              <span className="text-rose-600 font-bold ml-2">{negative}</span>
            </div>
          ))}
      </div>

      {/* Device & Demographics Analysis - Team View Only */}
      {viewMode === 'team' && aggregatedDeviceData && aggregatedAgeData && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-base font-bold text-gray-900">Device & Demographics Analysis</h4>
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
              High-Risk Districts
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Distribution */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <h5 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Device Distribution
              </h5>
              <div className="space-y-3">
                {/* Mobile */}
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDeviceTooltip({ type: 'mobile', x: rect.left + rect.width / 2, y: rect.top - 10 });
                  }}
                  onMouseLeave={() => setDeviceTooltip(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Mobile</span>
                    <span className="text-xs font-bold text-gray-900">
                      {aggregatedDeviceData.mobilePct}% ({aggregatedDeviceData.mobile.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${aggregatedDeviceData.mobilePct}%` }}
                    />
                  </div>
                </div>
                
                {/* Desktop/Laptop */}
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDeviceTooltip({ type: 'desktop', x: rect.left + rect.width / 2, y: rect.top - 10 });
                  }}
                  onMouseLeave={() => setDeviceTooltip(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Desktop/Laptop</span>
                    <span className="text-xs font-bold text-gray-900">
                      {aggregatedDeviceData.desktopPct}% ({aggregatedDeviceData.desktop.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-600 rounded-full transition-all"
                      style={{ width: `${aggregatedDeviceData.desktopPct}%` }}
                    />
                  </div>
                </div>
                
                {/* Tablet */}
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDeviceTooltip({ type: 'tablet', x: rect.left + rect.width / 2, y: rect.top - 10 });
                  }}
                  onMouseLeave={() => setDeviceTooltip(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Tablet</span>
                    <span className="text-xs font-bold text-gray-900">
                      {aggregatedDeviceData.tabletPct}% ({aggregatedDeviceData.tablet.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${aggregatedDeviceData.tabletPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Age Distribution */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <h5 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Age Distribution
              </h5>
              <div className="space-y-2.5">
                {Object.entries(aggregatedAgeData.ageGroupPcts).map(([ageGroup, pct]) => {
                  const count = aggregatedAgeData.ageGroups[ageGroup];
                  const colors: Record<string, string> = {
                    '18-24': 'bg-blue-400',
                    '25-34': 'bg-blue-500',
                    '35-44': 'bg-indigo-500',
                    '45-54': 'bg-purple-500',
                    '55+': 'bg-purple-600',
                  };
                  
                  return (
                    <div
                      key={ageGroup}
                      className="relative cursor-pointer"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setAgeTooltip({ ageGroup, x: rect.left + rect.width / 2, y: rect.top - 10 });
                      }}
                      onMouseLeave={() => setAgeTooltip(null)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{ageGroup} years</span>
                        <span className="text-xs font-bold text-gray-900">
                          {pct}% ({count.toLocaleString()})
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${colors[ageGroup] || 'bg-gray-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">Data Source:</span> Aggregated from{' '}
              <span className="font-semibold text-gray-900">{highRiskDistricts.length}</span> high-risk district
              {highRiskDistricts.length !== 1 ? 's' : ''} based on negative sentiment posts
            </p>
          </div>
        </div>
      )}

      {/* Device Distribution Tooltip */}
      <AnimatePresence>
        {deviceTooltip && (() => {
          const breakdown = getDistrictWiseDeviceBreakdown(deviceTooltip.type as 'mobile' | 'desktop' | 'tablet');
          const deviceLabel = deviceTooltip.type === 'mobile' ? 'Mobile' : deviceTooltip.type === 'desktop' ? 'Desktop/Laptop' : 'Tablet';
          
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 pointer-events-none min-w-[280px] max-w-[320px]"
              style={{
                left: `${Math.min(deviceTooltip.x - 140, window.innerWidth - 320)}px`,
                top: `${Math.max(deviceTooltip.y - 150, 10)}px`,
              }}
            >
              <div className="text-sm font-bold text-gray-900 mb-3">{deviceLabel} - District Breakdown</div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium truncate flex-1">{item.district}</span>
                    <span className="text-gray-900 font-bold ml-2">{item.count.toLocaleString()}</span>
                    <span className="text-gray-500 ml-2">({item.pct}%)</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Age Distribution Tooltip */}
      <AnimatePresence>
        {ageTooltip && (() => {
          const breakdown = getDistrictWiseAgeBreakdown(ageTooltip.ageGroup);
          
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 pointer-events-none min-w-[280px] max-w-[320px]"
              style={{
                left: `${Math.min(ageTooltip.x - 140, window.innerWidth - 320)}px`,
                top: `${Math.max(ageTooltip.y - 150, 10)}px`,
              }}
            >
              <div className="text-sm font-bold text-gray-900 mb-3">{ageTooltip.ageGroup} years - District Breakdown</div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium truncate flex-1">{item.district}</span>
                    <span className="text-gray-900 font-bold ml-2">{item.count.toLocaleString()}</span>
                    <span className="text-gray-500 ml-2">({item.pct}%)</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
