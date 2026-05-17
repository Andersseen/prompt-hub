import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import Home from './index.page';

describe('Home page', () => {
  it('renders the local-first dashboard shell', async () => {
    await render(Home);

    expect(await screen.findByText('Prompt Hub')).toBeInTheDocument();
    expect(screen.getByText('Define once. Reuse anywhere.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agents' })).toBeInTheDocument();
  });
});
