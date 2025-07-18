import React, { useState, useEffect } from 'react'
import { Button, Col, Input, Label, Row, Modal, ModalHeader, ModalBody, ModalFooter, Card, CardBody, CardHeader, Form, FormGroup, Alert } from 'reactstrap'
import Swal from 'sweetalert2'
import DataTable from 'react-data-table-component'
import { Edit, Trash2, Eye } from 'react-feather'
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
function formatDateRangeID(startStr, endStr) {
  if (!startStr && !endStr) return ''
  if (!startStr) return formatDateID(endStr)
  if (!endStr) return formatDateID(startStr)
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (isNaN(start) || isNaN(end)) return `${startStr} - ${endStr}`
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${MONTHS_ID[start.getMonth()]} ${start.getFullYear()}`
    } else {
      return `${start.getDate()} ${MONTHS_ID[start.getMonth()]} - ${end.getDate()} ${MONTHS_ID[end.getMonth()]} ${start.getFullYear()}`
    }
  } else {
    return `${start.getDate()} ${MONTHS_ID[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${MONTHS_ID[end.getMonth()]} ${end.getFullYear()}`
  }
}
function formatDateTimeID(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const jam = d.getHours().toString().padStart(2, '0')
  const menit = d.getMinutes().toString().padStart(2, '0')
  return `${d.getDate().toString().padStart(2, '0')} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()} ${jam}:${menit}`
}

const BazaarRegistration = () => {
  const { user, bazaarData, saveBazaarData, productData } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [userProducts, setUserProducts] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [editIndex, setEditIndex] = useState(null)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [separateProducts, setSeparateProducts] = useState(false)

  const [form, setForm] = useState({
    announcementId: '',
    supplierName: user?.name || '',
    participateOnline: false,
    participateOffline: false,
    selectedProducts: [],
    selectedProductsOnline: [],
    selectedProductsOffline: [],
    notes: '',
    status: 'pending'
  })

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  useEffect(() => {
    if (bazaarData) {
      setRegistrations(bazaarData.registrations || [])
      setAnnouncements(bazaarData.announcements || [])
    }
  }, [bazaarData])

  useEffect(() => {
    if (productData[user?.name]) {
      const products = productData[user.name].filter(p => p.aktif).map(p => ({
        label: `${p.namaProduk} ${p.ukuran} ${p.satuan}`,
        value: p.namaProduk,
        data: p
      }))
      setUserProducts(products)
    }
  }, [productData, user])

  const activeAnnouncements = announcements.filter(a => a.status === 'active')
  const userRegistrations = registrations.filter(r => r.supplierName === user?.name)

  const lastRegistration = userRegistrations.length > 0
    ? userRegistrations.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b)
    : null;

  const nonRejectedRegs = registrations.filter(
    r => r.announcementId === form.announcementId && r.status !== 'rejected'
  )
  const productSupplierMap = {}
  nonRejectedRegs.forEach(reg => {
    (reg.selectedProducts || []).forEach(prod => {
      if (!productSupplierMap[prod.label]) productSupplierMap[prod.label] = new Set()
      productSupplierMap[prod.label].add(reg.supplierName)
    })
  })

  function getBaseProduct(label) {
    label = label.replace(/\s+/g, ' ').trim()
    label = label.replace(/\s*\d*\s*Pcs$/i, '').trim()

    const parenIdx = label.lastIndexOf(')')
    if (parenIdx !== -1) {
      return label.slice(0, parenIdx + 1).trim()
    }
    const dashIdx = label.lastIndexOf('-')
    if (dashIdx !== -1) {
      return label.slice(0, dashIdx).trim()
    }
    const sizeIdx = label.toLowerCase().indexOf(' size')
    if (sizeIdx !== -1) {
      return label.slice(0, sizeIdx).trim()
    }
    const words = label.split(' ')
    if (words.length > 2 && /^[A-Za-z0-9]+$/.test(words[words.length - 1])) {
      return words.slice(0, -1).join(' ').trim()
    }
    const lastSpace = label.lastIndexOf(' ')
    if (lastSpace !== -1) {
      return label.slice(0, lastSpace).trim()
    }
    return label
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const { announcementId, supplierName, participateOnline, participateOffline, selectedProducts, selectedProductsOnline, selectedProductsOffline, notes } = form
      if (!announcementId || !supplierName || (!participateOnline && !participateOffline)) {
        Swal.fire('Error', 'Semua field wajib diisi!', 'error')
        setLoading(false)
        return
      }

      const announcement = announcements.find(a => a.id === announcementId)
      if (!announcement) {
        Swal.fire('Error', 'Pengumuman tidak ditemukan!', 'error')
        setLoading(false)
        return
      }

      const maxProducts = announcement.maxProductsPerSupplier || 3
      let baseProductSetOnline = new Set()
      let baseProductSetOffline = new Set()
      if (separateProducts) {
        if (participateOnline && selectedProductsOnline.length === 0) {
          Swal.fire('Error', 'Pilih produk untuk bazaar online!', 'error')
          setLoading(false)
          return
        }
        if (participateOffline && selectedProductsOffline.length === 0) {
          Swal.fire('Error', 'Pilih produk untuk bazaar offline!', 'error')
          setLoading(false)
          return
        }
        if (participateOnline) {
          baseProductSetOnline = new Set(selectedProductsOnline.map(p => getBaseProduct(p.label)))
          if (baseProductSetOnline.size > maxProducts) {
            Swal.fire('Error', `Maksimal ${maxProducts} produk utama untuk bazaar online!`, 'error')
            setLoading(false)
            return
          }
        }
        if (participateOffline) {
          baseProductSetOffline = new Set(selectedProductsOffline.map(p => getBaseProduct(p.label)))
          if (baseProductSetOffline.size > maxProducts) {
            Swal.fire('Error', `Maksimal ${maxProducts} produk utama untuk bazaar offline!`, 'error')
            setLoading(false)
            return
          }
        }
      } else {
        if (selectedProducts.length === 0) {
          Swal.fire('Error', 'Pilih produk yang akan dijual!', 'error')
          setLoading(false)
          return
        }
        const baseProductSet = new Set(selectedProducts.map(p => getBaseProduct(p.label)))
        if (baseProductSet.size > maxProducts) {
          Swal.fire('Error', `Maksimal ${maxProducts} produk utama per supplier!`, 'error')
          setLoading(false)
          return
        }
      }

      const deadline = new Date(announcement.registrationDeadline)
      if (new Date() > deadline) {
        Swal.fire('Error', 'Pendaftaran sudah ditutup!', 'error')
        setLoading(false)
        return
      }

      const existingRegistration = registrations.find(r =>
        r.announcementId === announcementId && r.supplierName === supplierName && r.status !== 'rejected'
      )

      if (existingRegistration && !editId) {
        Swal.fire('Error', 'Anda sudah terdaftar untuk bazaar ini!', 'error')
        setLoading(false)
        return
      }

      const newRegistration = {
        id: editId ? editId : Date.now().toString(),
        announcementId,
        supplierName,
        participateOnline,
        participateOffline,
        notes,
        status: editId ? (registrations.find(r => r.id === editId)?.status || 'pending') : 'pending',
        createdAt: editId ? (registrations.find(r => r.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        selectedProducts: separateProducts ? [] : selectedProducts,
        selectedProductsOnline: separateProducts ? selectedProductsOnline : [],
        selectedProductsOffline: separateProducts ? selectedProductsOffline : []
      }

      let updated = [...registrations]
      if (editId) {
        const idx = updated.findIndex(r => r.id === editId)
        if (idx !== -1) {
          updated[idx] = newRegistration
        } else {
          updated.push(newRegistration)
        }
      } else {
        updated.push(newRegistration)
      }

      await saveBazaarData({ ...bazaarData, registrations: updated })

      Swal.fire('Berhasil', `Pendaftaran berhasil ${editId ? 'diubah' : 'ditambahkan'}`, 'success')

      setForm({
        announcementId: '',
        supplierName: user?.name || '',
        participateOnline: false,
        participateOffline: false,
        selectedProducts: [],
        selectedProductsOnline: [],
        selectedProductsOffline: [],
        notes: '',
        status: 'pending'
      })
      setEditIndex(null)
      setEditId(null)
      setModalOpen(false)
      setSeparateProducts(false)
    } catch (error) {
      console.error('Error saving registration:', error)
      Swal.fire('Error', 'Gagal menyimpan pendaftaran', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row, index) => {
    const announcement = announcements.find(a => a.id === row.announcementId)
    setForm({
      announcementId: row.announcementId,
      supplierName: row.supplierName,
      participateOnline: row.participateOnline,
      participateOffline: row.participateOffline,
      selectedProducts: row.selectedProducts || [],
      selectedProductsOnline: row.selectedProductsOnline || [],
      selectedProductsOffline: row.selectedProductsOffline || [],
      notes: row.notes,
      status: row.status
    })
    setSelectedAnnouncement(announcement)
    setEditIndex(index)
    setEditId(row.id)
    setModalOpen(true)
    setSeparateProducts(!!(row.selectedProductsOnline || row.selectedProductsOffline))
  }

  const handleView = (row) => {
    setSelectedRegistration(row)
    setViewModalOpen(true)
  }

  const handleAdd = () => {
    setForm({
      announcementId: '',
      supplierName: user?.name || '',
      participateOnline: false,
      participateOffline: false,
      selectedProducts: [],
      selectedProductsOnline: [],
      selectedProductsOffline: [],
      notes: '',
      status: 'pending'
    })
    setSelectedAnnouncement(null)
    setEditIndex(null)
    setEditId(null)
    setModalOpen(true)
    setSeparateProducts(false)
  }

  const handleDelete = async (index) => {
    const row = filteredData[index]
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
      const actualIndex = registrations.findIndex(r => r.id === row.id)
      if (actualIndex === -1) {
        Swal.fire('Error', 'Data tidak ditemukan', 'error')
        return
      }
      const updated = [...registrations]
      updated.splice(actualIndex, 1)
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

  const columns = [
    {
      name: 'No',
      selector: (row, i) => i + 1,
      width: '60px',
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
      cell: row => (
        <div>
          {row.participateOnline && <span className="badge bg-primary me-1">Online</span>}
          {row.participateOffline && <span className="badge bg-info me-1">Offline</span>}
        </div>
      ),
      width: '150px',
      wrap: true
    },
    {
      name: 'Jumlah Produk',
      selector: row => {
        if (row.selectedProductsOnline?.length || row.selectedProductsOffline?.length) {
          let count = 0
          if (row.selectedProductsOnline) count += row.selectedProductsOnline.length
          if (row.selectedProductsOffline) count += row.selectedProductsOffline.length
          return count
        }
        return row.selectedProducts?.length || 0
      },
      sortable: true,
      width: '140px',
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
          {row.status === 'pending' && (
            <>
              <Button size="sm" color="warning" className="me-2" onClick={() => handleEdit(row, i)} disabled={loading}>
                <Edit size={16} />
              </Button>
              <Button size="sm" color="danger" onClick={() => handleDelete(i)} disabled={loading}>
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </>
      ),
      width: '200px',
      wrap: true
    }
  ]

  const filteredData = userRegistrations.filter(item => {
    const announcement = announcements.find(a => a.id === item.announcementId)
    const announcementTitle = announcement ? announcement.title : ''

    return announcementTitle.toLowerCase().includes(searchText.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchText.toLowerCase())
  })

  const announcementOptions = activeAnnouncements.map(a => ({
    label: `${a.title} (${formatDateRangeID(a.onlineDateStart, a.onlineDateEnd)} - ${formatDateID(a.offlineDate)})`,
    value: a.id,
    data: a
  }))

  const currentAnnouncement = selectedAnnouncement || announcements.find(a => a.id === form.announcementId)
  const maxProducts = currentAnnouncement?.maxProductsPerSupplier || 3
  const baseProducts = form.selectedProducts.map(p => getBaseProduct(p.label))
  const uniqueBaseProducts = Array.from(new Set(baseProducts))
  const isAtMaxProducts = uniqueBaseProducts.length >= maxProducts

  return (
    <div className="container-fluid mt-4 px-1 px-sm-3 px-md-5">
      <Row className="mb-3">
        <Col xs="12" md="6">
          <h4>Pendaftaran Bazaar</h4>
        </Col>
        <Col xs="12" md="6" className="text-end mt-2 mt-md-0">
          <Button color="primary" className="me-2" onClick={handleAdd} disabled={loading}>
            Daftar Bazaar Baru
          </Button>
          <Button color="warning" onClick={() => window.history.back()} disabled={loading}>
            Kembali
          </Button>
        </Col>
      </Row>

      {activeAnnouncements.length === 0 && (
        <Alert color="info" className="mb-3">
          Tidak ada pengumuman bazaar yang aktif saat ini.
        </Alert>
      )}

      <Row className="mb-3">
        <Col xs="12" md="6">
          <Input
            placeholder="🔍 Cari pendaftaran..."
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
          noDataComponent="Belum ada pendaftaran bazaar"
          responsive
          highlightOnHover
          progressPending={loading}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered size="lg">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {editId ? 'Edit Pendaftaran Bazaar' : 'Daftar Bazaar Baru'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col xs="12" className="mb-3">
                <Label>Pilih Bazaar *</Label>
                <Select
                  options={announcementOptions}
                  value={announcementOptions.find(opt => opt.value === form.announcementId)}
                  onChange={opt => {
                    setForm({ ...form, announcementId: opt.value, selectedProducts: [], selectedProductsOnline: [], selectedProductsOffline: [] })
                    setSelectedAnnouncement(opt.data)
                  }}
                  placeholder="Pilih bazaar..."
                  isDisabled={loading}
                />
              </Col>
            </Row>

            <Row>
              <Col xs="12" className="mb-3">
                <Label>Nama Supplier</Label>
                <Input
                  value={form.supplierName}
                  onChange={e => setForm({ ...form, supplierName: e.target.value })}
                  disabled
                />
              </Col>
            </Row>

            <Row>
              <Col xs="12" md="6" className="mb-3">
                <FormGroup check>
                  <Input
                    type="checkbox"
                    checked={form.participateOnline}
                    onChange={e => setForm({ ...form, participateOnline: e.target.checked })}
                    disabled={loading}
                  />
                  <Label check>
                    Ikut Bazaar Online
                  </Label>
                </FormGroup>
              </Col>
              <Col xs="12" md="6" className="mb-3">
                <FormGroup check>
                  <Input
                    type="checkbox"
                    checked={form.participateOffline}
                    onChange={e => setForm({ ...form, participateOffline: e.target.checked })}
                    disabled={loading}
                  />
                  <Label check>
                    Ikut Bazaar Offline
                  </Label>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col xs="12" className="mb-3">
                <FormGroup check>
                  <Input
                    type="checkbox"
                    checked={separateProducts}
                    onChange={e => setSeparateProducts(e.target.checked)}
                    disabled={loading}
                  />
                  <Label check>
                    Produk untuk Bazaar Online dan Offline Berbeda
                  </Label>
                </FormGroup>
              </Col>
            </Row>
            {separateProducts ? (
              <>
                <Row>
                  <Col xs="12" className="mb-3">
                    <Label>Pilih Produk Bazaar Online *</Label>
                    <Select
                      isMulti
                      options={userProducts}
                      value={form.selectedProductsOnline}
                      onChange={selected => {
                        const baseSet = new Set(selected.map(p => getBaseProduct(p.label)))
                        if (baseSet.size <= maxProducts) {
                          setForm(f => ({ ...f, selectedProductsOnline: selected }))
                        }
                      }}
                      placeholder={`Pilih produk untuk bazaar online (maks ${maxProducts} produk utama)`}
                      isDisabled={loading || !form.participateOnline}
                    />
                    {(() => {
                      const baseProductsOnline = form.selectedProductsOnline.map(p => getBaseProduct(p.label))
                      const uniqueBaseProductsOnline = Array.from(new Set(baseProductsOnline))
                      return (
                        <small className={`${uniqueBaseProductsOnline.length >= maxProducts ? 'text-danger' : 'text-muted'}`}>
                          Pilih produk untuk Bazaar Online (maks {maxProducts} produk utama)
                          {uniqueBaseProductsOnline.length > 0 && (
                            <span className="ms-2">
                              ({uniqueBaseProductsOnline.length}/{maxProducts} produk utama terpilih)
                            </span>
                          )}
                          {form.selectedProductsOnline.length > uniqueBaseProductsOnline.length && (
                            <span className="ms-2 text-info">
                              ({form.selectedProductsOnline.length - uniqueBaseProductsOnline.length} varian/variasi)
                            </span>
                          )}
                        </small>
                      )
                    })()}
                  </Col>
                </Row>
                <Row>
                  <Col xs="12" className="mb-3">
                    <Label>Pilih Produk Bazaar Offline *</Label>
                    <Select
                      isMulti
                      options={userProducts}
                      value={form.selectedProductsOffline}
                      onChange={selected => {
                        const baseSet = new Set(selected.map(p => getBaseProduct(p.label)))
                        if (baseSet.size <= maxProducts) {
                          setForm(f => ({ ...f, selectedProductsOffline: selected }))
                        }
                      }}
                      placeholder={`Pilih produk untuk bazaar offline (maks ${maxProducts} produk utama)`}
                      isDisabled={loading || !form.participateOffline}
                    />
                    {(() => {
                      const baseProductsOffline = form.selectedProductsOffline.map(p => getBaseProduct(p.label))
                      const uniqueBaseProductsOffline = Array.from(new Set(baseProductsOffline))
                      return (
                        <small className={`${uniqueBaseProductsOffline.length >= maxProducts ? 'text-danger' : 'text-muted'}`}>
                          Pilih produk untuk Bazaar Offline (maks {maxProducts} produk utama)
                          {uniqueBaseProductsOffline.length > 0 && (
                            <span className="ms-2">
                              ({uniqueBaseProductsOffline.length}/{maxProducts} produk utama terpilih)
                            </span>
                          )}
                          {form.selectedProductsOffline.length > uniqueBaseProductsOffline.length && (
                            <span className="ms-2 text-info">
                              ({form.selectedProductsOffline.length - uniqueBaseProductsOffline.length} varian/variasi)
                            </span>
                          )}
                        </small>
                      )
                    })()}
                  </Col>
                </Row>
              </>
            ) : (
              <Row>
                <Col xs="12" className="mb-3">
                  <Label>Pilih Produk *</Label>
                  <Select
                    isMulti
                    options={userProducts}
                    value={form.selectedProducts}
                    onChange={selected => {
                      const baseSet = new Set(selected.map(p => getBaseProduct(p.label)))
                      if (baseSet.size <= maxProducts) {
                        setForm(f => ({ ...f, selectedProducts: selected }))
                      }
                    }}
                    placeholder={`Pilih produk yang akan dijual di bazaar ini (maks ${maxProducts} produk utama)`}
                    isDisabled={loading}
                  />
                  <small className={`${isAtMaxProducts ? 'text-danger' : 'text-muted'}`}>
                    Pilih produk yang akan Anda jual di bazaar ini (maks {maxProducts} produk utama)
                    {uniqueBaseProducts.length > 0 && (
                      <span className="ms-2">
                        ({uniqueBaseProducts.length}/{maxProducts} produk utama terpilih)
                      </span>
                    )}
                    {form.selectedProducts.length > uniqueBaseProducts.length && (
                      <span className="ms-2 text-info">
                        ({form.selectedProducts.length - uniqueBaseProducts.length} varian/variasi)
                      </span>
                    )}
                  </small>
                </Col>
              </Row>
            )}

            <Row>
              <Col xs="12" className="mb-3">
                <Label>Catatan</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  disabled={loading}
                  placeholder="Tambahkan catatan atau informasi tambahan..."
                />
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          {lastRegistration && lastRegistration.selectedProducts.length > 0 && (
            <Button
              color="warning"
              onClick={() => setForm(f => ({ ...f, selectedProducts: lastRegistration.selectedProducts }))}
              disabled={loading}
            >
              Gunakan Produk dari Bazaar Terakhir
            </Button>
          )}
          <Button color="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Loading...' : (editId ? 'Update' : 'Daftar')}
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
                      <strong>Bazaar:</strong><br />
                      {(() => {
                        const a = announcements.find(a => a.id === selectedRegistration.announcementId)
                        return a ? `${a.title}` : 'N/A'
                      })()}
                    </Col>
                    <Col xs="12" md="6">
                      <strong>Status:</strong><br />
                      {getStatusBadge(selectedRegistration.status)}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col xs="12" md="6">
                      <strong>Partisipasi:</strong><br />
                      {selectedRegistration.participateOnline && <span className="badge bg-primary me-1">Online</span>}
                      {selectedRegistration.participateOffline && <span className="badge bg-info me-1">Offline</span>}
                    </Col>
                    <Col xs="12" md="6">
                      <strong>Jumlah Produk:</strong><br />
                      {selectedRegistration.selectedProductsOnline?.length || selectedRegistration.selectedProductsOffline?.length
                        ? <>
                            {selectedRegistration.selectedProductsOnline?.length > 0 && <span>Online: {selectedRegistration.selectedProductsOnline.length} </span>}
                            {selectedRegistration.selectedProductsOffline?.length > 0 && <span>Offline: {selectedRegistration.selectedProductsOffline.length}</span>}
                          </>
                        : selectedRegistration.selectedProducts?.length || 0}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col xs="12">
                      <strong>Produk yang Didaftarkan:</strong><br />
                      <ul className="mt-1">
                        {selectedRegistration.selectedProductsOnline?.length || selectedRegistration.selectedProductsOffline?.length
                          ? <>
                              {selectedRegistration.selectedProductsOnline?.length > 0 && <>
                                <li><strong>Online:</strong></li>
                                {selectedRegistration.selectedProductsOnline.map((product, index) => (
                                  <li key={"on-"+index} style={{marginLeft: 16}}>{product.label}</li>
                                ))}
                              </>}
                              {selectedRegistration.selectedProductsOffline?.length > 0 && <>
                                <li><strong>Offline:</strong></li>
                                {selectedRegistration.selectedProductsOffline.map((product, index) => (
                                  <li key={"off-"+index} style={{marginLeft: 16}}>{product.label}</li>
                                ))}
                              </>}
                            </>
                          : selectedRegistration.selectedProducts?.map((product, index) => (
                              <li key={index}>{product.label}</li>
                            ))}
                      </ul>
                    </Col>
                  </Row>
                  {selectedRegistration.notes && (
                    <Row className="mt-1">
                      <Col xs="12">
                        <strong>Catatan:</strong><br />
                        {selectedRegistration.notes}
                      </Col>
                    </Row>
                  )}
                  {selectedRegistration.status === 'rejected' && selectedRegistration.adminNotes && (
                    <Row className="mt-2">
                      <Col xs="12">
                        <div className="alert alert-danger mb-0">
                          <strong>Alasan Penolakan:</strong><br />
                          {selectedRegistration.adminNotes}
                        </div>
                      </Col>
                    </Row>
                  )}
                  <Row className="mt-2">
                    <Col xs="12">
                      <small className="text-muted">
                        Didaftarkan pada: {formatDateTimeID(selectedRegistration.createdAt)}
                      </small>
                    </Col>
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

export default BazaarRegistration 