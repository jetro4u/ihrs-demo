import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const organisationLocationsApi = [
  /**
   * GET /api/v1/org/organisationLocations/locationWithinOrgUnitBoundary
   * Checks if a location is within an organization unit boundary
   */
  http.get('/api/v1/org/organisationLocations/locationWithinOrgUnitBoundary', async ({ request }) => {
    const url = new URL(request.url);
    const latitude = parseFloat(url.searchParams.get('latitude') || '0');
    const longitude = parseFloat(url.searchParams.get('longitude') || '0');
    const orgUnitUid = url.searchParams.get('orgUnitUid') || '';
    
    // Mock implementation to simulate checking if coordinates are within boundary
    // In a real implementation, this would use geometry calculations
    const withinBoundary = Math.random() > 0.3; // Random result for demo purposes
    
    return HttpResponse.json({
      withinBoundary,
      orgUnit: orgUnitUid
    });
  }),

  /**
   * GET /api/v1/org/organisationLocations/orgUnitByLocation
   * Gets parent organization unit by location
   */
  http.get('/api/v1/org/organisationLocations/orgUnitByLocation', async ({ request }) => {
    const url = new URL(request.url);
    const latitude = parseFloat(url.searchParams.get('latitude') || '0');
    const longitude = parseFloat(url.searchParams.get('longitude') || '0');
    const targetLevel = parseInt(url.searchParams.get('targetLevel') || '1', 10);
    const topOrgUnit = url.searchParams.get('topOrgUnit') || '';
    
    const api = mockApi('organisations');
    
    // Find a random organization to use as parent
    const organisations = await api.findAll({});
    const randomIndex = Math.floor(Math.random() * organisations.length);
    const parentOrgUnit = organisations[randomIndex] || {
      id: 1,
      uid: 'mock-uid',
      uuid: 'mock-uuid',
      name: 'Mock Organization',
      level: targetLevel
    };
    
    return HttpResponse.json({
      parentOrgUnit,
      location: {
        latitude,
        longitude
      }
    });
  }),

  /**
   * GET /api/v1/org/organisationLocations/withinRange
   * Gets entities within a specified range of coordinates
   */
  http.get('/api/v1/org/organisationLocations/withinRange', async ({ request }) => {
    const url = new URL(request.url);
    const latitude = parseFloat(url.searchParams.get('latitude') || '0');
    const longitude = parseFloat(url.searchParams.get('longitude') || '0');
    const distance = parseFloat(url.searchParams.get('distance') || '5');
    const orgUnitGroupSetId = url.searchParams.get('orgUnitGroupSetId') || '';
    
    const api = mockApi('organisations');
    
    // Get a random subset of organizations within the range
    const allOrganisations = await api.findAll({});
    const count = Math.floor(Math.random() * 5) + 1; // 1-5 random results
    const items = allOrganisations.slice(0, count);
    
    return HttpResponse.json({
      items,
      distance,
      totalCount: items.length
    });
  })
];

export default organisationLocationsApi;