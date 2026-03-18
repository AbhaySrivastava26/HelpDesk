import { useState } from 'react'
import './SubmitTicket.css'

interface SuccessData {
  ticket_id: string
  category: string
  priority: string
  assigned_team: string
}

export default function SubmitTicket() {
  const [employeeId, setEmployeeId] = useState('EMP-10004')
  const [issue, setIssue] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<SuccessData | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('https://helpdesk-ou5u.onrender.com/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          issue_description: issue
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setSuccess(data)
        setIssue('')
        setTimeout(() => setSuccess(null), 5000)
      }
    } catch (err) {
      console.error(err)
      alert('Error creating ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="submit-container">
      <h1>Submit Support Ticket</h1>
      <div className="submit-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g., EMP-10004"
              required
            />
          </div>

          <div className="form-group">
            <label>Issue Description</label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe your issue..."
              rows={5}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Processing...' : 'Submit Ticket'}
          </button>
        </form>

        {success && (
          <div className="success">
            <h3>✓ Ticket Created!</h3>
            <p><strong>ID:</strong> {success.ticket_id}</p>
            <p><strong>Category:</strong> {success.category}</p>
            <p><strong>Priority:</strong> {success.priority}</p>
            <p><strong>Team:</strong> {success.assigned_team}</p>
          </div>
        )}
      </div>
    </div>
  )
}
