import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import DataTable from 'react-data-table-component'
import { Row, Col, Input, Button } from 'reactstrap'

const MasterSupplier = () => {
  const { productData, registeredUsers } = useAuth()
  const [combinedData, setCombinedData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterJenis, setFilterJenis] = useState('')

  useEffect(() => {
    const all = []

    Object.entries(productData).forEach(([username, items]) => {
      const user = registeredUsers.find(u => u.name === username)
      if (!user) return

      items.forEach(item => {
        if (item.aktif) {
          all.push({
            ...item,
            namaSupplier: item.namaSupplier || user.profile?.namaSupplier || user.name,
            namaBank: item.namaBank,
            namaPenerima: item.namaPenerima,
            noRekening: item.noRekening
          })
        }
      })
    })

    setCombinedData(all)
  }, [productData, registeredUsers])

  const columns = [
    { name: 'No', selector: (row, i) => i + 1, width: '60px' },
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
    { name: 'No Rekening', selector: row => row.noRekening, wrap: true }
  ]

  const filtered = combinedData.filter(item => {
    const matchesSearch = Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )

    const matchesSupplier = filterSupplier ? item.namaSupplier === filterSupplier : true
    const matchesJenis = filterJenis ? item.jenisProduk === filterJenis : true

    return matchesSearch && matchesSupplier && matchesJenis
  })

  const supplierOptions = [...new Set(combinedData.map(d => d.namaSupplier))]
  const jenisOptions = [...new Set(combinedData.map(d => d.jenisProduk))]

  return (
    <div className="mt-4" style={{ margin: '0 100px' }}>
      <Row className="mb-3">
        <Col md="6">
          <h4>Master Data Supplier</h4>
        </Col>
        <Col md="6" className="text-end">
          <Button color="danger" className="me-3" onClick={() => {
            setSearchText('')
            setFilterSupplier('')
            setFilterJenis('')
          }}>
            Reset Filter
          </Button>
          <Button color="warning" onClick={() => window.history.back()}>
            Kembali
          </Button>
        </Col>
      </Row>

      <Row className="mt-3 mb-4">
        <Col md="4">
          <Input
            placeholder="🔍 Cari apa aja..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </Col>
        <Col md="4">
          <Input
            type="select"
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
          >
            <option value="">🔽 Filter Supplier</option>
            {supplierOptions.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </Input>
        </Col>
        <Col md="4">
          <Input
            type="select"
            value={filterJenis}
            onChange={e => setFilterJenis(e.target.value)}
          >
            <option value="">🔽 Filter Jenis</option>
            {jenisOptions.map((j, i) => (
              <option key={i} value={j}>{j}</option>
            ))}
          </Input>
        </Col>
      </Row>

      <div className="border">
        <DataTable
          columns={columns}
          data={filtered}
          pagination
          noDataComponent="Belum ada data supplier aktif"
          responsive
          highlightOnHover
        />
      </div>
    </div>
  )
}

export default MasterSupplier