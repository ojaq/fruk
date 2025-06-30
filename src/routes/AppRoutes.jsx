import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Week from '../pages/Week'
import CustomerInvoice from '../pages/CustomerInvoice'
import SupplierInvoice from '../pages/SupplierInvoice'
import MasterSupplier from '../pages/MasterSupplier'
import DataSupplier from '../pages/DataSupplier'
import PrivateRoutes from './PrivateRoutes'

const AppRoutes = () => {
  return (
    <Routes>
      {/* public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/invoice-customer/:num" element={<CustomerInvoice />} />

      {/* protected routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoutes>
            <Dashboard />
          </PrivateRoutes>
        }
      />
      <Route
        path="/data-supplier"
        element={
          <PrivateRoutes>
            <MasterSupplier />
          </PrivateRoutes>
        }
      />
      <Route
        path="/data-supplier/:user"
        element={
          <PrivateRoutes>
            <DataSupplier />
          </PrivateRoutes>
        }
      />
      <Route
        path="/week/:num?"
        element={
          <PrivateRoutes>
            <Week />
          </PrivateRoutes>
        }
      />
      <Route
        path="/customer-invoice/:num?"
        element={
          <PrivateRoutes>
            <CustomerInvoice />
          </PrivateRoutes>
        }
      />
      <Route
        path="/supplier-invoice/:num?"
        element={
          <PrivateRoutes>
            <SupplierInvoice />
          </PrivateRoutes>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default AppRoutes