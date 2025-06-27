
// This is the new, simplified type for a league
export interface League {
  id: number;
  name: string;
  logoUrl: string;
  countryName: string;
  countryFlagUrl: string,
  type: string,
  href: string;
}

export interface Country {
  name: string;
  code: string | null; // Code can sometimes be null
  flagUrl: string;
}