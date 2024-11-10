import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load base URL from environment variable
const baseUrl = __ENV.BASE_URL || 'http://petclinic:9966/petclinic'; // Default to localhost if not set
const duration = __ENV.DURATION || '600s';
const maxRate = __ENV.RATE || 100;
const maxClients = __ENV.CLIENTS || 100;

export const scenarios = {
  rt: {
    executor: 'constant-arrival-rate',

    // How long the test lasts
    duration: duration,

    // How many iterations per timeUnit
    rate: maxRate,

    // Start `rate` iterations per second
    timeUnit: '1s',

    // Pre-allocate 2 VUs before starting the test
    preAllocatedVUs: 2,

    // Spin up a maximum of 50 VUs to sustain the defined
    // constant arrival rate.
    maxVUs: 200,
  },
  rps: {
    executor: 'constant-vus',
    vus: maxClients,
    duration: duration
  }
}

// https://grafana.com/docs/k6/latest/using-k6/scenarios/advanced-examples/#run-specific-scenario-via-environment-variable
const { SCENARIO } = __ENV

export const options = {
  discardResponseBodies: true,
  scenarios: SCENARIO ? { [SCENARIO]: scenarios[SCENARIO] } : scenarios,
};

// Load the shared arrays
const owners = new SharedArray('owners', function () {
  return [
    { id: 1, firstName: 'George', lastName: 'Franklin' },
    { id: 2, firstName: 'Betty', lastName: 'Davis' },
    { id: 3, firstName: 'Eduardo', lastName: 'Rodriquez' },
    { id: 4, firstName: 'Harold', lastName: 'Davis' },
    { id: 5, firstName: 'Peter', lastName: 'McTavish' },
    { id: 6, firstName: 'Jean', lastName: 'Coleman' },
    { id: 7, firstName: 'Jeff', lastName: 'Black' },
    { id: 8, firstName: 'Maria', lastName: 'Escobito' },
    { id: 9, firstName: 'David', lastName: 'Schroeder' },
    { id: 10, firstName: 'Carlos', lastName: 'Estaban' }
  ];
});

const pets = new SharedArray('pets', function () {
  return [
    { id: 1, name: 'Leo', type: { id: 1, name: 'cat' }, ownerId: 1 },
    { id: 2, name: 'Basil', type: { id: 6, name: 'hamster' }, ownerId: 2 },
    { id: 3, name: 'Rosy', type: { id: 2, name: 'dog' }, ownerId: 3 },
    { id: 4, name: 'Jewel', type: { id: 2, name: 'dog' }, ownerId: 3 },
    { id: 5, name: 'Iggy', type: { id: 3, name: 'lizard' }, ownerId: 4 },
    { id: 6, name: 'George', type: { id: 4, name: 'snake' }, ownerId: 5 },
    { id: 7, name: 'Samantha', type: { id: 1, name: 'cat' }, ownerId: 6 },
    { id: 8, name: 'Max', type: { id: 1, name: 'cat' }, ownerId: 6 },
    { id: 9, name: 'Lucky', type: { id: 5, name: 'bird' }, ownerId: 7 },
    { id: 10, name: 'Mulligan', type: { id: 2, name: 'dog' }, ownerId: 8 },
    { id: 11, name: 'Freddy', type: { id: 5, name: 'bird' }, ownerId: 9 },
    { id: 12, name: 'Lucky', type: { id: 2, name: 'dog' }, ownerId: 10 },
    { id: 13, name: 'Sly', type: { id: 1, name: 'cat' }, ownerId: 10 }
  ];
});

const vets = new SharedArray('vets', function () {
  return [
    { id: 1, firstName: 'James', lastName: 'Carter' },
    { id: 2, firstName: 'Helen', lastName: 'Leary' },
    { id: 3, firstName: 'Linda', lastName: 'Douglas' },
    { id: 4, firstName: 'Rafael', lastName: 'Ortega' },
    { id: 5, firstName: 'Henry', lastName: 'Stevens' },
    { id: 6, firstName: 'Sharon', lastName: 'Jenkins' }
  ];
});

const specialties = new SharedArray('specialties', function () {
  return [
    { id: 1, name: 'radiology' },
    { id: 2, name: 'surgery' },
    { id: 3, name: 'dentistry' }
  ];
});

const visits = new SharedArray('visits', function () {
  return [
    { id: 1, petId: 7, date: '2010-03-04', description: 'rabies shot' },
    { id: 2, petId: 8, date: '2011-03-04', description: 'rabies shot' },
    { id: 3, petId: 8, date: '2009-06-04', description: 'neutered' },
    { id: 4, petId: 7, date: '2008-09-04', description: 'spayed' }
  ];
});

