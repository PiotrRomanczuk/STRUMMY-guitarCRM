// Mock lucide-react for Jest — the real package is pure ESM and can't be
// processed by babel-jest without a complex transitive-dep transform chain.
// Component tests don't need real icon rendering.
import React from 'react';

const Icon = (props: React.SVGProps<SVGSVGElement>) =>
  React.createElement('svg', { 'data-testid': 'icon', ...props });

const handler: ProxyHandler<object> = {
  get(_target, prop: string) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return {};
    return Icon;
  },
};

const lucideReactMock = new Proxy({}, handler);
export default lucideReactMock;
module.exports = lucideReactMock;
