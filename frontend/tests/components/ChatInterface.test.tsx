import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInterface from '../../../src/components/ChatInterface';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ id: 'ai-msg-1', sender: 'ai', content: 'AI response', timestamp: new Date() }),
  })
) as jest.Mock;

describe('ChatInterface Component', () => {
  it('should render the message input', () => {
    render(<ChatInterface />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('should send a message when the user presses Enter', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Wait for the AI response to be displayed
    const aiMessage = await screen.findByText('AI response');
    expect(aiMessage).toBeInTheDocument();
  });
});
