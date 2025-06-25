import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Label, Form, FormGroup, FormFeedback, Card, CardBody, CardTitle, Container, Row, Col } from 'reactstrap'

const Login = () => {
  const { login, userList } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const handleLogin = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nama wajib diisi')
      return
    }
    try {
      login(name.trim())
      navigate('/dashboard')
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
              <CardTitle tag="h3" className="mb-4 text-center">Login</CardTitle>
              <Form onSubmit={handleLogin}>
                <FormGroup>
                  <Label>Nama</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    invalid={!!error}
                    placeholder="Masukkan nama"
                    list="name-suggestions"
                  />
                  <datalist id="name-suggestions">
                    {userList.map((user, i) => (
                      <option key={i} value={user.name} />
                    ))}
                  </datalist>
                  {error && <FormFeedback>{error}</FormFeedback>}
                </FormGroup>
                <Button color="primary" type="submit" block>Masuk</Button>
              </Form>
              <div className="text-center mt-3">
                Belum punya akun? <Link to="/register">Daftar di sini</Link>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Login