import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const normalizeRoles = roles => {
  if (!roles) {
    return []
  }
  return Array.isArray(roles) ? roles : [roles]
}

const ProtectedRoute = ({ children, roles, redirectTo = '/', loginPath = '/' }) => {
  const location = useLocation()
  const { currentUser, currentRole, openAuth } = useAuth()
  const allowedRoles = normalizeRoles(roles)

  useEffect(() => {
    if (!currentUser) {
      openAuth('login')
    }
  }, [currentUser, openAuth])

  if (!currentUser) {
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  return children || <Outlet />
}

export default ProtectedRoute
