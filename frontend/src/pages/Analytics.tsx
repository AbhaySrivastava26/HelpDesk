import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Analytics.css'

export default function Analytics() {
  const [category, setCategory] = useState([])
  const [dept, setDept] = useState([])
  const [location, setLocation] = useState([])
  const [priority, setPriority] = useState([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [c, d, l, p] = await Promise.all([
          fetch('http://localhost:8000/api/analytics/by-category').then(r => r.json()),
          fetch('http://localhost:8000/api/analytics/by-department').then(r => r.json()),
          fetch('http://localhost:8000/api/analytics/by-location').then(r => r.json()),
          fetch('http://localhost:8000/api/analytics/by-priority').then(r => r.json()),
        ])
        
        setCategory(c.data || [])
        setDept(d.data || [])
        setLocation(l.data || [])
        setPriority(p.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    
    fetchAnalytics()
  }, [])

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe']

  return (
    <div className="analytics">
      <h1>Analytics</h1>
      
      <div className="charts-grid">
        <div className="chart-card">
          <h3>By Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={category} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                {category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>By Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={priority} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                {priority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>By Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dept}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>By Location</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={location}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#764ba2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}