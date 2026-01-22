import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { HeatMapDataPoint } from '../types';

interface DualAxisChartProps {
  data: HeatMapDataPoint[];
}

interface TimeSegment {
  timeIndex: number;
  songBPM: number;
  heartRate: number;
  durationMinutes: number;
}

const DualAxisChart: React.FC<DualAxisChartProps> = ({ data }) => {
  // Process data into time segments
  const timeSegments = useMemo(() => {
    const segments: TimeSegment[] = [];
    let currentTime = 0;
    
    data.forEach((point) => {
      // Create segments based on duration
      const numSegments = Math.max(1, Math.round(point.durationMinutes * 2)); // 2 segments per minute
      const segmentDuration = point.durationMinutes / numSegments;
      
      for (let i = 0; i < numSegments; i++) {
        segments.push({
          timeIndex: currentTime,
          songBPM: point.songBPM,
          heartRate: point.heartRate,
          durationMinutes: segmentDuration,
        });
        currentTime += segmentDuration;
      }
    });
    
    return segments;
  }, [data]);

  // Calculate max values for scaling
  const maxBPM = useMemo(() => {
    return Math.max(...timeSegments.map(s => s.songBPM), 200);
  }, [timeSegments]);

  const maxHeartRate = useMemo(() => {
    return Math.max(...timeSegments.map(s => s.heartRate), 200);
  }, [timeSegments]);

  const minHeartRate = useMemo(() => {
    return Math.min(...timeSegments.map(s => s.heartRate), 60);
  }, [timeSegments]);

  const totalDuration = useMemo(() => {
    return timeSegments.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [timeSegments]);

  // Use all segments for accurate representation
  const displaySegments = timeSegments;

  const chartHeight = 180;
  const screenWidth = Dimensions.get('window').width;
  const minBarWidth = 4; // Minimum width for each bar
  const barWidth = Math.max(minBarWidth, 3); // Fixed bar width
  const chartWidth = Math.max(
    screenWidth - 120, // Minimum width (account for padding and axes)
    displaySegments.length * barWidth // Actual width needed for all data
  );

  // Get color for BPM bar based on intensity
  const getBPMColor = (bpm: number) => {
    const normalized = bpm / maxBPM;
    if (normalized < 0.2) {
      return 'rgba(67, 56, 202, 0.6)'; // Indigo
    } else if (normalized < 0.4) {
      return 'rgba(99, 102, 241, 0.7)'; // Purple-blue
    } else if (normalized < 0.6) {
      return 'rgba(139, 92, 246, 0.75)'; // Bright purple
    } else if (normalized < 0.8) {
      return 'rgba(192, 38, 211, 0.85)'; // Magenta
    } else {
      return 'rgba(236, 72, 153, 0.9)'; // Vibrant pink
    }
  };

  // Calculate Y position for heart rate (inverted, so higher = lower Y)
  const getHeartRateY = (heartRate: number) => {
    const normalized = (heartRate - minHeartRate) / (maxHeartRate - minHeartRate);
    return chartHeight - (normalized * chartHeight);
  };

  // Calculate height for BPM bar
  const getBPMHeight = (bpm: number) => {
    return (bpm / maxBPM) * chartHeight;
  };

  // Generate Y-axis labels for BPM (left side) - reversed so higher is at top
  const bpmAxisLabels = useMemo(() => {
    const labels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = Math.round((maxBPM / steps) * i);
      labels.push(value);
    }
    return labels.reverse(); // Reverse so higher BPM is at top
  }, [maxBPM]);

  // Generate Y-axis labels for Heart Rate (right side)
  const hrAxisLabels = useMemo(() => {
    const labels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = Math.round(minHeartRate + ((maxHeartRate - minHeartRate) / steps) * i);
      labels.push(value);
    }
    return labels;
  }, [minHeartRate, maxHeartRate]);

  // Generate X-axis time labels
  const timeLabels = useMemo(() => {
    const labels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const time = (totalDuration / steps) * i;
      labels.push(Math.round(time));
    }
    return labels;
  }, [totalDuration]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BPM & HEART RATE OVER TIME</Text>
        <Text style={styles.subtitle}>
          {Math.round(totalDuration)} min total
        </Text>
      </View>
      
      <View style={styles.wrapper}>
        {/* Y-axis labels container */}
        <View style={styles.yAxisLabelContainer}>
          <Text style={styles.yAxisLabel}>SONG BPM</Text>
        </View>
        
        <View style={styles.chartContent}>
          {/* Left Y-axis (BPM) - Fixed - reversed so higher is at top */}
          <View style={styles.leftYAxis}>
            {bpmAxisLabels.map((label, index) => (
              <View key={index} style={styles.yAxisValueCell}>
                <Text style={styles.axisValueText}>{label}</Text>
              </View>
            ))}
          </View>
          
          {/* Scrollable Chart area */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View style={styles.chartArea}>
              <View style={[styles.chartContainer, { height: chartHeight, width: chartWidth }]}>
                {/* Grid lines */}
                {bpmAxisLabels.map((_, index) => (
                  <View
                    key={`grid-${index}`}
                    style={[
                      styles.gridLine,
                      {
                        top: (chartHeight / (bpmAxisLabels.length - 1)) * (bpmAxisLabels.length - 1 - index),
                        width: chartWidth,
                      },
                    ]}
                  />
                ))}
                
                {/* BPM Bars */}
                {displaySegments.map((segment, index) => {
                  const barHeight = getBPMHeight(segment.songBPM);
                  const barColor = getBPMColor(segment.songBPM);
                  return (
                    <View
                      key={`bar-${index}`}
                      style={[
                        styles.bar,
                        {
                          left: (index * barWidth),
                          width: barWidth * 0.8,
                          height: barHeight,
                          bottom: 0,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  );
                })}
                
                {/* Heart Rate Line - using connected segments */}
                {displaySegments.length > 1 && (
                  <View style={styles.lineContainer}>
                    {displaySegments.map((segment, index) => {
                      if (index === 0) return null;
                      const prevSegment = displaySegments[index - 1];
                      const x1 = (index - 1) * barWidth + barWidth / 2;
                      const y1 = getHeartRateY(prevSegment.heartRate);
                      const x2 = index * barWidth + barWidth / 2;
                      const y2 = getHeartRateY(segment.heartRate);
                      
                      // Calculate line length and angle
                      const dx = x2 - x1;
                      const dy = y2 - y1;
                      const length = Math.sqrt(dx * dx + dy * dy);
                      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                      
                      // Adjust position for rotation (rotate around center)
                      const centerX = (x1 + x2) / 2;
                      const centerY = (y1 + y2) / 2;
                      
                      return (
                        <View
                          key={`line-${index}`}
                          style={[
                            styles.line,
                            {
                              left: centerX - length / 2,
                              top: centerY - 1,
                              width: length,
                              transform: [{ rotate: `${angle}deg` }],
                            },
                          ]}
                        />
                      );
                    })}
                    
                    {/* Heart Rate Points */}
                    {displaySegments.map((segment, index) => {
                      const x = index * barWidth + barWidth / 2;
                      const y = getHeartRateY(segment.heartRate);
                      return (
                        <View
                          key={`point-${index}`}
                          style={[
                            styles.point,
                            {
                              left: x - 3,
                              top: y - 3,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
              
              {/* X-axis time labels */}
              <View style={[styles.xAxisContainer, { width: chartWidth }]}>
                {timeLabels.map((label, index) => (
                  <View
                    key={index}
                    style={[
                      styles.xAxisValueCell,
                      {
                        left: (index / (timeLabels.length - 1)) * chartWidth - 15,
                      },
                    ]}
                  >
                    <Text style={styles.axisValueText}>{label}m</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          
          {/* Right Y-axis (Heart Rate) - Fixed */}
          <View style={styles.rightYAxis}>
            {hrAxisLabels.map((label, index) => (
              <View key={index} style={styles.yAxisValueCell}>
                <Text style={[styles.axisValueText, styles.heartRateAxisText]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* X-axis label */}
        <View style={styles.xAxisLabelContainer}>
          <Text style={styles.xAxisLabel}>TIME (MINUTES)</Text>
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, { backgroundColor: 'rgba(139, 92, 246, 0.75)' }]} />
            <Text style={styles.legendText}>Song BPM</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine]} />
            <Text style={styles.legendText}>Heart Rate</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  wrapper: {
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  yAxisLabelContainer: {
    marginBottom: 8,
    paddingLeft: 50,
    width: 50,
    alignItems: 'center',
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingRight: 12,
  },
  leftYAxis: {
    width: 50,
    marginRight: 8,
  },
  rightYAxis: {
    width: 50,
    marginLeft: 8,
  },
  yAxisValueCell: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  axisValueText: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heartRateAxisText: {
    color: 'rgba(244, 114, 182, 0.9)',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  chartContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bar: {
    position: 'absolute',
    borderRadius: 2,
  },
  lineContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#F472B6',
  },
  point: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F472B6',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  xAxisContainer: {
    position: 'relative',
    height: 20,
    marginTop: 4,
  },
  xAxisValueCell: {
    position: 'absolute',
    width: 30,
    alignItems: 'center',
  },
  xAxisLabelContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBar: {
    width: 20,
    height: 12,
    borderRadius: 2,
  },
  legendLine: {
    width: 20,
    height: 2,
    backgroundColor: '#F472B6',
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});

export default DualAxisChart;
