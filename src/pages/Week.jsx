import React, { useEffect, useState } from 'react'
import { Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap'
import DataTable from 'react-data-table-component'
import { Edit, Trash2 } from 'react-feather'
import Select from 'react-select'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom'

const Week = () => {
  const { productData, registeredUsers, weekData, saveWeekData } = useAuth()
  const { num } = useParams()
  const sheetName = `W${num}`

  const [form, setForm] = useState({
    pemesan: '', produkLabel: null, catatan: '', jumlah: '', bayar: ''
  })
  const [data, setData] = useState([])
  const [editIndex, setEditIndex] = useState(null)
  const [produkOptions, setProdukOptions] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedPemesan, setSelectedPemesan] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAllWeek = !num
  const allWeekEntries = isAllWeek
    ? Object.keys(weekData)
      .filter(k => /^W\d+/.test(k))
      .flatMap(k => weekData[k] || [])
    : []

  const uniquePemesanThisWeek = !isAllWeek ? [...new Set((weekData[sheetName] || []).map(d => d.pemesan))].sort((a, b) => a.localeCompare(b)) : []

  useEffect(() => {
    if (isAllWeek) {
      const sorted = (allWeekEntries || []).slice().sort((a, b) => (a.pemesan || '').toLowerCase().localeCompare((b.pemesan || '').toLowerCase()))
      setData(sorted)
    } else {
      const sorted = (weekData[sheetName] || []).slice().sort((a, b) => (a.pemesan || '').toLowerCase().localeCompare((b.pemesan || '').toLowerCase()))
      setData(sorted)
    }
  }, [weekData, sheetName, isAllWeek])

  useEffect(() => {
    const all = []
    Object.entries(productData).forEach(([username, items]) => {
      const user = registeredUsers.find(u => u.name === username)
      if (!user) return
      items.forEach((item, i) => {
        if (item.aktif) {
          all.push({
            label: `${item.namaProduk} ${item.ukuran} ${item.satuan}`,
            value: `${username}-${i}`,
            data: item
          })
        }
      })
    })
    setProdukOptions(all)
  }, [productData, registeredUsers])

  const handleSelectProduk = option => {
    const harga = option.data.hjk
    setForm(f => ({
      ...f,
      produkLabel: option,
      bayar: f.jumlah ? Number(f.jumlah) * Number(harga) : ''
    }))
  }

  const handleJumlahChange = val => {
    const jumlah = Number(val)
    setForm(f => ({
      ...f,
      jumlah: val,
      bayar: f.produk ? jumlah * Number(f.produk.data.hjk) : ''
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)

    try {
      const { pemesan, produk, jumlah } = form
      if (!pemesan || !produk || !jumlah) {
        Swal.fire('Gagal', 'Semua field * wajib diisi', 'error')
        return
      }

      const entry = {
        pemesan,
        produkLabel: produk.label,
        catatan: form.catatan,
        jumlah,
        bayar: form.bayar,
        namaSupplier: produk.data.namaSupplier
      }

      const updated = [...data]
      if (editIndex !== null) {
        updated[editIndex] = entry
        await saveWeekData(sheetName, updated)
        Swal.fire('Berhasil', 'Data diperbarui', 'success')
      } else {
        updated.push(entry)
        await saveWeekData(sheetName, updated)
        Swal.fire('Berhasil', 'Data ditambahkan', 'success')
      }

      setData(updated)
      setForm({ pemesan: '', produkLabel: null, catatan: '', jumlah: '', bayar: '' })
      setEditIndex(null)
    } catch (error) {
      console.error('Error saving week data:', error)
      Swal.fire('Error', 'Gagal menyimpan data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row, i) => {
    const opt = produkOptions.find(o => o.label === row.produkLabel)
    setForm({
      pemesan: row.pemesan,
      produkLabel: opt,
      catatan: row.catatan,
      jumlah: row.jumlah,
      bayar: row.bayar
    })
    setEditIndex(i)
  }

  const handleDelete = async index => {
    const result = await Swal.fire({
      title: `Hapus baris ke-${index + 1}?`,
      text: 'Anda akan menghapus data ini.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus'
    })

    if (!result.isConfirmed) return

    setLoading(true)
    try {
      const updated = [...data]
      updated.splice(index, 1)
      await saveWeekData(sheetName, updated)
      setData(updated)
      Swal.fire('Dihapus!', 'Data berhasil dihapus.', 'success')
    } catch (error) {
      console.error('Error deleting week data:', error)
      Swal.fire('Error', 'Gagal menghapus data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { name: 'No', selector: (r, i) => i + 1, width: '60px', wrap: true },
    { name: 'Pemesan', selector: r => r.pemesan, wrap: true },
    { name: 'Produk', selector: r => r.produkLabel, wrap: true },
    { name: 'Catatan', selector: r => r.catatan || "-", wrap: true },
    { name: 'Jumlah', selector: r => r.jumlah, wrap: true, width: "120px", },
    {
      name: 'Total Bayar',
      selector: r => {
        const bayar = parseFloat(r.bayar)
        return `Rp${bayar.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
      },
      width: "140px",
      wrap: true
    },
    {
      name: 'Aksi',
      cell: (r, i) => (
        <>
          <Button size="sm" color="warning" className="me-2" onClick={() => handleEdit(r, i)} disabled={loading || isAllWeek}>
            <Edit size={16} />
          </Button>
          <Button size="sm" color="danger" onClick={() => handleDelete(i)} disabled={loading}>
            <Trash2 size={16} />
          </Button>
        </>
      ),
      width: "140px",
      wrap: true
    }
  ]

  const filtered = data.filter(row => {
    const matchSearch = Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
    const matchPemesan = selectedPemesan ? row.pemesan === selectedPemesan.value : true
    return matchSearch && matchPemesan
  })

  const uniquePemesanOptions = [...new Set(data.map(d => d.pemesan))].map(p => ({
    label: p,
    value: p
  }))

  return (
    <div className="container-fluid mt-4 px-1 px-sm-3 px-md-5">
      <Row className="mb-2">
        <Col xs="12" md="6">
          <h4>{isAllWeek ? 'Semua Minggu' : `Minggu ${num}`}</h4>
        </Col>
        <Col xs="12" md="6" className="text-end mt-2 mt-md-0">
          <Button color="warning" onClick={() => window.history.back()}>
            Kembali
          </Button>
        </Col>
      </Row>
      <Form onSubmit={handleSubmit} className="mb-4">
        <Row className="mb-2">
          <Col xs="12" sm="6" md="3" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Pemesan *</Label>
              <Input
                value={form.pemesan}
                onChange={e => setForm(f => ({ ...f, pemesan: e.target.value }))}
                disabled={loading || isAllWeek}
                list={!isAllWeek ? 'pemesan-suggestions' : undefined}
              />
              {!isAllWeek && (
                <datalist id="pemesan-suggestions">
                  {uniquePemesanThisWeek.map((p, i) => (
                    <option key={i} value={p} />
                  ))}
                </datalist>
              )}
            </FormGroup>
          </Col>
          <Col xs="12" sm="6" md="3" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Produk *</Label>
              <Select
                options={produkOptions}
                value={form.produkLabel}
                onChange={handleSelectProduk}
                placeholder="🔽 Pilih produk"
                isSearchable
                isDisabled={loading || isAllWeek}
              />
              {form.produkLabel?.data?.keterangan && (
                <small className="text-muted">
                  Keterangan: {form.produkLabel.data.keterangan}
                </small>
              )}
            </FormGroup>
          </Col>
          <Col xs="12" sm="6" md="3" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Catatan/Varian</Label>
              <Input
                value={form.catatan}
                onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                disabled={loading || isAllWeek}
              />
            </FormGroup>
          </Col>
          <Col xs="6" sm="3" md="1" className="mb-2 mb-md-0">
            <FormGroup>
              <Label>Jumlah *</Label>
              <Input
                type="number"
                value={form.jumlah}
                onChange={e => handleJumlahChange(e.target.value)}
                disabled={loading || isAllWeek}
              />
            </FormGroup>
          </Col>
          <Col xs="6" sm="3" md="2">
            <FormGroup>
              <Label>Total Bayar</Label>
              <Input
                readOnly
                value={
                  form.bayar
                    ? `Rp${parseFloat(form.bayar).toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
                    : ''
                }
                disabled={loading || isAllWeek}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col xs="12" md="4" className="mb-2 mb-md-0">
            <Input
              placeholder="🔍 Cari apa aja..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              disabled={loading}
            />
          </Col>
          <Col xs="12" md="4" className="mb-2 mb-md-0">
            <Select
              options={uniquePemesanOptions}
              isClearable
              isSearchable
              placeholder="🔽 Filter pemesan"
              value={selectedPemesan}
              onChange={setSelectedPemesan}
              isDisabled={loading}
            />
          </Col>
          <Col xs="12" md="4" className="text-end">
            <Button color="danger" className="me-3 mb-2 mb-md-0" onClick={() => {
              setSearchText('')
              setSelectedPemesan(null)
            }} disabled={loading}>
              Reset Filter
            </Button>
            <Button type="submit" color="primary" disabled={loading || isAllWeek} className="mb-2 mb-md-0">
              {loading ? 'Loading...' : (editIndex !== null ? 'Update' : 'Tambah')}
            </Button>
          </Col>
        </Row>
      </Form>
      <div className="border overflow-auto" style={{ minHeight: 200 }}>
        <DataTable
          columns={columns}
          data={filtered}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          noDataComponent="Belum ada data"
          highlightOnHover
          responsive
          progressPending={loading}
        />
      </div>
    </div>
  )
}

export default Week