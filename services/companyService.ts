
import { CompanyProfile } from '../types';
import { StorageService } from './storageService';

const MOCK_DB: CompanyProfile[] = [
  {
    id: 'vodacom',
    name: 'Vodacom SA',
    industry: 'Telecommunications',
    trustScore: 42,
    totalContractsAnalyzed: 1240,
    commonTraps: [
      'Automatic price increase of CPI + 5%',
      '24-month lock-in with high cancellation fees (approx 75% of remaining balance)',
      'Data expires after 30 days despite CPA regulations'
    ],
    positiveTraits: ['Network coverage reliability'],
    userRatings: { negotiability: 1.5, transparency: 2.5 }
  },
  {
    id: 'mtn',
    name: 'MTN',
    industry: 'Telecommunications',
    trustScore: 45,
    totalContractsAnalyzed: 980,
    commonTraps: [
      'Strict credit vetting',
      'Difficult cancellation process (requires 30 days specific notice)',
      'Unilateral term changes'
    ],
    positiveTraits: ['Good device variety'],
    userRatings: { negotiability: 2.0, transparency: 3.0 }
  },
  {
    id: 'virgin_active',
    name: 'Virgin Active',
    industry: 'Health & Fitness',
    trustScore: 68,
    totalContractsAnalyzed: 3400,
    commonTraps: [
      '12-month rolling contract auto-renewal',
      'Joining fee often hidden in first month',
      'Cancellation requires medical certificate or relocation proof'
    ],
    positiveTraits: ['Clear facility rules', 'Standardized contracts'],
    userRatings: { negotiability: 1.0, transparency: 4.0 }
  },
  {
    id: 'planet_fitness',
    name: 'Planet Fitness',
    industry: 'Health & Fitness',
    trustScore: 35,
    totalContractsAnalyzed: 2100,
    commonTraps: [
      'Extremely difficult cancellation ("The Black Tag Trap")',
      'aggressive debt collection for missed months',
      'Phone calls recorded as verbal contracts'
    ],
    positiveTraits: ['Low entry price'],
    userRatings: { negotiability: 0.5, transparency: 1.5 }
  },
  {
    id: 'capitec',
    name: 'Capitec Bank',
    industry: 'Finance',
    trustScore: 88,
    totalContractsAnalyzed: 5600,
    commonTraps: [
      'Credit life insurance often optional but presented as mandatory',
      'High initiation fees on small loans'
    ],
    positiveTraits: ['Plain language contracts', 'Transparent fee structure', 'Easy digital signing'],
    userRatings: { negotiability: 1.0, transparency: 4.8 }
  },
  {
    id: 'standard_bank',
    name: 'Standard Bank',
    industry: 'Finance',
    trustScore: 72,
    totalContractsAnalyzed: 4100,
    commonTraps: [
      'Complex fee tiers',
      'Legacy clauses in old account types'
    ],
    positiveTraits: ['Solid regulatory compliance'],
    userRatings: { negotiability: 2.5, transparency: 3.5 }
  },
  {
    id: 'pam_golding',
    name: 'Pam Golding Properties',
    industry: 'Real Estate',
    trustScore: 78,
    totalContractsAnalyzed: 800,
    commonTraps: [
      'Strict damage deposit return policies',
      'Tenants liable for maintenance beyond fair wear and tear'
    ],
    positiveTraits: ['CPA compliant leases', 'Professional dispute resolution'],
    userRatings: { negotiability: 3.0, transparency: 4.2 }
  }
];

export const CompanyService = {
  search: (query: string): CompanyProfile[] => {
    const lowerQ = query.toLowerCase();
    const allCompanies = [...MOCK_DB, ...StorageService.getDiscoveredCompanies()];
    
    // Remove duplicates (prefer MOCK_DB if conflict, though IDs should theoretically differ)
    const uniqueMap = new Map();
    allCompanies.forEach(c => uniqueMap.set(c.id, c));
    const uniqueCompanies = Array.from(uniqueMap.values());

    return uniqueCompanies.filter(c => 
      c.name.toLowerCase().includes(lowerQ) || 
      c.industry.toLowerCase().includes(lowerQ)
    );
  },

  getAll: (): CompanyProfile[] => {
    const allCompanies = [...MOCK_DB, ...StorageService.getDiscoveredCompanies()];
    const uniqueMap = new Map();
    allCompanies.forEach(c => uniqueMap.set(c.id, c));
    return Array.from(uniqueMap.values());
  },

  getById: (id: string): CompanyProfile | undefined => {
    const all = CompanyService.getAll();
    return all.find(c => c.id === id);
  }
};