export default function () {
  const ownerId = owners[Math.floor(Math.random() * owners.length)].id;
  const petId = pets[Math.floor(Math.random() * pets.length)].id;
  const vetId = vets[Math.floor(Math.random() * vets.length)].id;
  const specialtyId = specialties[Math.floor(Math.random() * specialties.length)].id;
  const visitId = visits[Math.floor(Math.random() * visits.length)].id;

  const GET = 'GET';
  const PUT = 'PUT';
  const POST = 'POST';
  const DELETE = 'DELETE';

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  group('Pettypes API', function () {
    // GET /api/pettypes/{petTypeId}
    const petTypeId = Math.floor(Math.random() * 6) + 1; // Using ids 1 to 6
    const url = `${baseUrl}/api/pettypes/${petTypeId}`;
    let response = http.get(url);
    handleResponse(response, GET, url, params);
  });

  group('Owner API', function () {
    let response = http.get(`${baseUrl}/api/owners/${ownerId}`);
    handleResponse(response, GET, `${baseUrl}/api/owners/${ownerId}`, params);

    const ownerData = JSON.stringify({
      firstName: 'George',
      lastName: 'Franklin',
      address: '110 W. Liberty St.',
      city: 'Madison',
      telephone: '608555102' + `${Math.floor(Math.random() * 10)}`
    });
    response = http.put(`${baseUrl}/api/owners/${ownerId}`, ownerData, params);
    handleResponse(response, PUT, `${baseUrl}/api/owners/${ownerId}`);

  });

  group('Pet API', function () {
    let response = http.get(`${baseUrl}/api/pets/${petId}`, params);
    handleResponse(response, GET, `${baseUrl}/api/pets/${petId}`);

    const petData = JSON.stringify({
      name: 'Leo',
      birthDate: '2024-11-08',
      type: {
        name: 'cat',
        id: 1
      }
    });
    response = http.put(`${baseUrl}/api/pets/${petId}`, petData, params);
    handleResponse(response, PUT, `${baseUrl}/api/pets/${petId}`);

  });

  group('Visit API', function () {
    const visitData = JSON.stringify({
      date: '2024-11-08',
      description: 'rabies shot'
    });

    let response = http.post(`${baseUrl}/api/owners/${ownerId}/pets/${petId}/visits`, visitData, params);
    handleResponse(response, POST, `${baseUrl}/api/owners/${ownerId}/pets/${petId}/visits`);

    response = http.get(`${baseUrl}/api/visits/${visitId}`, params);
    handleResponse(response, GET, `${baseUrl}/api/visits/${visitId}`);

    response = http.put(`${baseUrl}/api/visits/${visitId}`, visitData, params);
    handleResponse(response, PUT, `${baseUrl}/api/visits/${visitId}`);

  });

  group('Vet API', function () {
    let response = http.get(`${baseUrl}/api/vets/${vetId}`, params);
    handleResponse(response, GET, `${baseUrl}/api/vets/${vetId}`);

    const vetData = JSON.stringify({
      firstName: 'James',
      lastName: 'Carter',
      specialties: [
        { name: 'radiology' }
      ]
    });
    response = http.put(`${baseUrl}/api/vets/${vetId}`, vetData, params);
    handleResponse(response, PUT, `${baseUrl}/api/vets/${vetId}`);

  });

  group('Specialty API', function () {
    let response = http.get(`${baseUrl}/api/specialties/${specialtyId}`);
    handleResponse(response, GET, `${baseUrl}/api/specialties/${specialtyId}`, params);

    const specialtyData = JSON.stringify({
      name: 'surgery'
    });
    response = http.put(`${baseUrl}/api/specialties/${specialtyId}`, specialtyData, params);
    handleResponse(response, PUT, `${baseUrl}/api/specialties/${specialtyId}`);

  });


}

// Helper function to handle response and log errors
function handleResponse(response, method, url) {

  if (response.status < 400) {
    check(response, {
      'status is 200': (r) => r.status < 400
    });
  } else {
    const is4xx = response.status >= 400 && response.status < 500;
    const is5xx = response.status >= 500 && response.status < 600;

    if (is4xx) {
      check(response, {
        'status is 4xx': (r) => is4xx
      });
      console.error(`4xx Error: ${response.status} at ${url}`);
    } else if (is5xx) {
      check(response, {
        'status is 5xx': (r) => is4xx
      });
      console.error(`5xx Error: ${response.status} at ${url}`);
    } else {
      console.error(`Unexpected Error: ${response.status} at ${url}`);
    }
  }

}

