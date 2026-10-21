import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ProgressBarProvider } from 'react-transition-progress';
import messages from '@/messages/en.json';
import { CustomerDashboard } from './CustomerDashboard';
import { CustomerDashboardSkeleton } from './CustomerDashboardSkeleton';
import { WordPressUser, WooCommerceCustomer } from '@/lib/woocommerce/types';
import { logoutAction } from '@/app/login/actions';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/account',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock logout action
jest.mock('@/app/login/actions', () => ({
  logoutAction: jest.fn().mockResolvedValue({ success: true }),
}));

const mockUser: WordPressUser = {
  id: 'user_123',
  databaseId: 42,
  name: 'Jane Doe',
  email: 'jane@example.com',
};

const mockCustomer: WooCommerceCustomer = {
  id: 'cust_123',
  databaseId: 42,
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  billing: {
    firstName: 'Jane',
    lastName: 'Doe',
    address1: '123 Commerce St',
    city: 'Metropolis',
    country: 'US',
    phone: '+1 555-0100',
    email: 'jane@example.com',
  },
  orders: {
    nodes: [
      {
        id: 'ord_1',
        orderNumber: '1001',
        status: 'completed',
        total: '$150.00',
        date: '2026-03-15T10:00:00Z',
      },
    ],
  },
};

function renderWithIntl(ui: React.ReactNode, locale = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ProgressBarProvider>
        {ui}
      </ProgressBarProvider>
    </NextIntlClientProvider>
  );
}

describe('CustomerDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders customer profile information and active session badge', () => {
    renderWithIntl(<CustomerDashboard user={mockUser} customer={mockCustomer} />);

    expect(
      screen.getByRole('heading', { name: 'Jane Doe', level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Customer ID: #42/i)).toBeInTheDocument();
    expect(screen.getByText('Active Session')).toBeInTheDocument();
  });

  it('renders billing address details when available', () => {
    renderWithIntl(<CustomerDashboard user={mockUser} customer={mockCustomer} />);

    expect(screen.getByText('Billing Address')).toBeInTheDocument();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/123 Commerce St/i)).toBeInTheDocument();
    expect(screen.getByText(/Metropolis/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone: \+1 555-0100/i)).toBeInTheDocument();
  });

  it('renders fallback notice when billing address is not recorded', () => {
    const customerWithoutBilling: WooCommerceCustomer = {
      ...mockCustomer,
      billing: undefined,
    };

    renderWithIntl(<CustomerDashboard user={mockUser} customer={customerWithoutBilling} />);

    expect(
      screen.getByText('No billing address recorded yet.')
    ).toBeInTheDocument();
  });

  it('renders order history when orders exist', () => {
    renderWithIntl(<CustomerDashboard user={mockUser} customer={mockCustomer} />);

    expect(screen.getByText('Recent Orders (1)')).toBeInTheDocument();
    expect(screen.getByText('Order #1001')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('renders fallback notice when order history is empty', () => {
    const customerWithoutOrders: WooCommerceCustomer = {
      ...mockCustomer,
      orders: { nodes: [] },
    };

    renderWithIntl(<CustomerDashboard user={mockUser} customer={customerWithoutOrders} />);

    expect(
      screen.getByText('No orders found in your account history.')
    ).toBeInTheDocument();
  });

  it('calls logoutAction when logout button is clicked', async () => {
    renderWithIntl(<CustomerDashboard user={mockUser} customer={mockCustomer} />);

    const logoutButton = screen.getByRole('button', { name: /Log Out/i });
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);
    expect(logoutAction).toHaveBeenCalledTimes(1);
  });

  it('renders CustomerDashboardSkeleton with matching structure and a11y labels', () => {
    renderWithIntl(<CustomerDashboardSkeleton />);

    const skeleton = screen.getByTestId('customer-dashboard-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });
});
