import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Game } from '../../utils/types'

interface TrainingAccuracyChartProps {
  games: Game[]
}

interface ChartDataPoint {
  session: number
  accuracy: number
  date: string
  attempts: number
  hits: number
}

export const TrainingAccuracyChart = ({ games }: TrainingAccuracyChartProps) => {
  const chartData = useMemo(() => {
    // Filter training games and sort by date (oldest first)
    const trainingGames = games
      .filter(game => game.gameMode === 'training' && game.trainingAccuracy)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    const data: ChartDataPoint[] = []
    
    trainingGames.forEach((game, index) => {
      if (!game.trainingAccuracy) return
      
      // Calculate combined accuracy across all sections
      let totalAttempts = 0
      let totalHits = 0
      
      Object.values(game.trainingAccuracy.sections).forEach(sectionData => {
        totalAttempts += sectionData.attempts
        totalHits += sectionData.hits
      })
      
      const accuracy = totalAttempts > 0 
        ? (totalHits / totalAttempts) * 100 
        : 0
      
      data.push({
        session: index + 1,
        accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal
        date: new Date(game.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: new Date(game.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        }),
        attempts: totalAttempts,
        hits: totalHits
      })
    })
    
    return data
  }, [games])
  
  if (chartData.length === 0) {
    return (
      <div className="training-accuracy-chart-empty">
        <p>No training session data available</p>
        <p className="training-accuracy-chart-empty-subtitle">
          Complete training sessions to see your overall accuracy progress
        </p>
      </div>
    )
  }
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint
      return (
        <div className="accuracy-tooltip">
          <p className="accuracy-tooltip-title">Training Session #{data.session}</p>
          <p className="accuracy-tooltip-date">{data.date}</p>
          <p className="accuracy-tooltip-accuracy">
            Overall Accuracy: <strong>{data.accuracy}%</strong>
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
    <div className="training-accuracy-chart">
      <h3 className="training-accuracy-chart-title">
        Training Accuracy Over Time
      </h3>
      <p className="training-accuracy-chart-subtitle">
        Combined accuracy across all target sections
      </p>
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
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Overall Accuracy (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
