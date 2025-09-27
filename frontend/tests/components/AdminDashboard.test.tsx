import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../../../src/components/AdminDashboard';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('AdminDashboard Component', () => {
  it('should render the dashboard title', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
