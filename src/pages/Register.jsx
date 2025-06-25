import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Label, FormGroup, Form, FormFeedback, Card, CardBody, CardTitle, Container, Row, Col } from 'reactstrap'

  const Register = () => {
    const { register, userList } = useAuth()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [role, setRole] = useState('supplier')
    const [error, setError] = useState(null)

    const handleRegister = (e) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setError('Nama wajib diisi')
      return
    }

    const alreadyExists = userList.some(u => u.name.toLowerCase() === trimmed.toLowerCase())
    if (alreadyExists) {
      setError('Nama sudah digunakan')
      return
    }

    try {
      register(trimmed, role)
      navigate('/login')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Row>
        <Col>
          <Card style={{ minWidth: 350 }}>
            <CardBody>
              <CardTitle tag="h3" className="mb-4 text-center">Register</CardTitle>
              <Form onSubmit={handleRegister}>
                <FormGroup>
                  <Label>Nama</Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError(null)
                    }}
                    invalid={!!error}
                    placeholder="Nama pengguna"
                  />
                  {error && <FormFeedback>{error}</FormFeedback>}
                </FormGroup>
                <FormGroup>
                  <Label>Role</Label>
                  <Input type="select" value={role} disabled>
                    <option value="supplier">Supplier</option>
                  </Input>
                </FormGroup>
                <Button color="primary" type="submit" block>Daftar</Button>
              </Form>
              <div className="text-center mt-3">
                Sudah punya akun? <Link to="/login">Masuk di sini</Link>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Register