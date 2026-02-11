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

// Color gradient function - returns color based on mention count with smooth transition
const getColor = (count: number): string => {
  const maxCount = Math.max(...Object.values(MOCK_MENTION_DATA));
  const minCount = Math.min(...Object.values(MOCK_MENTION_DATA));
  const range = maxCount - minCount;
  let normalized = range > 0 ? (count - minCount) / range : 0;
  
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

export const UttarakhandHeatMap: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [stateOutline, setStateOutline] = useState<any>(null);
  const [districts, setDistricts] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Get max and min for legend
  const maxCount = Math.max(...Object.values(MOCK_MENTION_DATA));
  const minCount = Math.min(...Object.values(MOCK_MENTION_DATA));

  const selectedMetrics = selectedDistrict 
    ? getDistrictSentiment(selectedDistrict, MOCK_MENTION_DATA[selectedDistrict] || 0)
    : null;
  const selectedAnalysis = selectedDistrict && selectedMetrics
    ? getDistrictAnalysis(selectedDistrict, selectedMetrics)
    : null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-1">Uttarakhand Mentions Heat Map</h3>
        <p className="text-sm text-gray-500">Mention distribution across districts</p>
      </div>

      <div className="relative" ref={mapContainerRef}>
        <div className="w-full h-[500px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              center: [79.29, 30.09],
              scale: 15000,
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
                    const total = MOCK_MENTION_DATA[districtName] || 0;
                    const sentiment = getDistrictSentiment(districtName, total);
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(total)}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      style={{
                        default: {
                          fill: getColor(total),
                          stroke: '#FFFFFF',
                          strokeWidth: 1,
                          outline: 'none',
                        },
                        hover: {
                          fill: getColor(total),
                          stroke: '#1F9D8A',
                          strokeWidth: 2,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: getColor(total),
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
          <span className="text-xs text-gray-600 font-medium">Low</span>
          <div className="flex items-center space-x-1">
            {[0, 0.25, 0.5, 0.75, 1].map((value) => {
              const count = Math.round(minCount + (maxCount - minCount) * value);
              return (
                <div
                  key={value}
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: getColor(count) }}
                />
              );
            })}
          </div>
          <span className="text-xs text-gray-600 font-medium">High</span>
        </div>
        <div className="text-xs text-gray-500">
          Range: {minCount.toLocaleString()} - {maxCount.toLocaleString()} mentions
        </div>
      </div>

      {/* District List */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {Object.entries(MOCK_MENTION_DATA)
          .sort(([, a], [, b]) => b - a)
          .map(([district, count]) => (
            <div
              key={district}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="text-gray-700 font-medium truncate">{district}</span>
              <span className="text-[#1F9D8A] font-bold ml-2">{count}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
