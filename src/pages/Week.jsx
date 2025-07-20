import React, { useEffect, useState } from 'react'
import { Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap'
import DataTable from 'react-data-table-component'
import { Edit, Trash2 } from 'react-feather'
import Select from 'react-select'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom'

const Week = () => {
  const { productData, registeredUsers, weekData, saveWeekData, bazaarData } = useAuth()
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

  const currentAnnouncement = (bazaarData.announcements || []).find(a => a.weekId === sheetName && a.status === 'active')
  const approvedRegs = (bazaarData.registrations || []).filter(r => r.announcementId === currentAnnouncement?.id && r.status === 'approved')
  const allowedProducts = []
  approvedRegs.forEach(reg => {
    const onlineArr = Array.isArray(reg.selectedProductsOnline) ? reg.selectedProductsOnline : []
    if (onlineArr.length) {
      onlineArr.forEach(prod => {
        allowedProducts.push({
          ...prod,
          owner: reg.supplierName
        })
      })
    } else {
      (Array.isArray(reg.selectedProducts) ? reg.selectedProducts : []).forEach(prod => {
        allowedProducts.push({
          ...prod,
          owner: reg.supplierName
        })
      })
    }
  })

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
    if (currentAnnouncement) {
      setProdukOptions(allowedProducts)
    } else {
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
    }
  }, [productData, registeredUsers, currentAnnouncement, allowedProducts])

  const getAdjustedHJK = (val) => {
    const num = parseFloat(val)
    if (!num || num <= 0) return 0
    return num < 1000 ? num * 1000 : num
  }

  const handleSelectProduk = option => {
    const harga = option.data.hjk
    const adjustedHJK = getAdjustedHJK(harga)
    setForm(f => ({
      ...f,
      produkLabel: option,
      bayar: f.jumlah ? Number(f.jumlah) * adjustedHJK : '',
      adjustedHJK: adjustedHJK
    }))
  }

  const handleJumlahChange = val => {
    const jumlah = Number(val)
    setForm(f => ({
      ...f,
      jumlah: val,
      bayar: f.produkLabel ? jumlah * getAdjustedHJK(f.produkLabel.data.hjk) : '',
      adjustedHJK: f.produkLabel ? getAdjustedHJK(f.produkLabel.data.hjk) : ''
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)

    try {
      const { pemesan, produkLabel, jumlah } = form
      if (!pemesan || !produkLabel || !jumlah) {
        Swal.fire('Gagal', 'Semua field * wajib diisi', 'error')
        return
      }

      const entry = {
        pemesan,
        produkLabel: produkLabel.label,
        catatan: form.catatan,
        jumlah,
        bayar: form.bayar,
        namaSupplier: produkLabel.data.namaSupplier
      }

      const updated = [...data]
      if (editIndex !== null) {
        const filteredRows = data.filter(row => {
          const matchSearch = Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchText.toLowerCase())
          )
          const matchPemesan = selectedPemesan ? row.pemesan === selectedPemesan.value : true
          return matchSearch && matchPemesan
        })
        const editingRow = filteredRows[editIndex]
        const actualIndex = data.findIndex(row =>
          row.pemesan === editingRow.pemesan &&
          row.produkLabel === editingRow.produkLabel &&
          row.jumlah === editingRow.jumlah &&
          row.catatan === editingRow.catatan
        )
        if (actualIndex !== -1) {
          updated[actualIndex] = entry
          await saveWeekData(sheetName, updated)
          Swal.fire('Berhasil', 'Data diperbarui', 'success')
        } else {
          updated.push(entry)
          await saveWeekData(sheetName, updated)
          Swal.fire('Berhasil', 'Data ditambahkan', 'success')
        }
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

  const handleDelete = async (index) => {
    const filteredRows = data.filter(row => {
      const matchSearch = Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      )
      const matchPemesan = selectedPemesan ? row.pemesan === selectedPemesan.value : true
      return matchSearch && matchPemesan
    })
    const selected = filteredRows[index]
    const result = await Swal.fire({
      title: `Hapus data \n "${selected.pemesan} - ${selected.produkLabel}"?`,
      text: 'Anda akan menghapus data ini.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus'
    })

    if (!result.isConfirmed) return

    setLoading(true)
    try {
      const actualIndex = data.findIndex(row =>
        row.pemesan === selected.pemesan &&
        row.produkLabel === selected.produkLabel &&
        row.jumlah === selected.jumlah &&
        row.catatan === selected.catatan
      )
      if (actualIndex === -1) {
        Swal.fire('Error', 'Data tidak ditemukan', 'error')
        return
      }
      const updated = [...data]
      updated.splice(actualIndex, 1)
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
        if (!bayar || bayar <= 0) return '-'
        return `Rp${bayar.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
      },
      width: "140px",
      wrap: true
    },
    {
      name: 'Aksi',
      cell: (row) => {
        const filteredIndex = filtered.findIndex(f =>
          f.pemesan === row.pemesan &&
          f.produkLabel === row.produkLabel &&
          f.jumlah === row.jumlah &&
          f.catatan === row.catatan
        )
        return (
          <>
            <Button size="sm" color="warning" className="me-2" onClick={() => handleEdit(row, filteredIndex)} disabled={loading || isAllWeek}>
              <Edit size={16} />
            </Button>
            <Button size="sm" color="danger" onClick={() => handleDelete(filteredIndex)} disabled={loading}>
              <Trash2 size={16} />
            </Button>
          </>
        )
      },
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
                  form.bayar && parseFloat(form.bayar) > 0
                    ? `Rp${parseFloat(form.bayar).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
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