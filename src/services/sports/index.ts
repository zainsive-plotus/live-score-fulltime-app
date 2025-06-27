import { ISportService } from './ISportService';
import { FootballApiService } from './football.service';
// import { BasketballApiService } from './basketball.service'; // For the future

const services: { [key: string]: ISportService } = {
  football: new FootballApiService(),
  // basketball: new BasketballApiService(), // Add new sports here
};

export function getSportService(sport: string): ISportService {
  const service = services[sport];
  if (!service) {
    throw new Error(`Unsupported sport: ${sport}`);
  }
  return service;
}