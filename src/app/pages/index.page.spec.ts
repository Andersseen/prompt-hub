import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import Home from './index.page';

describe('Home page', () => {
  it('renders the local-first dashboard shell', async () => {
    await render(Home);

    expect(await screen.findByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Local-first prompt management')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agents' })).toBeInTheDocument();
  });
});
