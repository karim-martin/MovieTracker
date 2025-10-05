import { Navbar, Nav, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

export const Navigation: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4" sticky="top">
      <Container>
        <Navbar.Brand href="/">🎬 Movie Tracker</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {isAuthenticated ? (
              <>
                <Nav.Link href="/">Home</Nav.Link>
                <Nav.Link href="/my-movies">My Movies</Nav.Link>
                <Nav.Link href="/collections">Collections</Nav.Link>
                {isAdmin && (
                  <>
                    <Nav.Link href="/admin">Admin Dashboard</Nav.Link>
                    <Nav.Link href="/admin/movies">Manage Movies</Nav.Link>
                    <Nav.Link href="/admin/users">Manage Users</Nav.Link>
                  </>
                )}
                <Nav.Link onClick={handleLogout} className="text-danger">
                  Logout ({user?.username})
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link href="/login">Login</Nav.Link>
                <Nav.Link href="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
