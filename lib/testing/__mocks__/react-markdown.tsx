// Mock react-markdown for Jest — the real package and its deps are pure ESM.
// Component tests don't need real markdown rendering.
import React from 'react';

interface Props {
  children?: React.ReactNode;
}

const ReactMarkdown = ({ children }: Props) => React.createElement('div', null, children);

export default ReactMarkdown;
