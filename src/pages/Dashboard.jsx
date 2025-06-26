import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, Input, InputGroup, InputGroupText } from 'reactstrap'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, applyAsAdmin, logout, profile, toggleProfileModal, registeredUsers, handleAdminDecision, cancelAdminRequest } = useAuth()
  const [isProfileEmpty, setIsProfileEmpty] = useState(false)
  
  const [adminView, setAdminView] = useState(() => {
    return localStorage.getItem('adminView') === 'false' ? false : true
  })

  const [currentWeek, setCurrentWeek] = useState(() => {
    return Number(localStorage.getItem('currentWeek')) || 1
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDataSupplier = () => {
    navigate(`/data-supplier/${user.name}`)
  }

  const handleMasterDataSupplier = () => {
    navigate(`/data-supplier`)
  }

  const handleWeek = () => {
    navigate(`/week/${currentWeek}`)
  }

  const handleWeeklyCustomerInvoice = () => {
    navigate(`/customer-invoice/${currentWeek}`)
  }

  const handleWeeklySupplierInvoice = () => {
    navigate(`/supplier-invoice/${currentWeek}`)
  }

  const handleCustomerInvoice = () => {
    navigate(`/customer-invoice`)
  }

  const handleSupplierInvoice = () => {
    navigate(`/supplier-invoice`)
  }

  useEffect(() => {
    if (user?.role === 'supplier') {
      const { namaSupplier, namaBank, namaPenerima, noRekening } = user.profile || {}
      const empty = !namaSupplier?.trim() || !namaBank?.trim() || !namaPenerima?.trim() || !noRekening?.trim()
      setIsProfileEmpty(empty)
    }
  }, [profile, user])

  return (
    <div className="container mt-5">
      <h3>Halo, {user.name}</h3>
      <p>Role kamu sekarang: <strong>{user.role}</strong></p>

      {user.role === 'superadmin' && (
        <>
          <h5 className="mt-4">Permintaan Admin Baru</h5>
          {registeredUsers.filter(u => u.requested_admin === 'true' && u.role === 'supplier').length === 0 ? (
            <p className="text-muted">Tidak ada permintaan saat ini.</p>
          ) : (
            registeredUsers
              .filter(u => u.role === 'supplier' && u.requested_admin === 'true')
              .map((u, idx) => (
                <div key={idx} className="mb-2 d-flex align-items-center justify-content-between border p-2 rounded">
                  <div>
                    <strong>{u.name}</strong> mengajukan sebagai admin.
                  </div>
                  <div>
                    <Button color="success" className="me-2" onClick={() => handleAdminDecision(u.name, true)}>
                      Terima
                    </Button>
                    <Button color="danger" onClick={() => handleAdminDecision(u.name, false)}>
                      Tolak
                    </Button>
                  </div>
                </div>
              ))
          )}
        </>
      )}

      {(user.role === 'admin' && adminView) && (
        <>
          <p className="mt-4"><strong>🛠️ Panduan untuk Admin:</strong></p>
          <ul>
            <li className="mb-2">Cek <strong>Data Supplier disini.</strong> &nbsp;
              <Button color="primary" size="sm" onClick={handleMasterDataSupplier}>
                Data Supplier
              </Button>
            </li>
            <li className="mb-2">Atur data dan masuk ke minggu: &nbsp;
              <InputGroup size="sm" style={{ width: 150, display: 'inline-flex' }}>
                <InputGroupText>Minggu</InputGroupText>
                <Input
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  value={currentWeek}
                  onChange={e => {
                    const raw = e.target.value
                    if (/^\d*$/.test(raw)) {
                      setCurrentWeek(raw)
                    }
                  }}
                  onBlur={() => {
                    const parsed = Number(currentWeek)
                    if (!parsed || parsed < 1) {
                      setCurrentWeek(1)
                      localStorage.setItem('currentWeek', 1)
                    } else {
                      localStorage.setItem('currentWeek', parsed)
                    }
                  }}
                />
              </InputGroup>
              <Button color="primary" size="sm" className="ms-2" onClick={handleWeek}>
                Week {currentWeek}
              </Button>
            </li>
            <li className="mb-2">Lihat invoice mingguan di <strong>Customer Invoice</strong>. &nbsp;
              <Button color="primary" size="sm" className="ms-2" onClick={handleWeeklyCustomerInvoice}>
                Customer Invoice Week {currentWeek}
              </Button>
            </li>
            <li className="mb-2">Lihat invoice mingguan di <strong>Supplier Invoice</strong>. &nbsp;
              <Button color="primary" size="sm" className="ms-2" onClick={handleWeeklySupplierInvoice}>
                Supplier Invoice Week {currentWeek}
              </Button>
            </li>
            <li className="mb-2">Lihat semua invoice dari semua minggu di <strong>All Customer Invoice</strong>.
              <Button color="primary" size="sm" className="ms-2" onClick={handleCustomerInvoice}>
                All Customer Invoice
              </Button>
            </li>
            <li className="mb-2">Lihat semua invoice dari semua minggu di <strong>All Supplier Invoice</strong>.
              <Button color="primary" size="sm" className="ms-2" onClick={handleSupplierInvoice}>
                All Supplier Invoice
              </Button>
            </li>
          </ul>
        </>
      )}

      {((user.role === 'admin' && !adminView) || user.role === 'supplier') && (
        <>
          <p className="mt-4"><strong>📦 Panduan untuk Supplier:</strong></p>
          <ul>
            {isProfileEmpty && (
              <li className="mb-2">
                🚨 <strong>Lengkapi profil kamu terlebih dahulu.</strong> &nbsp;
                <Button color="warning" size="sm" onClick={toggleProfileModal}>
                  Isi Profil Sekarang
                </Button>
              </li>
            )}
            {!isProfileEmpty && (
              <li className="mb-2">
                <>✔️ Profil kamu sudah lengkap. Kamu bisa mengedit disini.</> &nbsp;
                <Button color="primary" size="sm" onClick={toggleProfileModal}>
                  Edit Profil
                </Button>
              </li>
            )}
            <li className="mb-2">Isi data produk kamu dari menu <strong>Data Supplier.</strong> &nbsp;
              <Button color="primary" size="sm" onClick={handleDataSupplier}>
                Data Supplier {user.name}
              </Button>
            </li>
            <li className="mb-2">Double-Cek <strong>Data Supplier kamu disini.</strong> &nbsp;
              <Button color="primary" size="sm" onClick={handleMasterDataSupplier}>
                Data Supplier
              </Button>
            </li>
            <li className="mb-2">Cek pesanan mingguan di <strong>Supplier Invoice</strong>. &nbsp;
              <InputGroup size="sm" style={{ width: 150, display: 'inline-flex' }}>
                <InputGroupText>Minggu</InputGroupText>
                <Input
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  value={currentWeek}
                  onChange={e => {
                    const raw = e.target.value
                    if (/^\d*$/.test(raw)) {
                      setCurrentWeek(raw)
                    }
                  }}
                  onBlur={() => {
                    const parsed = Number(currentWeek)
                    if (!parsed || parsed < 1) {
                      setCurrentWeek(1)
                      localStorage.setItem('currentWeek', 1)
                    } else {
                      localStorage.setItem('currentWeek', parsed)
                    }
                  }}
                />
              </InputGroup>
              <Button color="primary" size="sm" className="ms-2" onClick={handleWeeklySupplierInvoice}>
                Supplier Invoice Week {currentWeek}
              </Button>
            </li>
            <li className="mb-2">Cek semua pesanan dari semua minggu di <strong>All Supplier Invoice</strong>.
              <Button color="primary" size="sm" className="ms-2" onClick={handleSupplierInvoice}>
                All Supplier Invoice
              </Button>
            </li>
          </ul>
        </>
      )}

      <div className="mt-4">
        {user.role === 'supplier' && user.requestedAdmin === true && (
          <>
            <Button color="warning" className="me-3" disabled>
              ⏳ Menunggu persetujuan admin...
            </Button>
            <Button color="danger" onClick={cancelAdminRequest} className="me-3">
              Batalkan
            </Button>
          </>
        )}

        {user.role === 'supplier' && user.requestedAdmin === 'rejected' && (
          <>
            <span className="text-danger me-3">❌ Pengajuan admin ditolak.</span>
            <Button color="info" onClick={applyAsAdmin} className="me-3">
              Ajukan Ulang
            </Button>
          </>
        )}

        {user.role === 'supplier' && !user.requestedAdmin && (
          <Button color="primary" onClick={applyAsAdmin} className="me-3">
            Ajukan sebagai Admin
          </Button>
        )}

        {user.role === 'admin' && (
          <>
            <Button
              color="secondary"
              onClick={() => {
                setAdminView(prev => {
                  localStorage.setItem('adminView', String(!prev))
                  return !prev
                })
              }}
              className="me-3"
            >
              Pindah ke Tampilan {adminView ? 'Supplier' : 'Admin'}
            </Button>
          </>
        )}

        <Button color="danger" onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  )
}

export default Dashboard