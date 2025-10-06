import { Navbar, Container } from 'react-bootstrap';

export const Footer: React.FC = () => {
  return (
    <Navbar bg="dark" variant="dark" className="mt-auto py-3" fixed="bottom">
      <Container className="justify-content-end">
        <Navbar.Text>
          &copy; 2025 Movie Tracker
        </Navbar.Text>
      </Container>
    </Navbar>
  );
};
