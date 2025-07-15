import React, { useState, useEffect } from 'react'
import { Button, Col, Input, Label, Row, Modal, ModalHeader, ModalBody, ModalFooter, Card, CardBody, CardHeader, Form } from 'reactstrap'
import Swal from 'sweetalert2'
import DataTable from 'react-data-table-component'
import { Edit, Trash2, Eye, Plus } from 'react-feather'
import { useAuth } from '../context/AuthContext'
import moment from "moment"
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

const BazaarAnnouncement = () => {
  const { user, bazaarData, saveBazaarData, weekData } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [editIndex, setEditIndex] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const [form, setForm] = useState({
    title: '',
    greeting: 'Assalamu\'alaikum Warahmatullah Wabarakatuh\n\nBismillah',
    description: '',
    onlineDate: '',
    offlineDate: '',
    maxSuppliers: 25,
    maxProductsPerSupplier: 3,
    registrationDeadline: '',
    deliveryDate: '',
    deliveryTime: '08.00',
    terms: '',
    status: 'active'
  })

  const usedWeekNums = Object.keys(weekData || {})
    .map(w => parseInt(w.replace('W', ''), 10))
    .filter(n => !isNaN(n))

  let start = 1
  while (usedWeekNums.includes(start)) start++

  const weekOptions = []
  let num = start
  while (weekOptions.length < 10) {
    const weekId = `W${num}`
    if (!usedWeekNums.includes(num) || weekId === form.weekId) {
      weekOptions.push({ label: weekId, value: weekId })
    }
    num++
  }

  useEffect(() => {
    if (bazaarData) {
      setAnnouncements(bazaarData.announcements || [])
    }
  }, [bazaarData])

  const handleSave = async () => {
    setLoading(true)

    try {
      const { title, greeting, description, onlineDate, offlineDate, maxSuppliers, maxProductsPerSupplier, registrationDeadline, deliveryDate, deliveryTime, terms, status, weekId } = form

      if (!title || !description || !onlineDate || !offlineDate || !registrationDeadline || !deliveryDate || !weekId) {
        Swal.fire('Error', 'Semua field wajib diisi!', 'error')
        return
      }

      const newAnnouncement = {
        id: editIndex !== null ? announcements[editIndex].id : Date.now().toString(),
        title,
        greeting,
        description,
        onlineDate,
        offlineDate,
        maxSuppliers: parseInt(maxSuppliers),
        maxProductsPerSupplier: parseInt(maxProductsPerSupplier),
        registrationDeadline,
        deliveryDate,
        deliveryTime,
        terms,
        status,
        weekId,
        createdAt: editIndex !== null ? announcements[editIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.name
      }

      const updated = [...announcements]
      if (editIndex !== null) {
        updated[editIndex] = newAnnouncement
      } else {
        updated.push(newAnnouncement)
      }

      await saveBazaarData({ ...bazaarData, announcements: updated })

      Swal.fire('Berhasil', `Pengumuman berhasil ${editIndex !== null ? 'diubah' : 'ditambahkan'}`, 'success')

      setForm({
        title: '',
        greeting: 'Assalamu\'alaikum Warahmatullah Wabarakatuh\n\nBismillah',
        description: '',
        onlineDate: '',
        offlineDate: '',
        maxSuppliers: 25,
        maxProductsPerSupplier: 3,
        registrationDeadline: '',
        deliveryDate: '',
        deliveryTime: '08.00',
        terms: '',
        status: 'active'
      })
      setEditIndex(null)
      setModalOpen(false)
    } catch (error) {
      console.error('Error saving announcement:', error)
      Swal.fire('Error', 'Gagal menyimpan pengumuman', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row, index) => {
    setForm(row)
    setEditIndex(index)
    setModalOpen(true)
  }

  const handleView = (row) => {
    setSelectedAnnouncement(row)
    setViewModalOpen(true)
  }

  const handleAdd = () => {
    setForm({
      title: '',
      greeting: 'Assalamu\'alaikum Warahmatullah Wabarakatuh\n\nBismillah',
      description: '',
      onlineDate: '',
      offlineDate: '',
      maxSuppliers: 25,
      maxProductsPerSupplier: 3,
      registrationDeadline: '',
      deliveryDate: '',
      deliveryTime: '',
      terms: '',
      status: 'active'
    })
    setEditIndex(null)
    setModalOpen(true)
  }

  const handleDelete = async (index) => {
    const result = await Swal.fire({
      title: `Hapus pengumuman "${announcements[index].title}"?`,
      text: 'Pengumuman ini akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setLoading(true)
    try {
      const updated = [...announcements]
      updated.splice(index, 1)
      await saveBazaarData({ ...bazaarData, announcements: updated })
      Swal.fire('Dihapus!', 'Pengumuman berhasil dihapus.', 'success')
    } catch (error) {
      console.error('Error deleting announcement:', error)
      Swal.fire('Error', 'Gagal menghapus pengumuman', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'secondary', text: 'Draft' },
      active: { color: 'success', text: 'Aktif' },
      closed: { color: 'danger', text: 'Ditutup' }
    }
    const badge = badges[status] || badges.active
    return <span className={`badge bg-${badge.color}`}>{badge.text}</span>
  }

  const columns = [
    {
      name: 'No',
      selector: (row, i) => i + 1,
      width: '60px',
      wrap: true
    },
    {
      name: 'Judul',
      selector: row => row.title,
      sortable: true,
      wrap: true
    },
    {
      name: 'Tanggal Online',
      selector: row => formatDateID(row.onlineDate),
      sortable: true,
      width: '150px',
      wrap: true
    },
    {
      name: 'Tanggal Offline',
      selector: row => formatDateID(row.offlineDate),
      sortable: true,
      width: '150px',
      wrap: true
    },
    {
      name: 'Deadline',
      selector: row => formatDateTimeID(row.registrationDeadline),
      sortable: true,
      width: '180px',
      wrap: true
    },
    {
      name: 'Status',
      cell: row => getStatusBadge(row.status),
      width: '80px',
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
          <Button size="sm" color="danger" onClick={() => handleDelete(i)} disabled={loading}>
            <Trash2 size={16} />
          </Button>
        </>
      ),
      width: '200px',
      wrap: true
    }
  ]

  const filteredData = announcements.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  )

  const getParticipantLists = (announcementId) => {
    const registrations = (bazaarData.registrations || []).filter(r => r.announcementId === announcementId && r.status === 'approved')
    const online = []
    const offline = []
    registrations.forEach(reg => {
      const productList = (reg.selectedProducts || []).map(p => p.label).join(', ')
      const line = productList ? `${reg.supplierName}: ${productList}` : reg.supplierName
      if (reg.participateOnline) online.push(line)
      if (reg.participateOffline) offline.push(line)
    })
    return { online, offline }
  }

  const formatAnnouncementText = (announcement) => {
    const { online, offline } = getParticipantLists(announcement.id)
    const onlineList = online.length > 0
      ? online.map((line, i) => `${i + 1}. ${line}`).join('\n')
      : (announcement.onlineParticipants || '-')
    const offlineList = offline.length > 0
      ? offline.map((line, i) => `${i + 1}. ${line}`).join('\n')
      : (announcement.offlineParticipants || '-')
    return `${announcement.greeting}

${announcement.description}

Bazaar Online ${formatDateID(announcement.onlineDate)} dan Bazaar Offline ${formatDateID(announcement.offlineDate)}

Kami batasi hanya untuk ${announcement.maxSuppliers} supplier saja dan maksimal hanya ${announcement.maxProductsPerSupplier} barang/supplier\nMengingat bazaar hanya sampai jam 12.00 WIB 🙏

Pendaftaran ditutup ${formatDateTimeID(announcement.registrationDeadline)}
(Harap membaca pesan yang disematkan terkait syarat dan ketentuan supplier bazaar)

Online:\n${onlineList}

Offline:\n${offlineList}

Untuk Bazaar Offline, batas pengiriman barang hari ${formatDateID(announcement.deliveryDate)} maksimal pukul ${announcement.deliveryTime || '-'} WIB
${announcement.terms ? `\nSyarat dan Ketentuan:\n${announcement.terms}` : ''}`
  }

  return (
    <div className="container-fluid mt-4 px-1 px-sm-3 px-md-5">
      <Row className="mb-3">
        <Col xs="12" md="6">
          <h4>Pengumuman Bazaar</h4>
        </Col>
        <Col xs="12" md="6" className="text-end mt-2 mt-md-0">
          <Button color="primary" className="me-2" onClick={handleAdd} disabled={loading}>
            <Plus size={16} className="me-1" />
            Tambah Pengumuman
          </Button>
          <Button color="warning" onClick={() => window.history.back()} disabled={loading}>
            Kembali
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs="12" md="6">
          <Input
            placeholder="🔍 Cari pengumuman..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            disabled={loading}
          />
        </Col>
      </Row>

      <div className="border overflow-auto" style={{ minHeight: 200 }}>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          noDataComponent="Belum ada pengumuman bazaar"
          responsive
          highlightOnHover
          progressPending={loading}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered size="xl">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {editIndex !== null ? 'Edit Pengumuman Bazaar' : 'Tambah Pengumuman Bazaar'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col xs="12" md="6" className="mb-3">
                <Label>Judul Pengumuman *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  disabled={loading}
                  placeholder={`Contoh: Bazaar FRUK 12 - ${moment().locale('id').format('MMMM YYYY')}`}
                />
              </Col>
              <Col xs="12" md="3" className="mb-3">
                <Label>Week *</Label>
                <Input
                  type="select"
                  value={form.weekId || ''}
                  onChange={e => setForm({ ...form, weekId: e.target.value })}
                  disabled={loading}
                >
                  <option value="">Pilih Week</option>
                  {weekOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Input>
              </Col>
              <Col xs="12" md="3" className="mb-3">
                <Label>Status</Label>
                <Input
                  type="select"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  disabled={loading}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Aktif</option>
                  <option value="closed">Ditutup</option>
                </Input>
              </Col>
            </Row>

            <Row>
              <Col xs="12" className="mb-3">
                <Label>Salam Pembuka</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={form.greeting}
                  onChange={e => setForm({ ...form, greeting: e.target.value })}
                  disabled={loading}
                />
              </Col>
            </Row>

            <Row>
              <Col xs="12" className="mb-3">
                <Label>Deskripsi *</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  disabled={loading}
                  placeholder="Contoh: Bapak dan ibu supplier, insyaAllah kami tim bazaar FRUK 12 akan open supplier kembali untuk bazaar pekan depan."
                />
              </Col>
            </Row>

            <Row>
              <Col xs="12" md="6" className="mb-3">
                <Label>Tanggal Bazaar Online *</Label>
                <Input
                  type="date"
                  value={form.onlineDate}
                  onChange={e => setForm({ ...form, onlineDate: e.target.value })}
                  disabled={loading}
                />
              </Col>
              <Col xs="12" md="6" className="mb-3">
                <Label>Tanggal Bazaar Offline *</Label>
                <Input
                  type="date"
                  value={form.offlineDate}
                  onChange={e => setForm({ ...form, offlineDate: e.target.value })}
                  disabled={loading}
                />
              </Col>
            </Row>

            <Row>
              <Col xs="12" md="4" className="mb-3">
                <Label>Maksimal Supplier</Label>
                <Input
                  type="number"
                  value={form.maxSuppliers}
                  onChange={e => setForm({ ...form, maxSuppliers: e.target.value })}
                  disabled={loading}
                />
              </Col>
              <Col xs="12" md="4" className="mb-3">
                <Label>Maksimal Produk/Supplier</Label>
                <Input
                  type="number"
                  value={form.maxProductsPerSupplier}
                  onChange={e => setForm({ ...form, maxProductsPerSupplier: e.target.value })}
                  disabled={loading}
                />
              </Col>
              <Col xs="12" md="4" className="mb-3">
                <Label>Deadline Pendaftaran *</Label>
                <Input
                  type="datetime-local"
                  value={form.registrationDeadline}
                  onChange={e => setForm({ ...form, registrationDeadline: e.target.value })}
                  disabled={loading}
                />
              </Col>
            </Row>

            <Row>
              <Col xs="12" md="6" className="mb-3">
                <Label>Batas Tanggal Pengiriman (Bazaar Offline) *</Label>
                <Input
                  type="date"
                  value={form.deliveryDate}
                  onChange={e => setForm({ ...form, deliveryDate: e.target.value })}
                  disabled={loading}
                />
              </Col>
              <Col xs="12" md="6" className="mb-3">
                <Label>Batas Waktu Pengiriman (Bazaar Offline)</Label>
                <Input
                  type="time"
                  value={form.deliveryTime}
                  onChange={e => setForm({ ...form, deliveryTime: e.target.value })}
                  disabled={loading}
                />
              </Col>
            </Row>

            <Row>
              <Col xs="12" className="mb-3">
                <Label>Syarat dan Ketentuan</Label>
                <Input
                  type="textarea"
                  rows="4"
                  value={form.terms}
                  onChange={e => setForm({ ...form, terms: e.target.value })}
                  disabled={loading}
                  placeholder="Masukkan syarat dan ketentuan bazaar..."
                />
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Loading...' : (editIndex !== null ? 'Update' : 'Tambah')}
          </Button>
          <Button color="secondary" onClick={() => setModalOpen(false)} disabled={loading}>
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModalOpen} toggle={() => setViewModalOpen(!viewModalOpen)} centered size="xl">
        <ModalHeader toggle={() => setViewModalOpen(!viewModalOpen)}>
          Detail Pengumuman Bazaar
        </ModalHeader>
        <ModalBody>
          {selectedAnnouncement && (
            <div>
              <Card className="mb-3">
                <CardHeader>
                  <h5>{selectedAnnouncement.title}</h5>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Dibuat oleh: {selectedAnnouncement.createdBy}
                    </small>
                    {getStatusBadge(selectedAnnouncement.status)}
                  </div>
                </CardHeader>
                <CardBody>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px' }}>
                    {formatAnnouncementText(selectedAnnouncement)}
                  </pre>
                </CardBody>
              </Card>

              <div className="text-center">
                <Button
                  color="success"
                  onClick={() => {
                    navigator.clipboard.writeText(formatAnnouncementText(selectedAnnouncement))
                    Swal.fire('Berhasil', 'Teks pengumuman berhasil disalin ke clipboard!', 'success')
                  }}
                >
                  Salin ke Clipboard
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  )
}

export default BazaarAnnouncement 