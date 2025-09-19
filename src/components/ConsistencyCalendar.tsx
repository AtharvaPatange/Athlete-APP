"use client";
import { useState, useEffect } from 'react';
import { getSessionsByDateRange, TrainingSession } from '@/services/performanceService';
import { subDays, startOfYear, endOfYear, format, addDays, isSameDay } from 'date-fns';

interface ConsistencyCalendarProps {
  athleteId: string;
}

interface DayData {
  date: Date;
  level: number; // 0-4 intensity levels (like GitHub)
  sessionCount: number;
  totalDuration: number;
  sports: string[];
}

export default function ConsistencyCalendar({ athleteId }: ConsistencyCalendarProps) {
  const [yearData, setYearData] = useState<DayData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [totalSessions, setTotalSessions] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());

  useEffect(() => {
    const loadYearData = async () => {
      setLoading(true);
      
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
      
      // Get all sessions for the year
      const sessionsResult = await getSessionsByDateRange(athleteId, yearStart, yearEnd);
      
      if (sessionsResult.success) {
        const sessions = sessionsResult.sessions;
        
        // Create a map for quick lookup
        const sessionsByDate = new Map<string, TrainingSession[]>();
        sessions.forEach(session => {
          const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
          if (!sessionsByDate.has(dateKey)) {
            sessionsByDate.set(dateKey, []);
          }
          sessionsByDate.get(dateKey)!.push(session);
        });
        
        // Generate all days of the year
        const days: DayData[] = [];
        let currentDate = new Date(yearStart);
        
        while (currentDate <= yearEnd) {
          const dateKey = format(currentDate, 'yyyy-MM-dd');
          const daySessions = sessionsByDate.get(dateKey) || [];
          
          // Calculate intensity level (0-4) based on sessions and duration
          let level = 0;
          if (daySessions.length > 0) {
            const totalDuration = daySessions.reduce((sum, s) => sum + s.duration, 0);
            
            // Convert string intensity to numeric for calculation
            const intensityMap = { low: 1, medium: 2, high: 3, peak: 4 };
            const avgIntensity = daySessions.reduce((sum, s) => sum + (intensityMap[s.intensity] || 0), 0) / daySessions.length;
            
            // Scoring algorithm similar to GitHub contributions
            if (totalDuration >= 120 || avgIntensity >= 3.5) level = 4; // High intensity or long duration
            else if (totalDuration >= 90 || avgIntensity >= 2.5) level = 3; // Medium-high
            else if (totalDuration >= 60 || avgIntensity >= 1.5) level = 2; // Medium
            else if (totalDuration > 0) level = 1; // Light activity
          }
          
          days.push({
            date: new Date(currentDate),
            level,
            sessionCount: daySessions.length,
            totalDuration: daySessions.reduce((sum, s) => sum + s.duration, 0),
            sports: [...new Set(daySessions.map(s => s.sport))]
          });
          
          currentDate = addDays(currentDate, 1);
        }
        
        setYearData(days);
        calculateStats(days, sessions);
      }
      
      // Reset to current month when year changes (but only if it's the current year)
      if (selectedYear === new Date().getFullYear()) {
        setCurrentMonthIndex(new Date().getMonth());
      } else {
        setCurrentMonthIndex(0); // Start from January for other years
      }
      
      setLoading(false);
    };

    if (athleteId) {
      loadYearData();
    }
  }, [athleteId, selectedYear]);

  const calculateStats = (days: DayData[], sessions: TrainingSession[]) => {
    // Total sessions
    setTotalSessions(sessions.length);
    
    // Calculate streaks
    let currentStreakCount = 0;
    let longestStreakCount = 0;
    let tempStreak = 0;
    
    // Start from today and work backwards for current streak
    const today = new Date();
    const reversedDays = [...days].reverse();
    
    for (const day of reversedDays) {
      if (isSameDay(day.date, today) || day.date < today) {
        if (day.level > 0) {
          if (currentStreakCount === 0) currentStreakCount = 1;
          else currentStreakCount++;
        } else if (currentStreakCount > 0) {
          break; // Streak is broken
        }
      }
    }
    
    // Calculate longest streak
    for (const day of days) {
      if (day.level > 0) {
        tempStreak++;
        longestStreakCount = Math.max(longestStreakCount, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    setCurrentStreak(currentStreakCount);
    setLongestStreak(longestStreakCount);
  };

  const getColorClass = (level: number): string => {
    const colors = [
      'bg-gray-100', // Level 0 - No activity
      'bg-green-200', // Level 1 - Light
      'bg-green-400', // Level 2 - Medium
      'bg-green-600', // Level 3 - High
      'bg-green-800'  // Level 4 - Very High
    ];
    return colors[level] || colors[0];
  };

  const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
    setHoveredDay(day);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Group days by month
  const months: DayData[][] = [];
  for (let month = 0; month < 12; month++) {
    const monthDays = yearData.filter(day => 
      day.date.getTime() > 0 && day.date.getMonth() === month
    );
    months.push(monthDays);
  }

  // Month labels array
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get 8 months starting from current month
  const getVisibleMonths = () => {
    const visibleMonths = [];
    for (let i = 0; i < 8; i++) {
      const monthIndex = (currentMonthIndex + i) % 12;
      visibleMonths.push({
        data: months[monthIndex],
        index: monthIndex,
        label: monthLabels[monthIndex]
      });
    }
    return visibleMonths;
  };

  const visibleMonths = getVisibleMonths();

  const canGoBack = currentMonthIndex > 0;
  const canGoForward = currentMonthIndex < 4; // Can show up to May (index 4) to display Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan

  const handlePrevious = () => {
    if (canGoBack) {
      setCurrentMonthIndex(Math.max(0, currentMonthIndex - 1));
    }
  };

  const handleNext = () => {
    if (canGoForward) {
      setCurrentMonthIndex(Math.min(4, currentMonthIndex + 1));
    }
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="flex gap-1 justify-between">
            {Array.from({ length: 8 }).map((_, monthIndex) => (
              <div key={monthIndex} className="flex flex-col flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-12 mb-2 mx-auto"></div>
                {Array.from({ length: 6 }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex mb-1 justify-center">
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                      <div key={dayIndex} className="w-3.5 h-3.5 mr-0.5 bg-gray-200 rounded-sm"></div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Training Consistency</h3>
          <p className="text-sm text-gray-600">
            {totalSessions} training sessions in {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Current streak:</span> {currentStreak} days
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Longest streak:</span> {longestStreak} days
          </div>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setCurrentMonthIndex(new Date().getMonth()); // Reset to current month when year changes
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year} className="text-gray-900">{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevious}
          disabled={!canGoBack}
          className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
            canGoBack 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!canGoForward}
          className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
            canGoForward 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar */}
      <div className="relative">
        {/* Day labels */}
        <div className="flex mb-2 text-xs text-gray-500 justify-between">
          {Array.from({ length: 8 }).map((_, monthIndex) => (
            <div key={monthIndex} className="flex flex-1 justify-center min-w-0">
              {dayLabels.map((day, dayIndex) => (
                <div key={`${monthIndex}-${dayIndex}-${day}`} className="w-3.5 text-center font-medium mr-0.5">
                  {day}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Calendar grid - 8 months side by side */}
        <div className="flex gap-1 justify-between">
          {visibleMonths.map((monthInfo, monthIndex) => {
            const monthDays = monthInfo.data;
            
            // Get first day of the month to determine starting position
            const firstDay = new Date(selectedYear, monthInfo.index, 1);
            const startingDayOfWeek = firstDay.getDay();
            const daysInMonth = new Date(selectedYear, monthInfo.index + 1, 0).getDate();
            
            return (
              <div key={monthInfo.index} className="flex flex-col flex-1 min-w-0">
                {/* Month label */}
                <div className="text-xs font-semibold text-gray-700 mb-2 text-center">
                  {monthInfo.label}
                </div>
                
                {/* Create rows for the month */}
                {Array.from({ length: 6 }).map((_, weekIndex) => (
                  <div key={`week-${monthInfo.index}-${weekIndex}`} className="flex mb-1 justify-center">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const dayNumber = weekIndex * 7 + dayIndex - startingDayOfWeek + 1;
                      
                      if (dayNumber < 1 || dayNumber > daysInMonth) {
                        return (
                          <div
                            key={`empty-${monthInfo.index}-${weekIndex}-${dayIndex}`}
                            className="w-3.5 h-3.5 mr-0.5"
                          />
                        );
                      }
                      
                      const dayData = monthDays.find(day => day.date.getDate() === dayNumber);
                      
                      return (
                        <div
                          key={`day-${monthInfo.index}-${weekIndex}-${dayIndex}`}
                          className={`w-3.5 h-3.5 mr-0.5 rounded-sm cursor-pointer border border-gray-200 ${
                            dayData ? getColorClass(dayData.level) : 'bg-gray-100'
                          }`}
                          onMouseEnter={(e) => dayData && handleMouseEnter(dayData, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                          title={dayData ? format(dayData.date, 'MMM d, yyyy') : ''}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm border border-gray-200 ${getColorClass(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div
            className="fixed bg-gray-900 text-white p-2 rounded shadow-lg text-xs z-50 pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
              maxWidth: '200px'
            }}
          >
            <div className="font-medium">{format(hoveredDay.date, 'EEEE, MMM d, yyyy')}</div>
            {hoveredDay.sessionCount > 0 ? (
              <>
                <div>{hoveredDay.sessionCount} session{hoveredDay.sessionCount > 1 ? 's' : ''}</div>
                <div>{hoveredDay.totalDuration} minutes total</div>
                {hoveredDay.sports.length > 0 && (
                  <div>Sports: {hoveredDay.sports.join(', ')}</div>
                )}
              </>
            ) : (
              <div>No training sessions</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}