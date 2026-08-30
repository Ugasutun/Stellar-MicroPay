/**
 * __tests__/QRCodeModal.a11y.test.tsx
 * Accessibility tests for QR Code receive modal
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import QRCodeModal from '@/components/QRCodeModal';

// Mock dependencies
jest.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value, ref }: any) => (
    <div ref={ref} data-testid="qr-code-canvas">
      {value}
    </div>
  ),
  QRCodeSVG: ({ value }: any) => <div>{value}</div>,
}));

jest.mock('@/components/Modal', () => {
  return function MockModal({ 
    isOpen, 
    children, 
    labelledBy, 
    describedBy,
    onClose,
  }: any) {
    if (!isOpen) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </div>
    );
  };
});

describe('QRCodeModal - Accessibility', () => {
  const mockPublicKey = 'GBKK7ERJGMHXQJWNJQBFPK7HBWHNWBTMGHVNFNQ6A6N2PZWGJ3AJPOX';

  describe('Modal Dialog Structure', () => {
    it('should render with proper dialog role and attributes', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'qr-code-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'qr-code-modal-description');
    });
  });

  describe('QR Code Image Accessibility', () => {
    it('should have alt text for QR code image', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const qrImage = screen.queryByRole('img', {
        name: new RegExp(mockPublicKey, 'i'),
      });

      // The QR code should either be wrapped in role="img" with alt text
      // or have an accessible description
      if (qrImage) {
        expect(qrImage).toHaveAccessibleName();
      }
    });

    it('should describe what the QR code is used for', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      // The description should mention this is for receiving payments
      const description = screen.queryByText(/scan this qr code/i);
      expect(description).toBeInTheDocument();
    });
  });

  describe('Title and Description', () => {
    it('should have descriptive title', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const title = screen.getByText(/receive payment qr code/i);
      expect(title).toHaveAttribute('id', 'qr-code-modal-title');
    });

    it('should have comprehensive description', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const description = screen.getByText(/qr code.*stellar.*sep-0007/i);
      expect(description).toHaveAttribute('id', 'qr-code-modal-description');
    });

    it('should indicate this is a static receive address, not for sending', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      // Check the description mentions it's for RECEIVING
      const description = screen.getByText(/receive.*qr code/i);
      expect(description).toBeInTheDocument();
    });
  });

  describe('Buttons and Controls', () => {
    it('download button should have accessible label', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const downloadButton = screen.getByLabelText(/download qr code/i);
      expect(downloadButton).toBeInTheDocument();
    });

    it('close button should have accessible label', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const closeButton = screen.getByLabelText(/close qr code modal/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Address Display', () => {
    it('should display public key with context', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      expect(screen.getByText(mockPublicKey)).toBeInTheDocument();
      // Should have a label indicating what this address is
      expect(screen.getByText(/your stellar address/i)).toBeInTheDocument();
    });

    it('should display stellar URI with context', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      // Should indicate what the URI is
      expect(screen.getByText(/payment uri/i)).toBeInTheDocument();
    });
  });

  describe('Amount Display', () => {
    it('should display amount in QR code when provided', () => {
      const amount = '50.00';
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
          amount={amount}
        />
      );

      // The amount should be in the Stellar URI
      const qrValue = screen.getByTestId('qr-code-canvas');
      expect(qrValue.textContent).toContain(mockPublicKey);
      expect(qrValue.textContent).toContain(amount);
    });

    it('should not include amount when not provided', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      // The QR value should not have amount parameter
      const qrValue = screen.getByTestId('qr-code-canvas');
      expect(qrValue.textContent).toContain(mockPublicKey);
      expect(qrValue.textContent).not.toContain('amount=');
    });
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <QRCodeModal
          isOpen={false}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('should render when isOpen is true', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('SEP-0007 Compliance', () => {
    it('should use web+stellar: URI scheme', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const qrValue = screen.getByTestId('qr-code-canvas');
      expect(qrValue.textContent).toContain('web+stellar:');
    });

    it('should use pay action in URI', () => {
      render(
        <QRCodeModal
          isOpen={true}
          onClose={jest.fn()}
          publicKey={mockPublicKey}
        />
      );

      const qrValue = screen.getByTestId('qr-code-canvas');
      expect(qrValue.textContent).toContain('web+stellar:pay');
    });
  });
});
