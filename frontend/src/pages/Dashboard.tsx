import { useState, useEffect } from 'react'
import './Dashboard.css'

interface Ticket {
  _id: string
  ticket_id: string
  employee_name: string
  issue_description: string
  category: string
  priority: string
  status: string
  assigned_team: string
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/tickets/all')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:8000/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchTickets()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="dashboard">Loading...</div>

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats">
        <div className="stat">
          <h3>{tickets.length}</h3>
          <p>Total</p>
        </div>
        <div className="stat">
          <h3>{tickets.filter(t => t.status === 'Open').length}</h3>
          <p>Open</p>
        </div>
        <div className="stat">
          <h3>{tickets.filter(t => t.status === 'In Progress').length}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat">
          <h3>{tickets.filter(t => t.status === 'Resolved').length}</h3>
          <p>Resolved</p>
        </div>
      </div>

      <div className="tickets-list">
        {tickets.map(ticket => (
          <div key={ticket._id} className="ticket-item">
            <div className="ticket-header">
              <div>
                <h4>{ticket.ticket_id}</h4>
                <p>{ticket.issue_description.substring(0, 50)}...</p>
              </div>
              <div className={`priority ${ticket.priority.toLowerCase()}`}>
                {ticket.priority}
              </div>
            </div>
            
            <div className="ticket-info">
              <span>Category: {ticket.category}</span>
              <span>Team: {ticket.assigned_team}</span>
              <span>Employee: {ticket.employee_name}</span>
            </div>

            <div className="ticket-status">
              <select 
                value={ticket.status}
                onChange={(e) => updateStatus(ticket.ticket_id, e.target.value)}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}