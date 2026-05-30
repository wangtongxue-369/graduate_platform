import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ConsultPage() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/kaoyan/mentors', { replace: true })
  }, [navigate])
  return null
}