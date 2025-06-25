import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userList, setUserList] = useState([])
  const [registeredUsers, setRegisteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(JSON.parse(localStorage.getItem('supplierProfile')) || {})
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [productData, setProductData] = useState({})
  const [weekData, setWeekData] = useState({})

  const toggleProfileModal = () => setProfileModalOpen(prev => !prev)

  useEffect(() => {
    const storedUsers = localStorage.getItem('registeredUsers')
    if (storedUsers) setRegisteredUsers(JSON.parse(storedUsers))

    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) setUser(JSON.parse(storedUser))

    const storedWeek = localStorage.getItem('weekData')
    if (storedWeek) setWeekData(JSON.parse(storedWeek))

    const data = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    setUserList(data)

    setLoading(false)
  }, [])

  const saveUsers = (users) => {
    setRegisteredUsers(users)
    localStorage.setItem('registeredUsers', JSON.stringify(users))
  }

  const register = (name, role) => {
    const exists = registeredUsers.some((u) => u.name === name)
    if (exists) throw new Error('Nama sudah terdaftar')

    const updated = [...registeredUsers, { name, role, requestedAdmin: false }]
    saveUsers(updated)
  }

  const login = (name) => {
    const found = registeredUsers.find((u) => u.name === name)
    if (!found) throw new Error('Pengguna tidak ditemukan')

    const updatedUser = { ...found, profile: found.profile || {}, requestedAdmin: found.requestedAdmin || false }
    setUser(updatedUser)
    localStorage.setItem('currentUser', JSON.stringify(updatedUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const applyAsAdmin = () => {
    if (!user || user.role !== 'supplier') return

    const updatedUsers = registeredUsers.map(u =>
      u.name === user.name ? { ...u, requestedAdmin: true } : u
    )

    saveUsers(updatedUsers)

    const updatedUser = { ...user, requestedAdmin: true }
    setUser(updatedUser)
    localStorage.setItem('currentUser', JSON.stringify(updatedUser))
  }

  const saveProfile = (newProfile) => {
    setProfile(newProfile)
  }

  useEffect(() => {
    const storedData = localStorage.getItem('supplierProductData')
    if (storedData) setProductData(JSON.parse(storedData))
  }, [])

  const saveProductData = (name, data) => {
    const updated = { ...productData, [name]: data }
    setProductData(updated)
    localStorage.setItem('supplierProductData', JSON.stringify(updated))
  }

  const saveWeekData = (sheetName, newSheetData) => {
    const existing = JSON.parse(localStorage.getItem('weekData')) || {}
    const updated = { ...existing, [sheetName]: newSheetData }
    setWeekData(updated)
    localStorage.setItem('weekData', JSON.stringify(updated))
  }

  const handleAdminDecision = (name, accepted) => {
    const updatedUsers = registeredUsers.map(u => {
      if (u.name === name) {
        if (accepted) {
          return { ...u, role: 'admin', requestedAdmin: false }
        } else {
          return { ...u, requestedAdmin: 'rejected' }
        }
      }
      return u
    })

    saveUsers(updatedUsers)

    if (user?.name === name) {
      const updatedCurrent = updatedUsers.find(u => u.name === name)
      setUser(updatedCurrent)
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrent))
    }
  }

  const cancelAdminRequest = () => {
    const updatedUsers = registeredUsers.map(u =>
      u.name === user.name ? { ...u, requestedAdmin: false } : u
    )
    saveUsers(updatedUsers)
    const updatedCurrent = { ...user, requestedAdmin: false }
    setUser(updatedCurrent)
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrent))
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      applyAsAdmin,
      register,
      loading,
      registeredUsers,
      profile,
      saveProfile,
      profileModalOpen,
      toggleProfileModal,
      productData,
      saveProductData,
      weekData,
      saveWeekData,
      userList,
      handleAdminDecision,
      cancelAdminRequest
    }}>
      {children}
    </AuthContext.Provider>
  )
}