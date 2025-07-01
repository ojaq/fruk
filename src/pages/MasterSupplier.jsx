import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import DataTable from 'react-data-table-component'
import { Row, Col, Input, Button } from 'reactstrap'
import Swal from 'sweetalert2'
import { Edit, Trash2 } from 'react-feather'
import Select from 'react-select'

const MasterSupplier = () => {
  const { productData, registeredUsers, user, saveProductData } = useAuth()
  const [combinedData, setCombinedData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [filterSupplier, setFilterSupplier] = useState(null)
  const [filterJenis, setFilterJenis] = useState(null)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editOwner, setEditOwner] = useState(null)
  const [editIndex, setEditIndex] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const all = []
    Object.entries(productData).forEach(([username, items]) => {
      const userObj = registeredUsers.find(u => u.name === username)
      if (!userObj) return
      items.forEach((item, i) => {
        if (item.aktif) {
          all.push({
            ...item,
            namaSupplier: item.namaSupplier || userObj.profile?.namaSupplier || userObj.name,
            namaBank: item.namaBank,
            namaPenerima: item.namaPenerima,
            noRekening: item.noRekening,
            _owner: username,
            _index: i
          })
        }
      })
    })
    all.sort((a, b) => (a.namaSupplier || '').toLowerCase().localeCompare((b.namaSupplier || '').toLowerCase()))
    setCombinedData(all)
  }, [productData, registeredUsers])

  const handleEdit = (row) => {
    setEditForm({ ...row })
    setEditOwner(row._owner)
    setEditIndex(row._index)
    setEditModal(true)
  }

  const handleEditSave = async () => {
    setLoading(true)
    try {
      const updatedList = [...(productData[editOwner] || [])]
      updatedList[editIndex] = { ...editForm }
      await saveProductData(editOwner, updatedList)
      setEditModal(false)
      Swal.fire('Berhasil', 'Data produk berhasil diupdate', 'success')
    } catch (err) {
      Swal.fire('Error', 'Gagal update produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: `Hapus produk "${row.namaProduk}"?`,
      text: 'Data ini akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    setLoading(true)
    try {
      const updatedList = [...(productData[row._owner] || [])]
      updatedList.splice(row._index, 1)
      await saveProductData(row._owner, updatedList)
      Swal.fire('Dihapus!', `Produk "${row.namaProduk}" berhasil dihapus.`, 'success')
    } catch (err) {
      Swal.fire('Error', 'Gagal menghapus produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { name: 'No', selector: (row, i) => i + 1, width: '60px', wrap: true },
    { name: 'Nama Supplier', selector: row => row.namaSupplier, wrap: true },
    { name: 'Nama Produk', selector: row => row.namaProduk, wrap: true },
    { name: 'Jenis', selector: row => row.jenisProduk, wrap: true },
    { name: 'Ukuran', selector: row => row.ukuran, wrap: true },
    { name: 'Satuan', selector: row => row.satuan, wrap: true },
    { 
      name: 'HPP', 
      selector: row => {
        const hpp = parseFloat(row.hpp)
        return `Rp${hpp.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
      }, 
      wrap: true 
    },
    { 
      name: 'HJK', 
      selector: row => {
        const hjk = parseFloat(row.hjk)
        return `Rp${hjk.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
      }, 
      wrap: true 
    },
    { name: 'Keterangan', selector: row => row.keterangan || '-', wrap: true },
    { name: 'Bank', selector: row => row.namaBank, wrap: true },
    { name: 'Penerima', selector: row => row.namaPenerima, wrap: true },
    { name: 'No Rekening', selector: row => row.noRekening, wrap: true },
    ...(user?.role === 'admin' || user?.role === 'superadmin' ? [{
      name: 'Aksi',
      cell: row => (
        <>
          <Button size="sm" color="warning" className="me-2" onClick={() => handleEdit(row)} disabled={loading}>
            <Edit size={14} />
          </Button>
          <Button size="sm" color="danger" onClick={() => handleDelete(row)} disabled={loading}>
            <Trash2 size={14} />
          </Button>
        </>
      ),
      width: '140px',
      wrap: true
    }] : [])
  ]

  const supplierOptions = [...new Set(combinedData.map(d => d.namaSupplier))].map(s => ({ label: s, value: s }))
  const jenisOptions = [...new Set(combinedData.map(d => d.jenisProduk))].map(j => ({ label: j, value: j }))

  const filtered = combinedData.filter(item => {
    const matchesSearch = Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
    const matchesSupplier = filterSupplier ? item.namaSupplier === filterSupplier.value : true
    const matchesJenis = filterJenis ? item.jenisProduk === filterJenis.value : true
    return matchesSearch && matchesSupplier && matchesJenis
  })

  return (
    <div className="container-fluid mt-4 px-1 px-sm-3 px-md-5">
      <Row className="mb-3">
        <Col xs="12" md="6">
          <h4>Master Data Supplier</h4>
        </Col>
        <Col xs="12" md="6" className="text-end mt-2 mt-md-0">
          <Button color="danger" className="me-3" onClick={() => {
            setSearchText('')
            setFilterSupplier(null)
            setFilterJenis(null)
          }}>
            Reset Filter
          </Button>
          <Button color="warning" onClick={() => window.history.back()}>
            Kembali
          </Button>
        </Col>
      </Row>

      <Row className="mt-3 mb-4">
        <Col xs="12" md="4" className="mb-2 mb-md-0">
          <Input
            placeholder="🔍 Cari apa aja..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs="12" md="4" className="mb-2 mb-md-0">
          <Select
            options={supplierOptions}
            placeholder="🔽 Filter Supplier"
            isClearable
            isSearchable
            value={filterSupplier}
            onChange={setFilterSupplier}
          />
        </Col>
        <Col xs="12" md="4">
          <Select
            options={jenisOptions}
            placeholder="🔽 Filter Jenis"
            isClearable
            isSearchable
            value={filterJenis}
            onChange={setFilterJenis}
          />
        </Col>
      </Row>

      <div className="border overflow-auto" style={{ minHeight: 200 }}>
        <DataTable
          columns={columns}
          data={filtered}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          noDataComponent="Belum ada data supplier aktif"
          responsive
          highlightOnHover
        />
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Produk</h5>
                <Button close onClick={() => setEditModal(false)} />
              </div>
              <div className="modal-body">
                <Row>
                  <Col md="4">
                    <label>Nama Produk</label>
                    <Input value={editForm.namaProduk || ''} onChange={e => setEditForm(f => ({ ...f, namaProduk: e.target.value }))} />
                  </Col>
                  <Col md="2">
                    <label>Jenis Produk</label>
                    <Input value={editForm.jenisProduk || ''} onChange={e => setEditForm(f => ({ ...f, jenisProduk: e.target.value }))} />
                  </Col>
                  <Col md="2">
                    <label>Ukuran</label>
                    <Input value={editForm.ukuran || ''} onChange={e => setEditForm(f => ({ ...f, ukuran: e.target.value }))} />
                  </Col>
                  <Col md="2">
                    <label>Satuan</label>
                    <Input value={editForm.satuan || ''} onChange={e => setEditForm(f => ({ ...f, satuan: e.target.value }))} />
                  </Col>
                  <Col md="2">
                    <label>HPP</label>
                    <Input value={editForm.hpp || ''} onChange={e => setEditForm(f => ({ ...f, hpp: e.target.value }))} />
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md="2">
                    <label>HJK</label>
                    <Input value={editForm.hjk || ''} onChange={e => setEditForm(f => ({ ...f, hjk: e.target.value }))} />
                  </Col>
                  <Col md="4">
                    <label>Keterangan</label>
                    <Input value={editForm.keterangan || ''} onChange={e => setEditForm(f => ({ ...f, keterangan: e.target.value }))} />
                  </Col>
                  <Col md="2">
                    <label>Bank</label>
                    <Input value={editForm.namaBank || ''} onChange={e => setEditForm(f => ({ ...f, namaBank: e.target.value }))} />
                  </Col>
                  <Col md="2">
                    <label>Penerima</label>
                    <Input value={editForm.namaPenerima || ''} onChange={e => setEditForm(f => ({ ...f, namaPenerima: e.target.value }))} />
                  </Col>
                  <Col md="2">
                    <label>No Rekening</label>
                    <Input value={editForm.noRekening || ''} onChange={e => setEditForm(f => ({ ...f, noRekening: e.target.value }))} />
                  </Col>
                </Row>
              </div>
              <div className="modal-footer">
                <Button color="primary" onClick={handleEditSave} disabled={loading}>Simpan</Button>
                <Button color="secondary" onClick={() => setEditModal(false)} disabled={loading}>Batal</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterSupplier