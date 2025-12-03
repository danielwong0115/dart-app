import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Game } from '../../utils/types'

interface AccuracyTimelineChartProps {
  games: Game[]
  selectedSection: string
}

interface ChartDataPoint {
  session: number
  accuracy: number
  date: string
  attempts: number
  hits: number
}

const formatSectionName = (sectionKey: string): string => {
  if (sectionKey === 'bullseye') return 'Bullseye'
  if (sectionKey === 'outer-bull') return 'Outer Bull (25)'
  
  const [type, number] = sectionKey.split('-')
  const typeMap: Record<string, string> = {
    'single': 'Single',
    'double': 'Double',
    'triple': 'Triple'
  }
  return `${typeMap[type] || type} ${number}`
}

export const AccuracyTimelineChart = ({ games, selectedSection }: AccuracyTimelineChartProps) => {
  const chartData = useMemo(() => {
    // Filter training games and sort by date (oldest first)
    const trainingGames = games
      .filter(game => game.gameMode === 'training' && game.trainingAccuracy)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    const data: ChartDataPoint[] = []
    
    trainingGames.forEach((game, index) => {
      if (!game.trainingAccuracy) return
      
      const sectionData = game.trainingAccuracy.sections[selectedSection]
      if (!sectionData) return
      
      const accuracy = sectionData.attempts > 0 
        ? (sectionData.hits / sectionData.attempts) * 100 
        : 0
      
      data.push({
        session: index + 1,
        accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal
        date: new Date(game.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: new Date(game.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        }),
        attempts: sectionData.attempts,
        hits: sectionData.hits
      })
    })
    
    return data
  }, [games, selectedSection])
  
  if (chartData.length === 0) {
    return (
      <div className="accuracy-timeline-empty">
        <p>No accuracy data available for {formatSectionName(selectedSection)}</p>
        <p className="accuracy-timeline-empty-subtitle">
          Practice this section in training mode to see your progress over time
        </p>
      </div>
    )
  }
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint
      return (
        <div className="accuracy-tooltip">
          <p className="accuracy-tooltip-title">Session #{data.session}</p>
          <p className="accuracy-tooltip-date">{data.date}</p>
          <p className="accuracy-tooltip-accuracy">
            Accuracy: <strong>{data.accuracy}%</strong>
          </p>
          <p className="accuracy-tooltip-stats">
            {data.hits} hits / {data.attempts} attempts
          </p>
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="accuracy-timeline">
      <h3 className="accuracy-timeline-title">
        Accuracy Over Time: {formatSectionName(selectedSection)}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="session" 
            stroke="#9ca3af"
            label={{ value: 'Training Session', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            domain={[0, 100]}
            label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: '#9ca3af' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="accuracy" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Accuracy (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
