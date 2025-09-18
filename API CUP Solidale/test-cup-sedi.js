require('dotenv').config();

async function testCupSolidaleSedi() {
  const apiUrl = process.env.CUP_SOLIDALE_API_URL;
  const username = process.env.CUP_SOLIDALE_COMPANY_CODE;
  const apiKey = process.env.CUP_SOLIDALE_API_KEY;

  console.log('🧪 Test CUP Solidale - Gestione Sedi');
  
  if (!apiUrl || !username || !apiKey) {
    console.error('❌ Configurazione mancante! Esegui prima: npm run test:cup-connection');
    return;
  }

  const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');

  try {
    // Test 1: Lista sedi esistenti
    console.log('\n🔍 TEST 1: Lista sedi esistenti');
    
    const listResponse = await fetch(`${apiUrl}/sedi/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    const listData = await listResponse.json();
    console.log('Status lista:', listResponse.status);
    console.log('Sedi esistenti:', listData.success ? (listData.data?.length || 0) : 'Errore');

    // Test 2: Creazione sede di test
    console.log('\n🏥 TEST 2: Creazione sede di test');
    
    // Dati sede di esempio per test
    const testSede = {
      offices: [{
        id_sede: `test_sede_${Date.now()}`,
        nome: "Sede Test Squadd",
        indirizzo: "Via Roma 123, Milano",
        description: "Sede di test creata dall'integrazione Squadd-CUP Solidale",
        longitudine: 9.1859,    // Milano coordinate
        latitudine: 45.4642
      }]
    };

    console.log('Dati sede da creare:', JSON.stringify(testSede, null, 2));

    const createResponse = await fetch(`${apiUrl}/sedi/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSede)
    });

    const createData = await createResponse.json();
    console.log('Status creazione:', createResponse.status);
    console.log('Risultato:', JSON.stringify(createData, null, 2));

    if (createData.success) {
      const sedeId = testSede.offices[0].id_sede;
      
      // Test 3: Verifica sede creata
      console.log('\n✅ TEST 3: Verifica sede creata');
      
      const detailResponse = await fetch(`${apiUrl}/sedi/${sedeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      const detailData = await detailResponse.json();
      console.log('Status dettaglio:', detailResponse.status);
      console.log('Dettagli sede:', JSON.stringify(detailData, null, 2));

      // Test 4: Aggiornamento sede
      console.log('\n📝 TEST 4: Aggiornamento sede');
      
      const updateSede = {
        offices: [{
          ...testSede.offices[0],
          nome: "Sede Test Squadd - AGGIORNATA",
          description: "Sede di test aggiornata dall'integrazione Squadd-CUP Solidale"
        }]
      };

      const updateResponse = await fetch(`${apiUrl}/sedi/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateSede)
      });

      const updateData = await updateResponse.json();
      console.log('Status aggiornamento:', updateResponse.status);
      console.log('Risultato aggiornamento:', JSON.stringify(updateData, null, 2));

      // Test 5: Template per mapping da GHL calendari
      console.log('\n🔄 TEST 5: Template mapping GHL Calendari → CUP Solidale Sedi');
      
      // Simulazione dati calendario GHL
      const ghlCalendars = [
        {
          id: "6ubVWUGAkb8XphOF73Mm",
          name: "Risonanza",
          description: "Calendario per risonanze magnetiche"
        },
        {
          id: "calendar2_example",
          name: "Visite Cardiologiche", 
          description: "Calendario per visite specialistiche cardiologiche"
        }
      ];

      console.log('\n📋 MAPPING SUGGERITO:');
      ghlCalendars.forEach((calendar, index) => {
        const mappedSede = {
          offices: [{
            id_sede: `ghl_cal_${calendar.id}`,
            nome: `Sede ${calendar.name}`,
            indirizzo: "Da definire - inserire indirizzo reale",
            description: `Sede mappata da calendario GHL: ${calendar.description}`,
            longitudine: 9.1859 + (index * 0.01), // Coordinate fittizie da aggiornare
            latitudine: 45.4642 + (index * 0.01)
          }]
        };
        
        console.log(`\n--- CALENDARIO GHL: ${calendar.name} ---`);
        console.log('GHL Calendar ID:', calendar.id);
        console.log('Mapping CUP Solidale:');
        console.log(JSON.stringify(mappedSede, null, 2));
      });

      // Test 6: Eliminazione sede di test (cleanup)
      console.log('\n🗑️  TEST 6: Eliminazione sede di test (cleanup)');
      
      const deleteResponse = await fetch(`${apiUrl}/sedi/${sedeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      const deleteData = await deleteResponse.json();
      console.log('Status eliminazione:', deleteResponse.status);
      console.log('Risultato eliminazione:', JSON.stringify(deleteData, null, 2));

    } else {
      console.error('❌ Errore durante creazione sede:', createData.error);
    }

    console.log('\n✅ TEST COMPLETATO');
    console.log('\n📋 CONSIDERAZIONI PER IMPLEMENTAZIONE:');
    console.log('1. Ogni calendario GHL deve mappare a una sede CUP Solidale');
    console.log('2. Serve geolocalizzazione precisa (lat/lng) per ogni sede');
    console.log('3. Gli indirizzi devono essere completi e reali');
    console.log('4. L\'ID sede deve essere univoco e tracciabile');
    console.log('5. La descrizione può contenere HTML per formattazione');

  } catch (error) {
    console.error('❌ Errore durante test sedi:', error.message);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  testCupSolidaleSedi();
}

module.exports = { testCupSolidaleSedi };