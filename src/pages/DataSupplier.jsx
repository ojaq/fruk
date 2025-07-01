import React, { useEffect, useState } from 'react'
import { Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap'
import Swal from 'sweetalert2'
import DataTable from 'react-data-table-component'
import { Edit, Trash2, ToggleRight, ToggleLeft } from 'react-feather'
import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom'

const DataSupplier = () => {
  const { user, productData, saveProductData, registeredUsers } = useAuth()
  const { user: targetUser } = useParams()
  const [form, setForm] = useState({
    namaProduk: '',
    jenisProduk: '',
    ukuran: '',
    satuan: '',
    hpp: '',
    hjk: '',
    keterangan: ''
  })

  const username = targetUser || user?.name || ''
  const targetUserData = registeredUsers.find(u => u.name === username)
  
  const canEdit = user?.role === 'admin' || user?.role === 'superadmin' || username === user?.name
  const isViewingOwnData = username === user?.name
  
  const [editIndex, setEditIndex] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)

  const data = (productData[username] || []).slice().sort((a, b) => (a.namaProduk || '').toLowerCase().localeCompare((b.namaProduk || '').toLowerCase()))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { namaProduk, jenisProduk, ukuran, satuan, hpp, hjk } = form

      if (!namaProduk || !jenisProduk || !ukuran || !satuan || !hpp || !hjk) {
        Swal.fire('Error', 'Field tidak boleh kosong!', 'error')
        return
      }

      const profileDefaults = {
        namaSupplier: targetUserData?.profile?.namaSupplier || user?.profile?.namaSupplier || '',
        namaBank: targetUserData?.profile?.namaBank || user?.profile?.namaBank || '',
        namaPenerima: targetUserData?.profile?.namaPenerima || user?.profile?.namaPenerima || '',
        noRekening: targetUserData?.profile?.noRekening || user?.profile?.noRekening || ''
      }

      const newItem = {
        ...form,
        aktif: true,
        ...profileDefaults
      }

      const updated = [...data]
      if (editIndex !== null) {
        updated[editIndex] = { ...newItem }
        await saveProductData(username, updated)
        Swal.fire('Berhasil', 'Data berhasil diubah', 'success')
      } else {
        updated.push(newItem)
        await saveProductData(username, updated)
        Swal.fire('Berhasil', 'Data berhasil ditambahkan', 'success')
      }

      setForm({
        namaProduk: '',
        jenisProduk: '',
        ukuran: '',
        satuan: '',
        hpp: '',
        hjk: '',
        keterangan: ''
      })
      setEditIndex(null)
    } catch (error) {
      console.error('Error saving product:', error)
      Swal.fire('Error', 'Gagal menyimpan data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row, index) => {
    setForm(row)
    setEditIndex(index)
  }

  const handleDelete = async (index) => {
    const filteredData = data.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      )
    )
    
    const selected = filteredData[index]

    const result = await Swal.fire({
      title: `Yakin ingin hapus produk "${selected.namaProduk}"?`,
      text: 'Data ini akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    setLoading(true)
    try {
      const actualIndex = data.findIndex(item => 
        item.namaProduk === selected.namaProduk &&
        item.jenisProduk === selected.jenisProduk &&
        item.ukuran === selected.ukuran &&
        item.satuan === selected.satuan
      )
      
      if (actualIndex === -1) {
        Swal.fire('Error', 'Data tidak ditemukan', 'error')
        return
      }

      const updated = [...data]
      updated.splice(actualIndex, 1)
      await saveProductData(username, updated)
      Swal.fire('Dihapus!', `Produk "${selected.namaProduk}" berhasil dihapus.`, 'success')
    } catch (error) {
      console.error('Error deleting product:', error)
      Swal.fire('Error', 'Gagal menghapus produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleAktif = async (index) => {
    setLoading(true)
    try {
      const updated = [...data]
      updated[index].aktif = !updated[index].aktif
      await saveProductData(username, updated)
      Swal.fire('Berhasil', `Produk berhasil di-${updated[index].aktif ? 'aktifkan' : 'nonaktifkan'}`, 'success')
    } catch (error) {
      console.error('Error toggling product status:', error)
      Swal.fire('Error', 'Gagal mengubah status produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleAllAktif = async (status) => {
    setLoading(true)
    try {
      const updated = data.map(item => ({ ...item, aktif: status }))
      await saveProductData(username, updated)
      Swal.fire('Berhasil', `Semua produk berhasil di-${status ? 'aktifkan' : 'nonaktifkan'}`, 'success')
    } catch (error) {
      console.error('Error toggling all products:', error)
      Swal.fire('Error', 'Gagal mengubah status semua produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      name: 'No',
      selector: (row, i) => i + 1,
      width: '60px',
      wrap: true
    },
    {
      name: 'Nama Produk',
      selector: row => row.namaProduk,
      sortable: true,
      wrap: true
    },
    {
      name: 'Jenis',
      selector: row => row.jenisProduk,
      sortable: true,
      wrap: true
    },
    {
      name: 'Ukuran',
      selector: row => row.ukuran,
      sortable: true,
      wrap: true
    },
    {
      name: 'Satuan',
      selector: row => row.satuan,
      sortable: true,
      wrap: true
    },
    {
      name: 'HPP',
      selector: row => {
        const hpp = parseFloat(row.hpp)
        return `Rp${hpp.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
      },
      sortable: true,
      wrap: true
    },
    {
      name: 'HJK',
      selector: row => {
        const hjk = parseFloat(row.hjk)
        return `Rp${hjk.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
      },
      sortable: true,
      wrap: true
    },
    {
      name: 'Keterangan',
      selector: row => row.keterangan || '-',
      sortable: true,
      wrap: true
    },
    {
      name: 'Aktif?',
      cell: (row, i) => (
        <Button color="link" onClick={() => toggleAktif(i)} disabled={loading || !canEdit}>
          {row.aktif ? <ToggleRight color="green" /> : <ToggleLeft color="gray" />}
        </Button>
      ),
      wrap: true
    },
    {
      name: 'Aksi',
      cell: (row, i) => (
        <>
          {canEdit && (
            <>
              <Button size="sm" color="warning" className="me-2" onClick={() => handleEdit(row, i)} disabled={loading}>
                <Edit size={14} />
              </Button>
              <Button size="sm" color="danger" onClick={() => handleDelete(i)} disabled={loading}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </>
      ),
      wrap: true
    }
  ]

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  )

  return (
    <div className="container-fluid mt-4 px-1 px-sm-3 px-md-5">
      <h4>Data Supplier ({targetUserData?.profile?.namaSupplier || username})</h4>
      {!isViewingOwnData && (
        <p className="text-muted mb-3">
          {canEdit ? 'Mode Admin - Anda dapat mengedit data supplier ini' : 'Mode View - Anda hanya dapat melihat data'}
        </p>
      )}
      <Form onSubmit={handleSubmit} className="mb-4">
        <Row className="mb-2">
          <Col xs="12" sm="6" md="3" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Nama Produk *</Label>
              <Input 
                value={form.namaProduk} 
                onChange={(e) => setForm({ ...form, namaProduk: e.target.value })} 
                disabled={loading || !canEdit}
              />
            </FormGroup>
          </Col>
          <Col xs="12" sm="6" md="2" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Jenis Produk *</Label>
              <Input 
                value={form.jenisProduk} 
                onChange={(e) => setForm({ ...form, jenisProduk: e.target.value })} 
                disabled={loading || !canEdit}
              />
            </FormGroup>
          </Col>
          <Col xs="6" sm="3" md="1" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Ukuran *</Label>
              <Input 
                type="number" 
                value={form.ukuran} 
                onChange={(e) => setForm({ ...form, ukuran: e.target.value })} 
                disabled={loading || !canEdit}
              />
            </FormGroup>
          </Col>
          <Col xs="6" sm="3" md="1" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Satuan *</Label>
              <Input 
                value={form.satuan} 
                onChange={(e) => setForm({ ...form, satuan: e.target.value })} 
                disabled={loading || !canEdit}
              />
            </FormGroup>
          </Col>
          <Col xs="6" sm="3" md="1" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>HPP *</Label>
              <Input 
                type="number" 
                value={form.hpp} 
                onChange={(e) => setForm({ ...form, hpp: e.target.value })} 
                disabled={loading || !canEdit}
              />
            </FormGroup>
          </Col>
          <Col xs="6" sm="3" md="1" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>HJK *</Label>
              <Input 
                type="number" 
                value={form.hjk} 
                onChange={(e) => setForm({ ...form, hjk: e.target.value })} 
                disabled={loading || !canEdit}
              />
            </FormGroup>
          </Col>
          <Col xs="12" md="3">
            <FormGroup>
              <Label>Keterangan</Label>
              <Input 
                value={form.keterangan} 
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })} 
                disabled={loading || !canEdit}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col xs="12" md="6" className="mb-2 mb-md-0">
            <Input
              placeholder="🔍 Cari produk..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              disabled={loading}
            />
          </Col>
          <Col xs="12" md="6" className="text-end">
            {canEdit && (
              <>
                <Button type="submit" color="primary" className="me-2" disabled={loading}>
                  {loading ? 'Loading...' : (editIndex !== null ? 'Update' : 'Tambah')}
                </Button>
                <Button color="success" className="me-2" onClick={() => toggleAllAktif(true)} disabled={loading}>
                  Aktifkan Semua
                </Button>
                <Button color="danger" className="me-2" onClick={() => toggleAllAktif(false)} disabled={loading}>
                  Nonaktifkan Semua
                </Button>
              </>
            )}
            <Button color="warning" onClick={() => window.history.back()} disabled={loading}>
              Kembali
            </Button>
          </Col>
        </Row>
      </Form>

      <div className="border overflow-auto" style={{ minHeight: 200 }}>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          noDataComponent="Belum ada data"
          responsive
          highlightOnHover
          progressPending={loading}
        />
      </div>
    </div>
  )
}

export default DataSupplier