import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Star, Calendar, Code, GitBranch, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { StarHistoryData, ChartMode } from '../types';
import { calculateGrowthRate, findGrowthSpikes } from '../utils/chart';

interface StarHistoryChartProps {
  data: StarHistoryData;
}

const StarHistoryChart: React.FC<StarHistoryChartProps> = ({ data }) => {
  const [chartMode, setChartMode] = useState<ChartMode>("Date");
  const [showGrowthRate, setShowGrowthRate] = useState(false);

  const formatDate = (dateStr: string | Date | number) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : 
                  typeof dateStr === 'number' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTimelineDays = (days: number) => {
    if (days < 30) {
      return `${Math.floor(days)}d`;
    } else if (days < 365) {
      return `${Math.floor(days / 30)}mo`;
    } else {
      return `${Math.floor(days / 365)}y`;
    }
  };

  // Process data based on chart mode
  const chartData = useMemo(() => {
    const startDate = new Date(data.history[0]?.date || data.createdAt).getTime();
    
    return data.history.map((point, index) => {
      const pointDate = new Date(point.date);
      
      if (chartMode === "Timeline") {
        const daysSinceStart = (pointDate.getTime() - startDate) / (1000 * 60 * 60 * 24);
        return {
          ...point,
          x: daysSinceStart,
          displayDate: formatTimelineDays(daysSinceStart)
        };
      } else {
        return {
          ...point,
          x: pointDate.getTime(),
          displayDate: formatDate(pointDate)
        };
      }
    });
  }, [data.history, chartMode, data.createdAt]);

  // Calculate growth rate data
  const growthData = useMemo(() => {
    const growth = calculateGrowthRate(data.history);
    const spikes = findGrowthSpikes(growth, 2.5);
    
    const startDate = new Date(data.history[0]?.date || data.createdAt).getTime();
    
    return spikes.map(item => {
      const itemDate = new Date(item.date);
      
      if (chartMode === "Timeline") {
        const daysSinceStart = (itemDate.getTime() - startDate) / (1000 * 60 * 60 * 24);
        return {
          ...item,
          x: daysSinceStart,
          displayDate: formatTimelineDays(daysSinceStart)
        };
      } else {
        return {
          ...item,
          x: itemDate.getTime(),
          displayDate: formatDate(itemDate)
        };
      }
    });
  }, [data.history, chartMode, data.createdAt]);

  const currentData = showGrowthRate ? growthData : chartData;
  const yAxisDataKey = showGrowthRate ? "growthRate" : "stars";
  const yAxisLabel = showGrowthRate ? "Stars per Day" : "Stars";

  // Find major spikes for highlighting
  const majorSpikes = growthData.filter(item => item.isSpike);

  return (
    <div className="space-y-6">
      {/* Repository Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{data.repo}</h2>
            <p className="text-gray-600 mb-4">{data.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>{formatNumber(data.totalStars)} stars</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>{data.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(data.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold">{formatNumber(data.totalStars)}</div>
              <div className="text-sm opacity-90">Total Stars</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chart Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Chart Options</h3>
            
            {/* Chart Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mode:</span>
              <button
                onClick={() => setChartMode(chartMode === "Date" ? "Timeline" : "Date")}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartMode === "Date" 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {chartMode === "Date" ? <Calendar className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {chartMode}
              </button>
            </div>

            {/* Growth Rate Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setShowGrowthRate(!showGrowthRate)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  showGrowthRate 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {showGrowthRate ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {showGrowthRate ? "Growth Rate" : "Total Stars"}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {chartMode === "Date" ? "Calendar dates" : "Days since first star"} • 
            {showGrowthRate ? " Growth spikes highlighted" : " Cumulative stars"}
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-800">
            {showGrowthRate ? "Growth Rate Analysis" : "Star Growth History"}
          </h3>
          {showGrowthRate && majorSpikes.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              {majorSpikes.length} spike{majorSpikes.length !== 1 ? 's' : ''} detected
            </span>
          )}
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="x"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => {
                  if (chartMode === "Timeline") {
                    return formatTimelineDays(value);
                  } else {
                    return formatDate(new Date(value));
                  }
                }}
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={showGrowthRate ? (value) => `${value.toFixed(1)}/day` : formatNumber}
                stroke="#666"
                fontSize={12}
                label={{ 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                formatter={(value: number) => [
                  showGrowthRate ? `${value.toFixed(2)} stars/day` : formatNumber(value), 
                  yAxisLabel
                ]}
                labelFormatter={(label: number) => {
                  if (chartMode === "Timeline") {
                    return `${formatTimelineDays(label)} since first star`;
                  } else {
                    return `Date: ${formatDate(new Date(label))}`;
                  }
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={yAxisDataKey}
                stroke={showGrowthRate ? "#10b981" : "url(#gradient)"}
                strokeWidth={showGrowthRate ? 2 : 3}
                dot={showGrowthRate ? { fill: '#10b981', strokeWidth: 1, r: 2 } : { fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: showGrowthRate ? '#10b981' : '#3B82F6', strokeWidth: 2 }}
              />
              
              {/* Highlight growth spikes */}
              {showGrowthRate && majorSpikes.map((spike, index) => (
                <ReferenceDot
                  key={index}
                  x={spike.x}
                  y={spike.growthRate}
                  r={8}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
              
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Insights */}
        {showGrowthRate && majorSpikes.length > 0 && (
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Growth Spikes Detected
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {majorSpikes.slice(0, 6).map((spike, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-gray-800">
                    {spike.displayDate}
                  </div>
                  <div className="text-xs text-gray-600">
                    +{spike.growthRate.toFixed(1)} stars/day
                  </div>
                  <div className="text-xs text-orange-600">
                    {formatNumber(spike.stars)} total stars
                  </div>
                </div>
              ))}
            </div>
            {majorSpikes.length > 6 && (
              <p className="text-sm text-orange-700 mt-2">
                And {majorSpikes.length - 6} more spike{majorSpikes.length - 6 !== 1 ? 's' : ''}...
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StarHistoryChart;