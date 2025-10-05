import { Navbar, Container, Nav } from 'react-bootstrap';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Navbar bg="dark" variant="dark" className="mt-auto py-3" fixed="bottom" expand="lg">
      <Container>
        <Navbar.Brand>🎬 Movie Tracker</Navbar.Brand>
        <Navbar.Toggle aria-controls="footer-nav" />
        <Navbar.Collapse id="footer-nav">
          <Nav className="ms-auto">
            <Nav.Link href="/">Home</Nav.Link>
            <Nav.Link href="/my-movies">My Movies</Nav.Link>
          </Nav>
          <Navbar.Text className="ms-3">
            &copy; {currentYear} Movie Tracker | Powered by TMDB API
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
