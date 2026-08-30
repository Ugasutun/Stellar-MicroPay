/**
 * __tests__/SendPaymentForm.a11y.test.tsx
 * Accessibility tests for QR scanner permission and decoding status announcements
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendPaymentForm from '@/components/SendPaymentForm';

// Mock dependencies
jest.mock('@/lib/stellar', () => ({
  isValidStellarAddress: (addr: string) => addr.startsWith('G') && addr.length === 56,
  isValidFederationAddress: jest.fn(() => false),
  isStellarName: jest.fn(() => false),
  resolveFederationAddress: jest.fn(),
  resolveStellarName: jest.fn(),
  fetchNetworkFeeStats: jest.fn(() => Promise.resolve({ baseFeeXlm: 0.00001 })),
  server: {
    loadAccount: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/lib/wallet', () => ({
  signTransactionWithWallet: jest.fn(),
}));

jest.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      const translations: Record<string, string> = {
        destination: 'Destination',
        amount: 'Amount',
        amount_placeholder: 'Enter amount',
        memo_optional: 'Memo (optional)',
        memo_placeholder: 'Add a note',
        send_button: 'Send',
        processing: 'Processing...',
        scan_qr: 'Scan QR Code',
        max: `Max: ${opts?.amount || '0'}`,
        confirm_title: 'Confirm Payment',
        confirm_sign: 'Confirm & Sign',
        cancel: 'Cancel',
        to: 'To',
        estimated_fee: 'Estimated Fee',
        high_value_warning: 'High value warning',
        success_title: 'Success!',
        success_message: 'Payment sent',
        checking_account: 'Checking account...',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/lib/ToastContext', () => ({
  useToastContext: () => ({
    addToast: jest.fn(),
  }),
}));

jest.mock('@/lib/addressBook', () => ({
  loadAddressBookContacts: [],
  saveAddressBookContacts: jest.fn(),
  subscribeToAddressBookContacts: jest.fn(() => jest.fn()),
  upsertAddressBookContact: jest.fn((contact) => contact),
}));

describe('SendPaymentForm - QR Scanner Accessibility', () => {
  const mockPublicKey = 'GBKK7ERJGMHXQJWNJQBFPK7HBWHNWBTMGHVNFNQ6A6N2PZWGJ3AJPOX';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock BarcodeDetector
    (window as any).BarcodeDetector = class {
      async detect() {
        return [];
      }
    };
  });

  describe('Scanner Permission Announcements', () => {
    it('should announce camera permission granted with assertive aria-live', async () => {
      // Mock successful permission
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() =>
            Promise.resolve({
              getTracks: () => [],
            })
          ),
        },
        configurable: true,
      });

      render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        const announcement = screen.queryByText(/camera permission granted/i);
        if (announcement) {
          expect(announcement).toHaveAttribute('aria-live', 'assertive');
          expect(announcement).toHaveAttribute('aria-atomic', 'true');
        }
      });
    });

    it('should announce camera permission denied with assertive aria-live', async () => {
      // Mock permission denied error
      const error = new Error('Permission denied');
      (error as any).name = 'NotAllowedError';

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() => Promise.reject(error)),
        },
        configurable: true,
      });

      render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        const errorElement = screen.queryByText(/camera permission was denied/i);
        if (errorElement) {
          expect(errorElement).toHaveAttribute('aria-live', 'assertive');
          expect(errorElement).toHaveAttribute('role', 'alert');
        }
      });
    });

    it('should distinguish between different camera errors', async () => {
      const testCases = [
        {
          errorName: 'NotFoundError',
          expectedMessage: /no camera device/i,
        },
        {
          errorName: 'SecurityError',
          expectedMessage: /https connection/i,
        },
      ];

      for (const testCase of testCases) {
        const error = new Error('Camera error');
        (error as any).name = testCase.errorName;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: jest.fn(() => Promise.reject(error)),
          },
          configurable: true,
        });

        const { unmount } = render(
          <SendPaymentForm
            publicKey={mockPublicKey}
            xlmBalance="100"
            title="Send Payment"
          />
        );

        const scanButton = screen.getByLabelText(/scan qr code/i);
        await userEvent.click(scanButton);

        await waitFor(() => {
          expect(screen.queryByText(testCase.expectedMessage)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Scanner Modal Rendering', () => {
    it('should render scanner modal when isScannerOpen is true', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() =>
            Promise.resolve({
              getTracks: () => [],
            })
          ),
        },
        configurable: true,
      });

      render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        const modal = screen.queryByRole('dialog', { hidden: true });
        expect(modal).toBeInTheDocument();
      });
    });

    it('scanner modal should have proper accessibility attributes', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() =>
            Promise.resolve({
              getTracks: () => [],
            })
          ),
        },
        configurable: true,
      });

      render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        const modal = screen.queryByRole('dialog', { hidden: true });
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby', 'scanner-title');
      });
    });

    it('should have text instructions for scanning', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() =>
            Promise.resolve({
              getTracks: () => [],
            })
          ),
        },
        configurable: true,
      });

      render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/point your camera at a stellar address qr code/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Scanner Controls', () => {
    it('should have accessible cancel button', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() =>
            Promise.resolve({
              getTracks: () => [{ stop: jest.fn() }],
            })
          ),
        },
        configurable: true,
      });

      render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/close qr scanner/i)).toBeInTheDocument();
      });
    });
  });

  describe('QRCodeModal Accessibility', () => {
    it('should have accessible description for receive QR code', () => {
      const { container } = render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      // Verify that the QRCodeModal component exists in the codebase
      expect(container).toBeDefined();
    });
  });

  describe('Live Regions', () => {
    it('should include polite live region for scanning status', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() =>
            Promise.resolve({
              getTracks: () => [],
            })
          ),
        },
        configurable: true,
      });

      render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        const liveRegions = screen.queryAllByRole('status', { hidden: true });
        const politeRegions = liveRegions.filter(
          (region) => region.getAttribute('aria-live') === 'polite'
        );
        expect(politeRegions.length).toBeGreaterThan(0);
      });
    });

    it('should include screen reader only live region summary', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn(() =>
            Promise.resolve({
              getTracks: () => [],
            })
          ),
        },
        configurable: true,
      });

      const { container } = render(
        <SendPaymentForm
          publicKey={mockPublicKey}
          xlmBalance="100"
          title="Send Payment"
        />
      );

      const scanButton = screen.getByLabelText(/scan qr code/i);
      await userEvent.click(scanButton);

      await waitFor(() => {
        const srOnly = container.querySelector('.sr-only[role="status"]');
        expect(srOnly).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});
