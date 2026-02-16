
import { Metadata } from 'next';
import ClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Optimization Meta Setup for The Multiple | Black Affiliate',
  description: 'Case study: How we helped an in-house media buying team reduce CPA from $600+ to ~$250 per FTD through deep system audit and CIS methodologies.',
  openGraph: {
    title: 'Optimization Meta Setup for The Multiple | Black Affiliate',
    description: 'Case study: Reducing CPA from $600+ to ~$250 per FTD.',
    type: 'article',
  },
};

export default function MultipleCaseStudyPage() {
  return <ClientPage />;
}
