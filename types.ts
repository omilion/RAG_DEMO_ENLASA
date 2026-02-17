
export interface NewsItem {
  title: string;
  url: string;
  source: string;
  thumbnail?: string;
  date?: string;
}

export interface EconomicIndicator {
  name: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface Birthday {
  name: string;
  date: string;
  department: string;
  photo: string;
}

export interface LegalRegulation {
  title: string;
  status: 'Vigente' | 'En revisión' | 'Nueva';
  category: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
