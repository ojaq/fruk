import React, { useEffect, useState } from 'react'
import { Button, Col, Collapse, Form, FormGroup, Input, Label, Row } from 'reactstrap'
import DataTable from 'react-data-table-component'
import { Edit, Trash2 } from 'react-feather'
import Select from 'react-select'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom'

const Week = () => {
  const { productData, registeredUsers, weekData, saveWeekData } = useAuth()
  const { num } = useParams()
  const sheetName  = `W${num}`

  const [form, setForm] = useState({
    pemesan: '', produk: null, catatan: '', jumlah: '', bayar: ''
  })
  const [data, setData] = useState([])
  const [editIndex, setEditIndex] = useState(null)
  const [produkOptions, setProdukOptions] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedPemesan, setSelectedPemesan] = useState(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('weekData')) || {}
    setData(stored[sheetName] || [])
  }, [sheetName])

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
      produk: option,
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

  const handleSubmit = e => {
    e.preventDefault()
    const { pemesan, produk, jumlah } = form
    if (!pemesan || !produk || !jumlah) {
      return Swal.fire('Gagal','Semua field * wajib diisi','error')
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
      Swal.fire('Berhasil','Data diperbarui','success')
    } else {
      updated.push(entry)
      Swal.fire('Berhasil','Data ditambahkan','success')
    }
    setData(updated)
    saveWeekData(sheetName, updated)
    setForm({ pemesan:'', produk:null, catatan:'', jumlah:'', bayar:'' })
    setEditIndex(null)
  }

  const handleEdit = (row,i) => {
    const opt = produkOptions.find(o=>o.label===row.produkLabel)
    setForm({
      pemesan: row.pemesan,
      produk: opt,
      catatan: row.catatan,
      jumlah: row.jumlah,
      bayar: row.bayar
    })
    setEditIndex(i)
  }

  const handleDelete = index => {
    Swal.fire({
      title: `Hapus baris ke-${index+1}?`,
      text: 'Anda akan menghapus data ini.',
      icon:'warning',
      showCancelButton:true,
      confirmButtonText:'Hapus'
    }).then(res => {
      if (!res.isConfirmed) return
      const updated = [...data]; updated.splice(index,1)
      setData(updated)
      saveWeekData(sheetName, updated)
      Swal.fire('Dihapus!','Data berhasil dihapus.','success')
    })
  }

  const columns = [
    { name:'No', selector:(r,i)=>i+1, width:'60px' },
    { name:'Pemesan', selector:r=>r.pemesan, wrap:true },
    { name:'Produk', selector:r=>r.produkLabel, wrap:true },
    { name:'Catatan', selector:r=>r.catatan, wrap:true  },
    { name:'Jumlah', selector:r=>r.jumlah },
    { name:'Total Bayar', selector:r=>`Rp${Number(r.bayar).toLocaleString()}` },
    {
      name:'Aksi',
      cell:(r,i)=>(
        <>
          <Button size="sm" color="warning" className="me-2" onClick={()=>handleEdit(r,i)}> <Edit size={14}/> </Button>
          <Button size="sm" color="danger" onClick={()=>handleDelete(i)}> <Trash2 size={14}/> </Button>
        </>
      )
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
    <div className="mt-4 mx-5">
      <Row className="mb-2">
        <Col md="6">
          <h4>Minggu {num}</h4>
        </Col>
        <Col md="6" className="text-end">
          <Button color="warning" onClick={() => window.history.back()}>
            Kembali
          </Button>
        </Col>
      </Row>
      <Form onSubmit={handleSubmit} className="mb-4">
        <Row className="mb-2">
          <Col md="3">
            <FormGroup>
              <Label>Pemesan *</Label>
              <Input
                value={form.pemesan}
                onChange={e=>setForm(f=>({...f,pemesan:e.target.value}))}
              />
            </FormGroup>
          </Col>
          <Col md="3">
            <FormGroup>
              <Label>Produk *</Label>
              <Select
                options={produkOptions}
                value={form.produk}
                onChange={handleSelectProduk}
                placeholder="🔽 Pilih produk"
                isSearchable
              />
              {form.produk?.data?.keterangan && (
                <small className="text-muted">
                  Keterangan: {form.produk.data.keterangan}
                </small>
              )}
            </FormGroup>
          </Col>
          <Col md="3">
            <FormGroup>
              <Label>Catatan/Varian</Label>
              <Input
                value={form.catatan}
                onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
              />
            </FormGroup>
          </Col>
          <Col md="1">
            <FormGroup>
              <Label>Jumlah *</Label>
              <Input
                type="number"
                value={form.jumlah}
                onChange={e=>handleJumlahChange(e.target.value)}
              />
            </FormGroup>
          </Col>
          <Col md="2">
            <FormGroup>
              <Label>Total Bayar</Label>
              <Input readOnly value={form.bayar?`Rp${Number(form.bayar).toLocaleString()}`:''} />
            </FormGroup>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md="4">
            <Input
              placeholder="🔍 Cari apa aja..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col md="4">
            <Select
              options={uniquePemesanOptions}
              isClearable
              isSearchable
              placeholder="🔽 Filter pemesan"
              value={selectedPemesan}
              onChange={setSelectedPemesan}
            />
          </Col>
          <Col md="4" className="text-end">
            <Button color="danger" className="me-3" onClick={() => {
              setSearchText('')
              setSelectedPemesan(null)
            }}>
              Reset Filter
            </Button>
            <Button type="submit" color="primary">
              {editIndex!==null?'Update':'Tambah'}
            </Button>
          </Col>
        </Row>
      </Form>

      <div className="border">
        <DataTable
          columns={columns}
          data={filtered}
          pagination
          noDataComponent="Belum ada data"
          highlightOnHover
          responsive
        />
      </div>
    </div>
  )
}

export default Week