import r2wc from 'react-to-webcomponent';
import React from 'react';
import ReactDOM from 'react-dom';
import { ErrorBoundary } from '../../../../_shared/error-boundary';
import { PlanPricingWidget } from './PlanPricingWidget';

const Wrapped = () => (
  <ErrorBoundary surface="widget">
    <PlanPricingWidget />
  </ErrorBoundary>
);

const PlanPricingTableElement = r2wc(Wrapped, React, ReactDOM);
customElements.define('plan-pricing-table', PlanPricingTableElement);

export default PlanPricingTableElement;
