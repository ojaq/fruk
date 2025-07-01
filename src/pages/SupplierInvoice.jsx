import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Row, Col, Card, CardHeader, CardBody, Input, CardFooter } from 'reactstrap'
import DataTable from 'react-data-table-component'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Select from 'react-select'

const SupplierInvoice = () => {
  const { num } = useParams()
  const { weekData, productData, registeredUsers } = useAuth()
  const sheetNames = num ? [`W${num}`] : Object.keys(weekData).filter(k => /^W\d+/.test(k))
  const [grouped, setGrouped] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  useEffect(() => {
    const raw = sheetNames.flatMap(name => weekData[name] || [])
    const supplierMap = {}

    raw.forEach(row => {
      const produkKey = row.produkLabel
      const pemesan = row.pemesan
      const jumlah = Number(row.jumlah)

      let found = null
      Object.entries(productData).forEach(([user, items]) => {
        items.forEach(item => {
          const label = `${item.namaProduk} ${item.ukuran} ${item.satuan}`
          if (label === produkKey && item.aktif) {
            found = {
              supplier: item.namaSupplier || user,
              produk: label,
              hpp: Number(item.hpp),
              key: label,
              keterangan: item.keterangan
            }
          }
        })
      })

      if (!found) return

      const fullKey = `${found.supplier}|${found.key}`

      if (!supplierMap[fullKey]) {
        supplierMap[fullKey] = {
          namaSupplier: found.supplier,
          produk: found.produk + (row.keterangan ? ` (${row.keterangan})` : ''),
          pemesanList: {},
          jumlah: 0,
          hpp: found.hpp
        }
      }

      supplierMap[fullKey].jumlah += jumlah
      supplierMap[fullKey].pemesanList[pemesan] = (supplierMap[fullKey].pemesanList[pemesan] || 0) + jumlah
    })

    const bySupplier = {}

    Object.values(supplierMap).forEach(item => {
      const entry = {
        ...item,
        total: item.jumlah * item.hpp,
        pemesanCombined: Object.entries(item.pemesanList)
          .map(([name, qty]) => `${name}(${qty})`).join(', ')
      }

      if (!bySupplier[item.namaSupplier]) bySupplier[item.namaSupplier] = []
      bySupplier[item.namaSupplier].push(entry)
    })

    const arr = Object.entries(bySupplier).map(([supplier, list], i) => {
      const totalQty = list.reduce((a, b) => a + b.jumlah, 0)
      const totalHarga = list.reduce((a, b) => a + b.total, 0)
      return {
        id: i + 1,
        supplier,
        items: list,
        totalQty,
        totalHarga
      }
    })

    setGrouped(arr.sort((a, b) => a.supplier.toLowerCase().localeCompare(b.supplier.toLowerCase())))
  }, [weekData, productData, sheetNames])

  const sendInvoice = (supplier, items, weekNum) => {
    const date = new Date()
    const todayStr = date.toISOString().split('T')[0]
    const dueDate = new Date(date)
    dueDate.setDate(dueDate.getDate() + 2)
    const dueStr = dueDate.toISOString().split('T')[0]

    const doc = new jsPDF('p', 'mm', 'a4')
    const logoUrl = '/logo.jpeg'

    const img = new Image()
    img.src = logoUrl
    img.onload = () => {
      doc.addImage(img, 'JPEG', 10, 10, 40, 40)

      doc.setFontSize(26)
      doc.setFont('helvetica', 'bold')
      const title = `Supplier Invoice - ${supplier} ${weekNum ? `Minggu ke-${weekNum}` : 'Semua Minggu'}`
      const wrapped = doc.splitTextToSize(title, 120)

      wrapped.forEach((line, i) => {
        doc.text(line, 195, 20 + (i * 10), { align: 'right' })
      })

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Tanggal: ${todayStr}`, 195, 50, { align: 'right' })
      doc.text(`Jatuh Tempo: ${dueStr}`, 195, 60, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      const totalBayar = items.reduce((a, b) => a + Number(b.total), 0)
      doc.text(`Balance Due: Rp${totalBayar.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`, 195, 70, { align: 'right' })

      doc.setFontSize(10)
      doc.text('Bazaar FRUK', 15, 50)
      doc.setFont('helvetica', 'normal')
      doc.text('Indonesia', 15, 55)
      doc.text('desofita@gmail.com', 15, 60)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(`Untuk: ${supplier}`, 15, 70)

      const table = []
      let totalQty = 0

      table.push(['Produk', 'Pemesan', 'Jumlah', 'Harga Satuan', 'Total Bayar'])

      items.forEach(item => {
        const qty = Number(item.jumlah)
        const unit = Number(item.hpp)
        const total = Number(item.total)

        table.push([
          item.produk,
          item.pemesanCombined,
          qty,
          `Rp${unit.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`,
          `Rp${total.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
        ])

        totalQty += qty
      })

      table.push([
        'TOTAL',
        '',
        totalQty,
        '',
        `Rp${totalBayar.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
      ])

      autoTable(doc, {
        startY: 78,
        head: [table[0]],
        body: table.slice(1),
        styles: {
          fontSize: 9,
          cellPadding: 2,
          fillColor: [255, 255, 255]
        },
        headStyles: {
          fillColor: [224, 224, 224],
          textColor: 20
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        didParseCell: data => {
          if (data.row.index === table.length - 2) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [224, 224, 224]
          }
        }
      })

      const finalY = doc.lastAutoTable.finalY || 100

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Catatan:', 15, finalY + 10)
      doc.text(`Invoice untuk ${weekNum ? `minggu ke-${weekNum}` : 'semua minggu'}`, 15, finalY + 15)

      const matchedUser = registeredUsers.find(
        u => u.profile?.namaSupplier?.trim().toLowerCase() === supplier.trim().toLowerCase()
      )
      const paymentLine = matchedUser?.profile
      ? `Pembayaran dapat dilakukan melalui:\n${matchedUser.profile.namaBank?.toUpperCase() || '-'} - ${matchedUser.profile.noRekening || '-'}\n${matchedUser.profile.namaPenerima || '-'}`
      : 'Pembayaran dapat dilakukan melalui:\n-'

      doc.text(paymentLine, 15, finalY + 25)

      doc.save(`Supplier Invoice - ${supplier} ${weekNum ? `Minggu ke-${weekNum}` : 'Semua Minggu'}.pdf`)
    }
  }

  const generateInvoiceSheet = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    let y = 20

    doc.setFontSize(14)
    doc.text(`Supplier Invoice - ${num ? `Minggu ${num}` : 'Semua Minggu'}`, 14, y)
    y += 5

    const table = []
    table.push(['No', 'Nama Supplier', 'Produk', 'Pemesan', 'Jumlah', 'Harga Satuan', 'Total Harga'])

    let no = 1
    let grandTotalQty = 0
    let grandTotal = 0

    grouped.forEach(group => {
      let firstRow = true

      group.items.forEach(item => {
        table.push([
          firstRow ? no : '',
          firstRow ? group.supplier : '',
          item.produk,
          item.pemesanCombined,
          item.jumlah,
          `Rp${item.hpp.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`,
          `Rp${item.total.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
        ])
        firstRow = false
      })

      table.push([
        '',
        `${group.supplier} Total`,
        '',
        '',
        group.totalQty,
        '',
        `Rp${group.totalHarga.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
      ])

      grandTotalQty += group.totalQty
      grandTotal += group.totalHarga
      no++
    })

    table.push([
      '',
      'TOTAL',
      '',
      '',
      grandTotalQty,
      '',
      `Rp${grandTotal.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
    ])

    autoTable(doc, {
      startY: y,
      head: [table[0]],
      body: table.slice(1),
      styles: {
        fontSize: 9,
        cellPadding: 2,
        fillColor: [255, 255, 255]
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: 20
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      didParseCell: data => {
        const txt = data.cell.raw?.toString().toLowerCase()
        if (txt?.includes('total')) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })

    doc.save(`Supplier-Invoice-${num ? `Minggu-${num}` : 'Semua-Minggu'}.pdf`)
  }

  const filteredGrouped = grouped.filter(group => {
    const matchSupplier = selectedSupplier ? group.supplier === selectedSupplier.value : true
    const matchSearch = searchText
      ? group.items.some(item =>
          Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchText.toLowerCase())
          )
        )
      : true

    return matchSupplier && matchSearch
  })

  return (
    <div className="container-fluid mt-4 px-1 px-sm-3 px-md-5">
      <Row className="mb-3">
        <Col xs="12" md="6">
          <h4>Supplier Invoice - {num ? `Minggu ${num}` : 'Semua Minggu'}</h4>
        </Col>
        <Col xs="12" md="6" className="text-end mt-2 mt-md-0">
          <Button color="warning" onClick={() => window.history.back()}>
            Kembali
          </Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col xs="12" md="4" className="mb-2 mb-md-0">
          <Input
            placeholder="🔍 Cari..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs="12" md="4" className="mb-2 mb-md-0">
          <Select
            options={grouped.map(g => ({ label: g.supplier, value: g.supplier }))}
            placeholder="🔽 Filter Supplier"
            isClearable
            isSearchable
            value={selectedSupplier}
            onChange={setSelectedSupplier}
          />
        </Col>
        <Col xs="6" md="2" className="mb-2 mb-md-0">
          <Button color="danger" onClick={() => {
            setSearchText('')
            setSelectedSupplier(null)
          }}>
            Reset Filter
          </Button>
        </Col>
        <Col xs="6" md="2" className="text-end">
          {grouped.length > 0 && (
            <Button
              color="success"
              onClick={() => generateInvoiceSheet()}
            >
              Generate All Invoice
            </Button>
          )}
        </Col>
      </Row>
      {filteredGrouped.map(group => (
        <Card key={group.id} className="mb-3">
          <CardHeader className="pt-3">
            <h5>{group.supplier}</h5>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-auto" style={{ minHeight: 200 }}>
              <DataTable
                columns={[
                  { name: 'Produk', selector: r => r.produk, wrap: true },
                  { name: 'Pemesan', selector: r => r.pemesanCombined, wrap: true },
                  { name: 'Jumlah', selector: r => r.jumlah, wrap: true },
                  { name: 'Harga Satuan', selector: r => `Rp${r.hpp.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`, wrap: true },
                  { name: 'Total Harga', selector: r => `Rp${r.total.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`, wrap: true }
                ]}
                data={group.items}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                highlightOnHover
                responsive
              />
            </div>
          </CardBody>
          <CardFooter className="py-3">
            <Row>
              <Col xs="12" md="6" className="text-start mb-2 mb-md-0">
                <strong>Total Qty:</strong> {group.totalQty} &nbsp; | &nbsp;
                <strong>Total:</strong> Rp{group.totalHarga.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </Col>
              <Col xs="12" md="6" className="text-end">
                <Button color="primary" size="sm" onClick={() => sendInvoice(group.supplier, group.items, num)}>
                  Generate Invoice {group.supplier}
                </Button>
              </Col>
            </Row>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default SupplierInvoice
