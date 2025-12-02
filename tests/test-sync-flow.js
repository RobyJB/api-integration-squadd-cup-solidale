/**
 * Test del flusso di sync CUP Solidale → GHL
 *
 * Testa:
 * 1. Ricerca contatto per email
 * 2. Ricerca contatto per phone
 * 3. Creazione contatto se non esiste
 * 4. Creazione appuntamento
 */

require('dotenv').config();

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;

function getHeaders() {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
  };
}

// Dati di test FINTI
const TEST_EMAIL = `test.sync.${Date.now()}@finto.example.com`;
const TEST_PHONE = `+3900000${Date.now().toString().slice(-5)}`;
const CALENDAR_ID = '6IAGPIxMRTt2rho5DrGw';
const ASSIGNED_USER_ID = '6kmg2YF4uhCW3ztW3BtW';

async function searchByEmail(email) {
  console.log(`\n1️⃣ Cerco contatto per email: ${email}`);

  const response = await fetch(`${GHL_BASE_URL}/contacts/search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      locationId: locationId,
      page: 1,
      pageLimit: 1,
      filters: [{ field: 'email', operator: 'eq', value: email }]
    })
  });

  const data = await response.json();
  const found = data.contacts?.[0];

  console.log(`   Risultato: ${found ? `Trovato (ID: ${found.id})` : 'Non trovato'}`);
  return found;
}

async function searchByPhone(phone) {
  console.log(`\n2️⃣ Cerco contatto per phone: ${phone}`);

  const response = await fetch(`${GHL_BASE_URL}/contacts/search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      locationId: locationId,
      page: 1,
      pageLimit: 1,
      filters: [{ field: 'phone', operator: 'eq', value: phone }]
    })
  });

  const data = await response.json();
  const found = data.contacts?.[0];

  console.log(`   Risultato: ${found ? `Trovato (ID: ${found.id})` : 'Non trovato'}`);
  return found;
}

async function createContact(contactData) {
  console.log(`\n3️⃣ Creo nuovo contatto: ${contactData.firstName} ${contactData.lastName}`);

  const response = await fetch(`${GHL_BASE_URL}/contacts/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      locationId: locationId,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      source: 'CUP Solidale Test',
      tags: ['test', 'cup-solidale', 'auto-delete']
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Create contact failed: ${error.message}`);
  }

  const data = await response.json();
  console.log(`   ✅ Contatto creato! ID: ${data.contact.id}`);
  return data.contact;
}

async function createAppointment(contactId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);

  const endTime = new Date(tomorrow.getTime() + 30 * 60 * 1000);

  console.log(`\n4️⃣ Creo appuntamento per ${tomorrow.toLocaleString('it-IT')}`);

  const response = await fetch(`${GHL_BASE_URL}/calendars/events/appointments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      calendarId: CALENDAR_ID,
      locationId: locationId,
      contactId: contactId,
      assignedUserId: ASSIGNED_USER_ID,
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      title: 'Test Sync CUP Solidale - DA ELIMINARE',
      appointmentStatus: 'confirmed',
      ignoreFreeSlotValidation: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Create appointment failed: ${error.message}`);
  }

  const data = await response.json();
  console.log(`   ✅ Appuntamento creato! ID: ${data.id}`);
  return data;
}

async function deleteContact(contactId) {
  console.log(`\n🗑️ Elimino contatto di test: ${contactId}`);

  const response = await fetch(`${GHL_BASE_URL}/contacts/${contactId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (response.ok) {
    console.log(`   ✅ Contatto eliminato`);
  } else {
    console.log(`   ⚠️ Impossibile eliminare contatto`);
  }
}

async function deleteEvent(eventId) {
  console.log(`\n🗑️ Elimino evento di test: ${eventId}`);

  const response = await fetch(`${GHL_BASE_URL}/calendars/events/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({})
  });

  if (response.ok) {
    console.log(`   ✅ Evento eliminato`);
  } else {
    console.log(`   ⚠️ Impossibile eliminare evento`);
  }
}

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST FLUSSO SYNC CUP SOLIDALE → GHL');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Email test: ${TEST_EMAIL}`);
  console.log(`Phone test: ${TEST_PHONE}`);

  let contactId = null;
  let eventId = null;

  try {
    // Step 1: Cerca per email (non dovrebbe trovare nulla)
    let contact = await searchByEmail(TEST_EMAIL);

    // Step 2: Cerca per phone (non dovrebbe trovare nulla)
    if (!contact) {
      contact = await searchByPhone(TEST_PHONE);
    }

    // Step 3: Crea contatto se non esiste
    if (!contact) {
      contact = await createContact({
        firstName: 'Test',
        lastName: 'SyncFinto',
        email: TEST_EMAIL,
        phone: TEST_PHONE
      });
    }

    contactId = contact.id;

    // Step 4: Crea appuntamento
    const event = await createAppointment(contactId);
    eventId = event.id;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ TEST COMPLETATO CON SUCCESSO!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Contact ID: ${contactId}`);
    console.log(`Event ID: ${eventId}`);

  } catch (error) {
    console.error('\n❌ TEST FALLITO:', error.message);
  }

  // Cleanup
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  CLEANUP - Elimino dati di test');
  console.log('═══════════════════════════════════════════════════════════');

  if (eventId) await deleteEvent(eventId);
  if (contactId) await deleteContact(contactId);

  console.log('\n✅ Cleanup completato');
}

runTest().catch(console.error);
