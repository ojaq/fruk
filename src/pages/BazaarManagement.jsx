import React, { useState, useEffect } from 'react'
import { Button, Col, Input, Label, Row, Modal, ModalHeader, ModalBody, ModalFooter, Card, CardBody, CardHeader, Form, FormGroup, Alert, Badge } from 'reactstrap'
import Swal from 'sweetalert2'
import DataTable from 'react-data-table-component'
import { Edit, Trash2, Eye, Check, X } from 'react-feather'
import { useAuth } from '../context/AuthContext'
import Select from 'react-select'
import moment from 'moment'
import 'moment/locale/id'
moment.locale('id')

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
function formatDateID(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return `${d.getDate().toString().padStart(2, '0')} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}
function formatDateTimeID(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const jam = d.getHours().toString().padStart(2, '0')
  const menit = d.getMinutes().toString().padStart(2, '0')
  return `${d.getDate().toString().padStart(2, '0')} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()} ${jam}:${menit}`
}

const BazaarManagement = () => {
  const { user, bazaarData, saveBazaarData, registeredUsers } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [editIndex, setEditIndex] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterAnnouncement, setFilterAnnouncement] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)

  const [form, setForm] = useState({
    status: '',
    adminNotes: ''
  })

  useEffect(() => {
    if (bazaarData) {
      setRegistrations(bazaarData.registrations || [])
      setAnnouncements(bazaarData.announcements || [])
    }
  }, [bazaarData])

  const handleSave = async () => {
    setLoading(true)

    try {
      const { status, adminNotes } = form

      if (!status) {
        Swal.fire('Error', 'Status wajib dipilih!', 'error')
        setLoading(false)
        return
      }

      if (status === 'rejected' && (!adminNotes || !adminNotes.trim())) {
        Swal.fire('Error', 'Alasan penolakan wajib diisi jika status Ditolak!', 'error')
        setLoading(false)
        return
      }

      const updated = [...registrations]
      updated[editIndex] = {
        ...updated[editIndex],
        status,
        adminNotes,
        updatedAt: new Date().toISOString(),
        reviewedBy: user.name
      }

      await saveBazaarData({ ...bazaarData, registrations: updated })

      Swal.fire('Berhasil', 'Status pendaftaran berhasil diubah', 'success')

      setForm({
        status: '',
        adminNotes: ''
      })
      setEditIndex(null)
      setModalOpen(false)
    } catch (error) {
      console.error('Error updating registration:', error)
      Swal.fire('Error', 'Gagal mengubah status pendaftaran', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row, index) => {
    setForm({
      status: row.status,
      adminNotes: row.adminNotes || ''
    })
    setEditIndex(index)
    setModalOpen(true)
  }

  const handleView = (row) => {
    setSelectedRegistration(row)
    setViewModalOpen(true)
  }

  const handleQuickApprove = async (index) => {
    const result = await Swal.fire({
      title: 'Setujui pendaftaran?',
      text: 'Pendaftaran ini akan disetujui.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Setujui',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setLoading(true)
    try {
      const updated = [...registrations]
      updated[index] = {
        ...updated[index],
        status: 'approved',
        updatedAt: new Date().toISOString(),
        reviewedBy: user.name
      }

      await saveBazaarData({ ...bazaarData, registrations: updated })
      Swal.fire('Berhasil', 'Pendaftaran berhasil disetujui', 'success')
    } catch (error) {
      console.error('Error approving registration:', error)
      Swal.fire('Error', 'Gagal menyetujui pendaftaran', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickReject = async (index) => {
    const { value: reason } = await Swal.fire({
      title: 'Tolak pendaftaran?',
      text: 'Masukkan alasan penolakan untuk supplier.',
      input: 'textarea',
      inputPlaceholder: 'Alasan penolakan...',
      inputAttributes: { maxlength: 200 },
      showCancelButton: true,
      confirmButtonText: 'Tolak',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Alasan penolakan wajib diisi!';
        }
      }
    })

    if (!reason) return

    setLoading(true)
    try {
      const updated = [...registrations]
      updated[index] = {
        ...updated[index],
        status: 'rejected',
        adminNotes: reason,
        updatedAt: new Date().toISOString(),
        reviewedBy: user.name
      }

      await saveBazaarData({ ...bazaarData, registrations: updated })
      Swal.fire('Berhasil', 'Pendaftaran berhasil ditolak', 'success')
    } catch (error) {
      console.error('Error rejecting registration:', error)
      Swal.fire('Error', 'Gagal menolak pendaftaran', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (index) => {
    const result = await Swal.fire({
      title: `Hapus pendaftaran?`,
      text: 'Pendaftaran ini akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setLoading(true)
    try {
      const updated = [...registrations]
      updated.splice(index, 1)
      await saveBazaarData({ ...bazaarData, registrations: updated })
      Swal.fire('Dihapus!', 'Pendaftaran berhasil dihapus.', 'success')
    } catch (error) {
      console.error('Error deleting registration:', error)
      Swal.fire('Error', 'Gagal menghapus pendaftaran', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'warning', text: 'Menunggu' },
      approved: { color: 'success', text: 'Disetujui' },
      rejected: { color: 'danger', text: 'Ditolak' }
    }
    const badge = badges[status] || badges.pending
    return <span className={`badge bg-${badge.color}`}>{badge.text}</span>
  }

  const getParticipationBadge = (registration) => {
    const badges = []
    if (registration.participateOnline) badges.push(<span key="online" className="badge bg-primary me-1">Online</span>)
    if (registration.participateOffline) badges.push(<span key="offline" className="badge bg-info me-1">Offline</span>)
    return badges
  }

  const columns = [
    {
      name: 'No',
      selector: (row, i) => i + 1,
      width: '60px',
      wrap: true
    },
    {
      name: 'Supplier',
      selector: row => row.supplierName,
      sortable: true,
      wrap: true
    },
    {
      name: 'Bazaar',
      selector: row => {
        const announcement = announcements.find(a => a.id === row.announcementId)
        return announcement ? announcement.title : 'N/A'
      },
      sortable: true,
      wrap: true
    },
    {
      name: 'Partisipasi',
      cell: row => getParticipationBadge(row),
      width: '150px',
      wrap: true
    },
    {
      name: 'Jumlah Produk',
      selector: row => row.selectedProducts.length,
      sortable: true,
      width: '150px',
      wrap: true
    },
    {
      name: 'Status',
      cell: row => getStatusBadge(row.status),
      width: '80px',
      wrap: true
    },
    {
      name: 'Tanggal Daftar',
      selector: row => formatDateID(row.createdAt),
      sortable: true,
      width: '150px',
      wrap: true
    },
    {
      name: 'Aksi',
      cell: (row, i) => (
        <>
          <Button size="sm" color="info" className="me-2" onClick={() => handleView(row)} disabled={loading}>
            <Eye size={16} />
          </Button>
          <Button size="sm" color="warning" className="me-2" onClick={() => handleEdit(row, i)} disabled={loading}>
            <Edit size={16} />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button size="sm" color="success" className="me-2" onClick={() => handleQuickApprove(i)} disabled={loading}>
                <Check size={16} />
              </Button>
              <Button size="sm" color="danger" className="me-2" onClick={() => handleQuickReject(i)} disabled={loading}>
                <X size={16} />
              </Button>
            </>
          )}
          <Button size="sm" color="danger" onClick={() => handleDelete(i)} disabled={loading}>
            <Trash2 size={16} />
          </Button>
        </>
      ),
      width: '200px',
      wrap: true
    }
  ]

  const announcementOptions = announcements.map(a => ({
    label: a.title,
    value: a.id
  }))

  const statusOptions = [
    { label: 'Menunggu', value: 'pending' },
    { label: 'Disetujui', value: 'approved' },
    { label: 'Ditolak', value: 'rejected' }
  ]

  const filteredData = registrations.filter(item => {
    const announcement = announcements.find(a => a.id === item.announcementId)
    const announcementTitle = announcement ? announcement.title : ''

    const matchSearch = announcementTitle.toLowerCase().includes(searchText.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchText.toLowerCase())

    const matchAnnouncement = filterAnnouncement ? item.announcementId === filterAnnouncement.value : true
    const matchStatus = filterStatus ? item.status === filterStatus.value : true

    return matchSearch && matchAnnouncement && matchStatus
  })

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length
  }

  return (
    <div className="container-fluid mt-4 px-1 px-sm-3 px-md-5">
      <Row className="mb-3">
        <Col xs="12" md="6">
          <h4>Manajemen Pendaftaran Bazaar</h4>
        </Col>
        <Col xs="12" md="6" className="text-end mt-2 mt-md-0">
          <Button color="warning" onClick={() => window.history.back()} disabled={loading}>
            Kembali
          </Button>
        </Col>
      </Row>

      {/* Cards */}
      <Row className="mb-4">
        <Col xs="6" md="3" className="mb-3">
          <Card className="text-center">
            <CardBody>
              <h3 className="text-primary">{stats.total}</h3>
              <small>Total Pendaftaran</small>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6" md="3" className="mb-3">
          <Card className="text-center">
            <CardBody>
              <h3 className="text-warning">{stats.pending}</h3>
              <small>Menunggu</small>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6" md="3" className="mb-3">
          <Card className="text-center">
            <CardBody>
              <h3 className="text-success">{stats.approved}</h3>
              <small>Disetujui</small>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6" md="3" className="mb-3">
          <Card className="text-center">
            <CardBody>
              <h3 className="text-danger">{stats.rejected}</h3>
              <small>Ditolak</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs="12" md="3" className="mb-2 mb-md-0">
          <Input
            placeholder="🔍 Cari pendaftaran..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            disabled={loading}
          />
        </Col>
        <Col xs="12" md="3" className="mb-2 mb-md-0">
          <Select
            options={announcementOptions}
            placeholder="🔽 Filter Bazaar"
            isClearable
            isSearchable
            value={filterAnnouncement}
            onChange={setFilterAnnouncement}
            isDisabled={loading}
          />
        </Col>
        <Col xs="12" md="3" className="mb-2 mb-md-0">
          <Select
            options={statusOptions}
            placeholder="🔽 Filter Status"
            isClearable
            isSearchable
            value={filterStatus}
            onChange={setFilterStatus}
            isDisabled={loading}
          />
        </Col>
        <Col xs="12" md="3" className="text-end">
          <Button color="danger" onClick={() => {
            setSearchText('')
            setFilterAnnouncement(null)
            setFilterStatus(null)
          }} disabled={loading}>
            Reset Filter
          </Button>
        </Col>
      </Row>

      <div className="border overflow-auto" style={{ minHeight: 200 }}>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          noDataComponent="Belum ada pendaftaran bazaar"
          responsive
          highlightOnHover
          progressPending={loading}
        />
      </div>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Edit Status Pendaftaran
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col xs="12" className="mb-3">
                <Label>Status *</Label>
                <Input
                  type="select"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  disabled={loading}
                >
                  <option value="">Pilih status</option>
                  <option value="pending">Menunggu</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </Input>
              </Col>
            </Row>

            <Row>
              <Col xs="12" className="mb-3">
                <Label>Catatan Admin</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={form.adminNotes}
                  onChange={e => setForm({ ...form, adminNotes: e.target.value })}
                  disabled={loading}
                  placeholder="Tambahkan catatan untuk supplier..."
                />
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Loading...' : 'Update'}
          </Button>
          <Button color="secondary" onClick={() => setModalOpen(false)} disabled={loading}>
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModalOpen} toggle={() => setViewModalOpen(!viewModalOpen)} centered size="lg">
        <ModalHeader toggle={() => setViewModalOpen(!viewModalOpen)}>
          Detail Pendaftaran Bazaar
        </ModalHeader>
        <ModalBody>
          {selectedRegistration && (
            <div>
              <Card className="mb-3">
                <CardHeader>
                  <h6>Informasi Pendaftaran</h6>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col xs="12" md="6">
                      <strong>Supplier:</strong><br />
                      {selectedRegistration.supplierName}
                    </Col>
                    <Col xs="12" md="6">
                      <strong>Status:</strong><br />
                      {getStatusBadge(selectedRegistration.status)}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col xs="12" md="6">
                      <strong>Bazaar:</strong><br />
                      {announcements.find(a => a.id === selectedRegistration.announcementId)?.title || 'N/A'}
                    </Col>
                    <Col xs="12" md="6">
                      <strong>Partisipasi:</strong><br />
                      {getParticipationBadge(selectedRegistration)}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col xs="12">
                      <strong>Produk yang Didaftarkan:</strong><br />
                      <ul className="mt-1">
                        {selectedRegistration.selectedProducts.map((product, index) => (
                          <li key={index}>{product.label}</li>
                        ))}
                      </ul>
                    </Col>
                  </Row>
                  {selectedRegistration.notes && (
                    <Row className="mt-2">
                      <Col xs="12">
                        <strong>Catatan Supplier:</strong><br />
                        {selectedRegistration.notes}
                      </Col>
                    </Row>
                  )}
                  {selectedRegistration.adminNotes && (
                    <Row className="mt-2">
                      <Col xs="12">
                        <strong>Catatan Admin:</strong><br />
                        {selectedRegistration.adminNotes}
                      </Col>
                    </Row>
                  )}
                  <Row className="mt-2">
                    <Col xs="12" md="6">
                      <small className="text-muted">
                        Didaftarkan pada: {formatDateTimeID(selectedRegistration.createdAt)}
                      </small>
                    </Col>
                    {selectedRegistration.reviewedBy && (
                      <Col xs="12" md="6">
                        <small className="text-muted">
                          Direview oleh: {selectedRegistration.reviewedBy}
                        </small>
                      </Col>
                    )}
                  </Row>
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  )
}

export default BazaarManagement 