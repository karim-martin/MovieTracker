import { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { movieAPI, userAPI } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalMovies: 0, totalUsers: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [moviesRes, usersRes] = await Promise.all([
        movieAPI.getAllMovies(),
        userAPI.getAllUsers(),
      ]);
      setStats({
        totalMovies: moviesRes.data.pagination?.total || moviesRes.data.movies.length,
        totalUsers: usersRes.data.users.length,
      });
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Total Movies</Card.Title>
              <h2>{stats.totalMovies}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Total Users</Card.Title>
              <h2>{stats.totalUsers}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
