import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const organisationProfileApi = [
  /**
   * GET /api/v1/org/organisationProfile
   * Gets the organization profile
   */
  http.get('/api/v1/org/organisationProfile', async () => {
    const api = mockApi('organisation_profiles');
    const profiles = await api.findAll({});
    
    // Return the first profile or a default one if none exists
    const profile = profiles.length > 0 ? profiles[0] : {
      id: '1',
      uuid: 'default-profile-uuid',
      name: 'Default Organization Profile',
      description: 'Default organization profile description',
      attributes: ['attr1', 'attr2'],
      dataItems: ['item1', 'item2'],
      groupSets: ['set1', 'set2'],
      settings: { theme: 'light', language: 'en' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(profile);
  }),

  /**
   * POST /api/v1/org/organisationProfile
   * Creates an organization profile
   */
  http.post('/api/v1/org/organisationProfile', async ({ request }) => {
    const api = mockApi('organisation_profiles');
    const data = await request.json() as Record<string, unknown>;
    
    // Create a new profile with the provided data
    const newProfile = await api.create({
      ...data,
      id: String(Date.now()),
      uuid: `profile-${Date.now()}`,
      name: 'New Organization Profile',
      description: 'Newly created organization profile',
      settings: { theme: 'default', language: 'en' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return HttpResponse.json(newProfile, { status: 201 });
  }),

  /**
   * GET /api/v1/org/organisationProfile/:uuid/data
   * Gets organization profile data for a specific profile
   */
  http.get('/api/v1/org/organisationProfile/:uuid/data', async ({ params, request }) => {
    const api = mockApi('organisation_profile_data');
    const { uuid } = params as Record<string, string>;
    
    const url = new URL(request.url);
    const period = url.searchParams.get('period');
    
    // Get profile data with optional period filter
    const queryParams: Record<string, any> = { organisationId: uuid };
    if (period) {
      queryParams.period = period;
    }
    
    const profileData = await api.findAll(queryParams);
    
    // If no data found, return sample data
    if (profileData.length === 0) {
      const sampleData = [
        {
          id: `data-${Date.now()}-1`,
          organisationId: uuid,
          period: period || '2025Q1',
          data: {
            metric1: 85,
            metric2: 92,
            metric3: 78
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `data-${Date.now()}-2`,
          organisationId: uuid,
          period: period || '2025Q1',
          data: {
            metric4: 65,
            metric5: 72,
            metric6: 88
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return HttpResponse.json(sampleData);
    }
    
    return HttpResponse.json(profileData);
  })
];

export default organisationProfileApi;