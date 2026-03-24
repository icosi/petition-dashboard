import { useMemo, useState } from 'react'
import petitionData from '../petition_signatures.json'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

function App() {
  const { petition, signatures, countries } = petitionData

  const petitionFields = Object.entries(petition).filter(([key]) => key !== 'id')

  const signaturesWithCountry = useMemo(
    () =>
      signatures.map((signature) => ({
        ...signature,
        countryName: countries[signature.country] ?? signature.country,
      })),
    [countries, signatures]
  )

  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [expandChart, setExpandChart] = useState(true)
  const [expandKpi, setExpandKpi] = useState(true)
  const [expandData, setExpandData] = useState(true)
  const chartSources = ['email', 'social', 'website', 'partner']

  const countryOptions = useMemo(
    () => [...new Set(signaturesWithCountry.map((item) => item.countryName))].sort(),
    [signaturesWithCountry]
  )

  const sourceOptions = useMemo(
    () => [...new Set(signaturesWithCountry.map((item) => item.source))].sort(),
    [signaturesWithCountry]
  )

  const availableDates = useMemo(
    () => signaturesWithCountry.map((item) => item.date).sort(),
    [signaturesWithCountry]
  )

  const minDate = availableDates[0] ?? ''
  const maxDate = availableDates[availableDates.length - 1] ?? ''

  const filteredSignatures = useMemo(
    () =>
      signaturesWithCountry.filter((signature) => {
        if (selectedCountry !== 'all' && signature.countryName !== selectedCountry) {
          return false
        }

        if (selectedSource !== 'all' && signature.source !== selectedSource) {
          return false
        }

        if (fromDate && signature.date < fromDate) {
          return false
        }

        if (toDate && signature.date > toDate) {
          return false
        }

        return true
      }),
    [fromDate, selectedCountry, selectedSource, signaturesWithCountry, toDate]
  )

  const chartSignatures = useMemo(
    () =>
      signaturesWithCountry.filter((signature) => {
        if (selectedCountry !== 'all' && signature.countryName !== selectedCountry) {
          return false
        }

        if (selectedSource !== 'all' && signature.source !== selectedSource) {
          return false
        }

        if (fromDate && signature.date < fromDate) {
          return false
        }

        if (toDate && signature.date > toDate) {
          return false
        }

        return true
      }),
    [fromDate, selectedCountry, selectedSource, signaturesWithCountry, toDate]
  )

  const signaturesByDateAndSource = chartSignatures.reduce((acc, signature) => {
    if (!acc[signature.date]) {
      acc[signature.date] = { date: signature.date }
      chartSources.forEach((source) => {
        acc[signature.date][source] = 0
      })
    }

    acc[signature.date][signature.source] += signature.count
    return acc
  }, {})

  // Generate array of all dates from min to max (including filtered date range)
  const generateDateRange = (startDate, endDate) => {
    const dates = []
    const currentDate = new Date(startDate)
    const lastDate = new Date(endDate)

    while (currentDate <= lastDate) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  const chartDateRange = useMemo(() => {
    if (chartSignatures.length === 0) {
      return []
    }

    const chartDates = chartSignatures.map((s) => s.date).sort()
    const minChartDate = chartDates[0]
    const maxChartDate = chartDates[chartDates.length - 1]

    return generateDateRange(minChartDate, maxChartDate)
  }, [chartSignatures])

  const dailyBySource = chartDateRange.map((date) => {
    const existing = signaturesByDateAndSource[date]
    if (existing) {
      return existing
    }

    // Create empty entry for dates with no data
    const emptyEntry = { date }
    chartSources.forEach((source) => {
      emptyEntry[source] = 0
    })
    return emptyEntry
  })

  const sourceColors = {
    email: '#2563eb',
    social: '#16a34a',
    website: '#f59e0b',
    partner: '#8b5cf6',
  }

  const totalSignatures = signatures.reduce((sum, signature) => sum + signature.count, 0)
  const filteredTotalSignatures = filteredSignatures.reduce((sum, signature) => sum + signature.count, 0)
  const goal = Number(petition.goal) || 0
  const progress = goal > 0 ? ((totalSignatures / goal) * 100).toFixed(1) : '0.0'

  const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value)

  // KPI Calculations
  const signaturesBySource = useMemo(() => {
    const result = {}
    chartSources.forEach((source) => {
      result[source] = 0
    })
    filteredSignatures.forEach((signature) => {
      result[signature.source] = (result[signature.source] || 0) + signature.count
    })
    return result
  }, [filteredSignatures])

  const signaturesByWeekday = useMemo(() => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const result = {}
    weekdays.forEach((day) => {
      result[day] = 0
    })

    filteredSignatures.forEach((signature) => {
      const date = new Date(signature.date)
      const dayIndex = (date.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
      const dayName = weekdays[dayIndex]
      result[dayName] += signature.count
    })

    return result
  }, [filteredSignatures])

  const signaturesByCountry = useMemo(() => {
    const result = {}
    filteredSignatures.forEach((signature) => {
      result[signature.countryName] = (result[signature.countryName] || 0) + signature.count
    })
    return Object.entries(result)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredSignatures])

  const avgSignaturesPerDay = useMemo(() => {
    if (chartDateRange.length === 0) return 0
    return (filteredTotalSignatures / chartDateRange.length).toFixed(1)
  }, [chartDateRange, filteredTotalSignatures])

  const peakDay = useMemo(() => {
    if (dailyBySource.length === 0) return null
    return dailyBySource.reduce((max, day) => {
      const dayTotal = chartSources.reduce((sum, source) => sum + (day[source] || 0), 0)
      const maxTotal = chartSources.reduce((sum, source) => sum + (max[source] || 0), 0)
      return dayTotal > maxTotal ? day : max
    })
  }, [chartSources, dailyBySource])

  const topCountries = useMemo(() => {
    return signaturesByCountry.slice(0, 5)
  }, [signaturesByCountry])

  const renderChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) {
      return null
    }

    const total = payload.reduce((sum, item) => sum + Number(item.value || 0), 0)

    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((item) => (
          <p key={item.dataKey} style={{ color: item.color }}>
            {item.name}: {formatNumber(item.value)}
          </p>
        ))}
        <p className="chart-tooltip-total">Total: {formatNumber(total)}</p>
      </div>
    )
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Petition dashboard</h1>
      </header>

      <section className="petition-card" aria-label="Petition details">
        <h2>Petition details</h2>
        <dl className="petition-grid">
          {petitionFields.map(([key, value]) => (
            <div key={key} className="petition-row">
              <dt>{key.replace(/_/g, ' ')}</dt>
              <dd>
                {key === 'goal' ? (
                  <>
                    {formatNumber(goal)} (collected {formatNumber(totalSignatures)} / {progress}%)
                  </>
                ) : key === 'url' ? (
                  <a href={value} target="_blank" rel="noreferrer">
                    {value}
                  </a>
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="filters-card" aria-label="Signatures filters">
        <h2>Filters</h2>
        <div className="filters-grid">
          <label>
            Country
            <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
              <option value="all">All</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label>
            Source
            <select value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)}>
              <option value="all">All</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label>
            From date
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label>
            To date
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="chart-card" aria-label="Daily signatures chart">
        <div className="section-header">
          <h2>Daily signatures (filtered total: {formatNumber(filteredTotalSignatures)})</h2>
          <button 
            className="toggle-btn"
            onClick={() => setExpandChart(!expandChart)}
            aria-expanded={expandChart}
          >
            {expandChart ? '▼' : '▶'}
          </button>
        </div>
        {expandChart && (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBySource} margin={{ top: 10, right: 24, left: 8, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={renderChartTooltip} />
                <Legend />
                {chartSources.map((source) => (
                  <Bar
                    key={source}
                    dataKey={source}
                    name={source}
                    stackId="daily"
                    fill={sourceColors[source] ?? '#6b7280'}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="kpi-section" aria-label="Key Performance Indicators">
        <div className="section-header">
          <h2>Analytics & Key Performance Indicators</h2>
          <button 
            className="toggle-btn"
            onClick={() => setExpandKpi(!expandKpi)}
            aria-expanded={expandKpi}
          >
            {expandKpi ? '▼' : '▶'}
          </button>
        </div>
        
        {expandKpi && (
          <div className="kpi-grid">
          <div className="kpi-card">
            <h3>Signatures by Source</h3>
            <table className="kpi-table">
              <tbody>
                {chartSources.map((source) => (
                  <tr key={source}>
                    <td style={{ color: sourceColors[source] }}>■</td>
                    <td>{source}</td>
                    <td className="kpi-value">{formatNumber(signaturesBySource[source])}</td>
                    <td className="kpi-percentage">
                      {filteredTotalSignatures > 0
                        ? ((signaturesBySource[source] / filteredTotalSignatures) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="kpi-card">
            <h3>Signatures by Weekday</h3>
            <table className="kpi-table">
              <tbody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <tr key={day}>
                    <td>{day}</td>
                    <td className="kpi-value">{formatNumber(signaturesByWeekday[day])}</td>
                    <td className="kpi-percentage">
                      {filteredTotalSignatures > 0
                        ? ((signaturesByWeekday[day] / filteredTotalSignatures) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="kpi-card">
            <h3>Top 5 Countries</h3>
            <table className="kpi-table">
              <tbody>
                {topCountries.map((item, index) => (
                  <tr key={item.country}>
                    <td className="kpi-rank">{index + 1}</td>
                    <td>{item.country}</td>
                    <td className="kpi-value">{formatNumber(item.count)}</td>
                    <td className="kpi-percentage">
                      {filteredTotalSignatures > 0
                        ? ((item.count / filteredTotalSignatures) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="kpi-card">
            <h3>Summary Metrics</h3>
            <table className="kpi-table metrics-table">
              <tbody>
                <tr>
                  <td>Total Signatures</td>
                  <td className="kpi-value">{formatNumber(filteredTotalSignatures)}</td>
                </tr>
                <tr>
                  <td>Days Covered</td>
                  <td className="kpi-value">{chartDateRange.length}</td>
                </tr>
                <tr>
                  <td>Avg per Day</td>
                  <td className="kpi-value">{formatNumber(avgSignaturesPerDay)}</td>
                </tr>
                <tr>
                  <td>Peak Day</td>
                  <td className="kpi-value">
                    {peakDay
                      ? `${peakDay.date} (${formatNumber(
                          chartSources.reduce((sum, source) => sum + (peakDay[source] || 0), 0)
                        )})`
                      : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}
      </section>

      <section className="data-section" aria-label="Petition signatures data">
        <div className="section-header">
          <h2>Data</h2>
          <button 
            className="toggle-btn"
            onClick={() => setExpandData(!expandData)}
            aria-expanded={expandData}
          >
            {expandData ? '▼' : '▶'}
          </button>
        </div>
        {expandData && (
          <div className="table-container">
            <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Country</th>
              <th>Source</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {filteredSignatures.map((signature, index) => (
              <tr key={`${signature.date}-${signature.country}-${signature.source}-${index}`}>
                <td>{signature.date}</td>
                <td>{signature.countryName}</td>
                <td>{signature.source}</td>
                <td>{signature.count}</td>
              </tr>
            ))}
          </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
