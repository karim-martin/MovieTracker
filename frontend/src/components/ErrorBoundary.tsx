import { Component, ErrorInfo, ReactNode } from 'react';
import { Modal, Button, Container } from 'react-bootstrap';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error;}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.replace('/');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Modal show={true} onHide={this.handleReset} centered backdrop="static">
            <Modal.Header className="bg-danger text-white">
              <Modal.Title>Application Error</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-0"> <strong>Something went wrong:</strong> </p>
              <p className="text-muted mt-2"> {this.state.error?.message || 'An unexpected error occurred'} </p>
              <p className="mt-3 mb-0"> The application will be reset when you close this dialog. </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onClick={this.handleReset}> Reset Application </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      );
    }

    return this.props.children;
  }
}
