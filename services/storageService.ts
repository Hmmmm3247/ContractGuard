
import { ContractAnalysis, VaultContract, ChatMessage, CompanyProfile, CommunityReview, ReviewStatus, ContractVersion } from '../types';
import { CompanyService } from './companyService';

const KEYS = {
  VAULT: 'contractguard_vault',
  CHATS: 'contractguard_chats',
  WATCHLIST: 'contractguard_watchlist',
  REVIEWS: 'contractguard_reviews',
  DISCOVERED: 'contractguard_discovered_companies',
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const StorageService = {
  // --- Vault Operations ---
  getContracts: (): VaultContract[] => {
    const data = localStorage.getItem(KEYS.VAULT);
    return data ? JSON.parse(data) : [];
  },

  saveContract: (analysis: ContractAnalysis, thumbnail?: string): VaultContract => {
    const contracts = StorageService.getContracts();
    
    // Initial Version
    const initialVersion: ContractVersion = {
        versionId: generateId(),
        dateCreated: new Date().toISOString(),
        summary: analysis.summary,
        riskScore: analysis.riskScore,
        totalCost: analysis.totalCost,
        changesNote: 'Original Upload'
    };

    // Determine status and dates based on analysis strings (mock logic for demo)
    const newContract: VaultContract = {
      ...analysis,
      id: analysis.id || generateId(),
      dateAdded: new Date().toISOString(),
      status: 'ACTIVE',
      providerName: analysis.parties[0] || 'Unknown Provider',
      thumbnail: thumbnail, // Save thumbnail
      versions: [initialVersion]
    };

    // Parse duration to guess renewal date (very rough heuristic)
    if (analysis.duration && (analysis.duration.toLowerCase().includes('12 month') || analysis.duration.toLowerCase().includes('1 year'))) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        newContract.renewalDate = d.toISOString().split('T')[0];
    } else {
        newContract.renewalDate = '2025-01-01'; // Default placeholder
    }

    contracts.unshift(newContract);
    localStorage.setItem(KEYS.VAULT, JSON.stringify(contracts));
    return newContract;
  },

  addContractVersion: (parentId: string, analysis: ContractAnalysis, note: string = 'New Version'): VaultContract | null => {
      const contracts = StorageService.getContracts();
      const index = contracts.findIndex(c => c.id === parentId);
      
      if (index === -1) return null;

      const parent = contracts[index];
      
      // Create new version entry
      const newVersion: ContractVersion = {
          versionId: generateId(),
          dateCreated: new Date().toISOString(),
          summary: analysis.summary,
          riskScore: analysis.riskScore,
          totalCost: analysis.totalCost,
          changesNote: note
      };

      // Update the parent with the LATEST analysis data, but keep the ID and history
      const updatedContract: VaultContract = {
          ...parent,
          ...analysis, // Overwrite current view with new analysis
          id: parent.id, // Ensure ID stays same
          versions: [newVersion, ...parent.versions] // Prepend new version
      };

      contracts[index] = updatedContract;
      localStorage.setItem(KEYS.VAULT, JSON.stringify(contracts));
      return updatedContract;
  },

  revertToVersion: (parentId: string, versionId: string): VaultContract | null => {
    // In a real app, we would store the FULL analysis for every version.
    // For this demo, since we only store summary/score in history, we can't fully "revert" the analysis text/flags 
    // without bloating localStorage. 
    // We will just move the version record to the top to indicate it's active.
    return null; 
  },

  updateContract: (contract: VaultContract) => {
    const contracts = StorageService.getContracts();
    const index = contracts.findIndex(c => c.id === contract.id);
    if (index !== -1) {
      contracts[index] = contract;
      localStorage.setItem(KEYS.VAULT, JSON.stringify(contracts));
    }
  },

  deleteContract: (id: string) => {
    const contracts = StorageService.getContracts().filter(c => c.id !== id);
    localStorage.setItem(KEYS.VAULT, JSON.stringify(contracts));
  },

  getContractById: (id: string): VaultContract | undefined => {
    return StorageService.getContracts().find(c => c.id === id);
  },

  // --- Watchlist Operations ---
  getWatchlist: (): CompanyProfile[] => {
     const data = localStorage.getItem(KEYS.WATCHLIST);
     return data ? JSON.parse(data) : [];
  },

  toggleWatchlist: (company: CompanyProfile) => {
     const list = StorageService.getWatchlist();
     const exists = list.find(c => c.id === company.id);
     let newList;
     if (exists) {
        newList = list.filter(c => c.id !== company.id);
     } else {
        newList = [...list, company];
     }
     localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(newList));
     return !exists; // returns true if added
  },

  isInWatchlist: (id: string) => {
      const list = StorageService.getWatchlist();
      return list.some(c => c.id === id);
  },

  // --- Discovered Companies (Crowdsourced DB) ---
  getDiscoveredCompanies: (): CompanyProfile[] => {
      const data = localStorage.getItem(KEYS.DISCOVERED);
      return data ? JSON.parse(data) : [];
  },

  saveDiscoveredCompany: (company: CompanyProfile) => {
      const list = StorageService.getDiscoveredCompanies();
      // Avoid duplicates
      const exists = list.find(c => c.id === company.id);
      if (!exists) {
          list.push(company);
          localStorage.setItem(KEYS.DISCOVERED, JSON.stringify(list));
      }
  },

  // --- Chat Operations ---
  getChatHistory: (contractId: string): ChatMessage[] => {
    const allChats = localStorage.getItem(KEYS.CHATS);
    const parsed = allChats ? JSON.parse(allChats) : {};
    return parsed[contractId] || [];
  },

  saveChatMessage: (contractId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const allChatsStr = localStorage.getItem(KEYS.CHATS);
    const allChats = allChatsStr ? JSON.parse(allChatsStr) : {};
    
    if (!allChats[contractId]) {
      allChats[contractId] = [];
    }

    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    allChats[contractId].push(newMessage);
    localStorage.setItem(KEYS.CHATS, JSON.stringify(allChats));
    return newMessage;
  },
  
  clearChat: (contractId: string) => {
      const allChatsStr = localStorage.getItem(KEYS.CHATS);
      if (allChatsStr) {
          const allChats = JSON.parse(allChatsStr);
          delete allChats[contractId];
          localStorage.setItem(KEYS.CHATS, JSON.stringify(allChats));
      }
  },

  // --- Review Operations ---
  getReviews: (companyId: string): CommunityReview[] => {
    const all = localStorage.getItem(KEYS.REVIEWS);
    const parsed: CommunityReview[] = all ? JSON.parse(all) : [];
    // Only return verified reviews for the specific company
    return parsed.filter(r => r.companyId === companyId && r.status === ReviewStatus.VERIFIED)
                 .sort((a, b) => b.timestamp - a.timestamp);
  },
  
  // NEW: Get all reviews for Community Hub
  getAllReviews: (): CommunityReview[] => {
    const all = localStorage.getItem(KEYS.REVIEWS);
    const parsed: CommunityReview[] = all ? JSON.parse(all) : [];
    return parsed
        .filter(r => r.status === ReviewStatus.VERIFIED)
        .sort((a, b) => b.timestamp - a.timestamp);
  },

  // NEW: Get top/bottom companies for Hub
  getTrendingCompanies: (): { best: CompanyProfile[], worst: CompanyProfile[] } => {
      const allCompanies = CompanyService.getAll();
      const sorted = [...allCompanies].sort((a, b) => b.trustScore - a.trustScore);
      
      return {
          best: sorted.slice(0, 3),
          worst: sorted.reverse().slice(0, 3)
      };
  },

  getReviewStats: (companyId: string) => {
    const all = localStorage.getItem(KEYS.REVIEWS);
    const parsed: CommunityReview[] = all ? JSON.parse(all) : [];
    const companyReviews = parsed.filter(r => r.companyId === companyId && r.status === ReviewStatus.VERIFIED);
    
    if (companyReviews.length === 0) return { count: 0, average: 0 };
    
    const sum = companyReviews.reduce((acc, r) => acc + r.rating, 0);
    return { count: companyReviews.length, average: (sum / companyReviews.length) };
  },

  addReview: (review: Omit<CommunityReview, 'id' | 'timestamp'>) => {
    const all = localStorage.getItem(KEYS.REVIEWS);
    const parsed: CommunityReview[] = all ? JSON.parse(all) : [];
    
    const newReview: CommunityReview = {
        ...review,
        id: generateId(),
        timestamp: Date.now()
    };

    parsed.push(newReview);
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(parsed));
    return newReview;
  },

  // Check if current user has a contract with this provider (Simulated verification)
  checkVerification: (companyName: string): boolean => {
      const contracts = StorageService.getContracts();
      // Simple fuzzy match
      return contracts.some(c => c.providerName?.toLowerCase().includes(companyName.toLowerCase()));
  }
};