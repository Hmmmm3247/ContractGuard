
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'zu' | 'af';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_vault: 'My Vault',
    nav_analyze: 'Analyze',
    nav_community: 'Community',
    nav_search: 'Intel Search',
    nav_resources: 'Resources',
    nav_settings: 'Settings',
    nav_concierge: 'Concierge',
    nav_ask: 'Ask Assistant',
    
    // Hero
    hero_badge: 'AI-Powered Legal Defense • v2.0',
    hero_title_1: "Don't Sign What You",
    hero_title_2: "Don't Understand.",
    hero_desc: "ContractGuard uses advanced AI (Gemini 2.5 Flash) with deep thinking reasoning to translate legalese, catch South African contract traps, and negotiate for you.",
    btn_scan: "Quick Scan",
    btn_demo: "Watch Demo",
    badge_cpa: "CPA & NCA Compliant",
    badge_secure: "End-to-End Encrypted",

    // General
    loading_reasoning: "AI Reasoning Active",
    btn_connect: "Connect",
    btn_connected: "Connected",
    status_offline: "You are offline. Analysis requires internet.",
    
    // Settings
    settings_title: "System Settings",
    settings_lang: "App Language",
    settings_integrations: "Integrations Hub",
  },
  zu: {
    // Navigation
    nav_home: 'Ekhaya',
    nav_vault: 'Isisefo Sami',
    nav_analyze: 'Hlaziya',
    nav_community: 'Umphakathi',
    nav_search: 'Cwaninga',
    nav_resources: 'Izinsiza',
    nav_settings: 'Izilungiselelo',
    nav_concierge: 'Umsizi',
    nav_ask: 'Buza i-AI',

    // Hero
    hero_badge: 'Ukuvikelwa Kwezomthetho Nge-AI • v2.0',
    hero_title_1: "Ungasayini Into",
    hero_title_2: "Ongayiqondi.",
    hero_desc: "I-ContractGuard isebenzisa i-AI ethuthukisiwe ukuhumusha ulimi lomthetho, ukubamba izingibe zezinkontileka zaseNingizimu Afrika, nokukuxoxisana.",
    btn_scan: "Hlaziya Masinyane",
    btn_demo: "Buka Idemo",
    badge_cpa: "Ihambisana ne-CPA ne-NCA",
    badge_secure: "Ivikelekile Ngokuphelele",

    // General
    loading_reasoning: "I-AI Iyacabanga...",
    btn_connect: "Xhuma",
    btn_connected: "Kuxhunyiwe",
    status_offline: "Awukho ku-inthanethi.",

    // Settings
    settings_title: "Izilungiselelo Zesistimu",
    settings_lang: "Ulimi Lohlelo",
    settings_integrations: "Ukuxhumana",
  },
  af: {
    // Navigation
    nav_home: 'Tuis',
    nav_vault: 'My Kluis',
    nav_analyze: 'Analiseer',
    nav_community: 'Gemeenskap',
    nav_search: 'Soektog',
    nav_resources: 'Hulpbronne',
    nav_settings: 'Instellings',
    nav_concierge: 'Konciërge',
    nav_ask: 'Vra Assistent',

    // Hero
    hero_badge: 'AI-Aangedrewe Regsbeskerming • v2.0',
    hero_title_1: "Moenie Teken Wat Jy",
    hero_title_2: "Nie Verstaan Nie.",
    hero_desc: "ContractGuard gebruik gevorderde AI om regstaal te vertaal, Suid-Afrikaanse kontrak strikke te vang, en namens jou te onderhandel.",
    btn_scan: "Vinnige Skandering",
    btn_demo: "Kyk Demo",
    badge_cpa: "Voldoen aan CPA & NCA",
    badge_secure: "Ten Volle Geënkripteer",

    // General
    loading_reasoning: "AI Redenering Aktief",
    btn_connect: "Koppel",
    btn_connected: "Gekoppel",
    status_offline: "Jy is vanlyn.",

    // Settings
    settings_title: "Stelsel Instellings",
    settings_lang: "Toep Taal",
    settings_integrations: "Integrasies",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
