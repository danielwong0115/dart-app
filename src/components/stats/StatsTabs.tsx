export type StatsTab = 'history' | 'aggregate' | 'tendency'

interface StatsTabsProps {
  activeTab: StatsTab
  onTabChange: (tab: StatsTab) => void
}

export const StatsTabs = ({ activeTab, onTabChange }: StatsTabsProps) => (
  <div className="stats-tabs">
    <button
      className={`stats-tab ${activeTab === 'history' ? 'stats-tab--active' : ''}`}
      onClick={() => onTabChange('history')}
      type="button"
    >
      Practice History
    </button>
    <button
      className={`stats-tab ${activeTab === 'aggregate' ? 'stats-tab--active' : ''}`}
      onClick={() => onTabChange('aggregate')}
      type="button"
    >
      Aggregate Stats
    </button>
    <button
      className={`stats-tab ${activeTab === 'tendency' ? 'stats-tab--active' : ''}`}
      onClick={() => onTabChange('tendency')}
      type="button"
    >
      Shot Tendencies
    </button>
  </div>
)
