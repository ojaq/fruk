import React, { useEffect, useState } from 'react'
import { Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap'
import Swal from 'sweetalert2'
import DataTable from 'react-data-table-component'
import { Edit, Trash2, ToggleRight, ToggleLeft } from 'react-feather'
import { useAuth } from '../context/AuthContext'

const DataSupplier = () => {
  const { user, productData, saveProductData } = useAuth()
  const [form, setForm] = useState({
    namaProduk: '',
    jenisProduk: '',
    ukuran: '',
    satuan: '',
    hpp: '',
    hjk: '',
    keterangan: ''
  })

  const username = user?.name || ''
  const [data, setData] = useState([])
  const [editIndex, setEditIndex] = useState(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (username && productData[username]) {
      setData(productData[username])
    }
  }, [username, productData])

  const handleSubmit = (e) => {
    e.preventDefault()
    const { namaProduk, jenisProduk, ukuran, satuan, hpp, hjk } = form

    if (!namaProduk || !jenisProduk || !ukuran || !satuan || !hpp || !hjk) {
      Swal.fire('Error', 'Field tidak boleh kosong!', 'error')
      return
    }

    const profileDefaults = {
      namaSupplier: user?.profile?.namaSupplier || '',
      namaBank: user?.profile?.namaBank || '',
      namaPenerima: user?.profile?.namaPenerima || '',
      noRekening: user?.profile?.noRekening || ''
    }

    const newItem = {
      ...form,
      aktif: true,
      ...profileDefaults
    }

    const updated = [...data]
    if (editIndex !== null) {
      updated[editIndex] = { ...newItem }
      Swal.fire('Berhasil', 'Data berhasil diubah', 'success')
    } else {
      updated.push(newItem)
      Swal.fire('Berhasil', 'Data berhasil ditambahkan', 'success')
    }

    setData(updated)
    saveProductData(username, updated)

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
  }

  const handleEdit = (row, index) => {
    setForm(row)
    setEditIndex(index)
  }

  const handleDelete = (index) => {
    const selected = data[index]

    Swal.fire({
      title: `Yakin ingin hapus produk "${selected.namaProduk}"?`,
      text: 'Data ini akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    }).then((res) => {
      if (res.isConfirmed) {
        const updated = [...data]
        updated.splice(index, 1)
        setData(updated)
        saveProductData(username, updated)
        Swal.fire('Dihapus!', `Produk "${selected.namaProduk}" berhasil dihapus.`, 'success')
      }
    })
  }

  const toggleAktif = (index) => {
    const updated = [...data]
    updated[index].aktif = !updated[index].aktif
    setData(updated)
    saveProductData(username, updated)
  }

  const toggleAllAktif = (status) => {
    const updated = data.map(item => ({ ...item, aktif: status }))
    setData(updated)
    saveProductData(username, updated)
    Swal.fire('Berhasil', `Semua produk berhasil di-${status ? 'aktifkan' : 'nonaktifkan'}`, 'success')
  }

  const columns = [
    {
      name: 'No',
      selector: (row, i) => i + 1,
      width: '60px'
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
      selector: row => `Rp${Number(row.hpp).toLocaleString()}`,
      sortable: true,
      wrap: true
    },
    {
      name: 'HJK',
      selector: row => `Rp${Number(row.hjk).toLocaleString()}`,
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
        <Button color="link" onClick={() => toggleAktif(i)}>
          {row.aktif ? <ToggleRight color="green" /> : <ToggleLeft color="gray" />}
        </Button>
      )
    },
    {
      name: 'Aksi',
      cell: (row, i) => (
        <>
          <Button size="sm" color="warning" className="me-2" onClick={() => handleEdit(row, i)}>
            <Edit size={14} />
          </Button>
          <Button size="sm" color="danger" onClick={() => handleDelete(i)}>
            <Trash2 size={14} />
          </Button>
        </>
      )
    }
  ]

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  )

  return (
    <div className="mt-4" style={{ marginRight: "100px", marginLeft: "100px" }}>
      <h4>Data Supplier ({user?.profile?.namaSupplier})</h4>
      <Form onSubmit={handleSubmit} className="mb-4">
        <Row className="mb-2">
          <Col md="3">
            <FormGroup>
              <Label>Nama Produk *</Label>
              <Input value={form.namaProduk} onChange={(e) => setForm({ ...form, namaProduk: e.target.value })} />
            </FormGroup>
          </Col>
          <Col md="2">
            <FormGroup>
              <Label>Jenis Produk *</Label>
              <Input value={form.jenisProduk} onChange={(e) => setForm({ ...form, jenisProduk: e.target.value })} />
            </FormGroup>
          </Col>
          <Col md="1">
            <FormGroup>
              <Label>Ukuran *</Label>
              <Input type="number" value={form.ukuran} onChange={(e) => setForm({ ...form, ukuran: e.target.value })} />
            </FormGroup>
          </Col>
          <Col md="1">
            <FormGroup>
              <Label>Satuan *</Label>
              <Input value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} />
            </FormGroup>
          </Col>
          <Col md="1">
            <FormGroup>
              <Label>HPP *</Label>
              <Input type="number" value={form.hpp} onChange={(e) => setForm({ ...form, hpp: e.target.value })} />
            </FormGroup>
          </Col>
          <Col md="1">
            <FormGroup>
              <Label>HJK *</Label>
              <Input type="number" value={form.hjk} onChange={(e) => setForm({ ...form, hjk: e.target.value })} />
            </FormGroup>
          </Col>
          <Col md="3">
            <FormGroup>
              <Label>Keterangan</Label>
              <Input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
            </FormGroup>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md="6">
            <Input
              placeholder="🔍 Cari produk..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col md="6" className="text-end">
            <Button type="submit" color="primary" className="me-2">
              {editIndex !== null ? 'Update' : 'Tambah'}
            </Button>
            <Button color="success" className="me-2" onClick={() => toggleAllAktif(true)}>
              Aktifkan Semua
            </Button>
            <Button color="danger" className="me-2" onClick={() => toggleAllAktif(false)}>
              Nonaktifkan Semua
            </Button>
            <Button color="warning" onClick={() => window.history.back()}>
              Kembali
            </Button>
          </Col>
        </Row>
      </Form>

      <div className="border">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          noDataComponent="Belum ada data"
          responsive
          highlightOnHover
        />
      </div>
    </div>
  )
}

export default DataSupplier