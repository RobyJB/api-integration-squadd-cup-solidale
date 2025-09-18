require('dotenv').config();

async function testGHLCalendarsAPI() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID || 'i30YnwSzJ1ld5lsxtnb2';

  console.log('🧪 Test API GoHighLevel Calendars → CUP Solidale Sedi');
  console.log('API Key presente:', !!apiKey);
  console.log('Location ID:', locationId);

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/calendars/?locationId=${locationId}&showDrafted=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28'
      }
    });

    console.log('Status:', response.status);
    console.log('Rate limit remaining:', response.headers.get('x-ratelimit-remaining'));

    if (!response.ok) {
      console.error('❌ Errore API:', await response.text());
      return;
    }

    const data = await response.json();
    console.log('✅ Successo!');
    console.log('- Totale calendari:', data.calendars?.length);
    console.log('- TraceId:', data.traceId);

    // ANALISI DETTAGLIATA PER MAPPING CUP SOLIDALE
    if (data.calendars && data.calendars.length > 0) {
      console.log('\n📊 ANALISI STRUTTURA PER CUP SOLIDALE:');
      console.log('- Campi primo calendario:', Object.keys(data.calendars[0]));
      
      // JSON COMPLETO PRIMO CALENDARIO
      console.log('\n📄 JSON COMPLETO PRIMO CALENDARIO:');
      console.log(JSON.stringify(data.calendars[0], null, 2));

      // JSON COMPLETO SECONDO CALENDARIO (se esiste)
      if (data.calendars[1]) {
        console.log('\n📄 JSON COMPLETO SECONDO CALENDARIO:');
        console.log(JSON.stringify(data.calendars[1], null, 2));
      }

      // MAPPING DETTAGLIATO PER CUP SOLIDALE SEDI
      console.log('\n🏥 MAPPING CALENDARI GHL → SEDI CUP SOLIDALE:');
      data.calendars.forEach((calendar, index) => {
        console.log(`\n--- CALENDARIO ${index + 1} ---`);
        console.log('GHL Calendar ID:', calendar.id);
        console.log('Nome:', calendar.name);
        console.log('Tipo:', calendar.calendarType);
        console.log('Status:', calendar.status);
        console.log('Team ID:', calendar.teamId);
        console.log('Widget Type:', calendar.widgetType);
        
        // Mapping per CUP Solidale Sede
        console.log('\n🔄 MAPPING CUP SOLIDALE SEDE:');
        console.log(`- id_sede: "ghl_cal_${calendar.id}"`);
        console.log(`- nome: "Sede ${calendar.name}"`);
        console.log(`- indirizzo: "DA_DEFINIRE - inserire indirizzo reale"`);
        console.log(`- description: "Sede creata da calendario GHL: ${calendar.name}"`);
        console.log('- longitudine: DA_DEFINIRE (coordinate geografiche)');
        console.log('- latitudine: DA_DEFINIRE (coordinate geografiche)');
        console.log(`- ghl_calendar_id: "${calendar.id}" // Per riferimento`);
        console.log(`- ghl_calendar_type: "${calendar.calendarType}"`);
      });

      // LISTA ID CALENDARI per prossimo test events
      console.log('\n🆔 LISTA CALENDARI per test events:');
      data.calendars.forEach((cal, index) => {
        console.log(`${index + 1}. "${cal.name}" - ID: ${cal.id} - Type: ${cal.calendarType}`);
      });

      // ANALISI TIPI CALENDARIO
      console.log('\n📋 ANALISI TIPI CALENDARIO:');
      const calendarTypes = {};
      data.calendars.forEach(cal => {
        calendarTypes[cal.calendarType] = (calendarTypes[cal.calendarType] || 0) + 1;
      });
      Object.entries(calendarTypes).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} calendari`);
      });

      // TEMPLATE JSON PER BATCH CREATION SEDI
      console.log('\n🏗️  TEMPLATE BATCH CREATION SEDI CUP SOLIDALE:');
      const batchSedi = {
        offices: data.calendars.map(calendar => ({
          id_sede: `ghl_cal_${calendar.id}`,
          nome: `Sede ${calendar.name}`,
          indirizzo: "DA_DEFINIRE - inserire indirizzo reale per ogni sede",
          description: `Sede mappata da calendario GHL: ${calendar.name} (${calendar.calendarType})`,
          longitudine: 9.1859, // PLACEHOLDER - sostituire con coordinate reali
          latitudine: 45.4642   // PLACEHOLDER - sostituire con coordinate reali
        }))
      };
      
      console.log('Template JSON per CUP Solidale:');
      console.log(JSON.stringify(batchSedi, null, 2));

      // CONSIDERAZIONI PER IMPLEMENTAZIONE
      console.log('\n⚠️  CONSIDERAZIONI PER IMPLEMENTAZIONE:');
      console.log('- Ogni calendario GHL diventa una sede CUP Solidale');
      console.log('- Serve indirizzo fisico completo per ogni sede');
      console.log('- Coordinate geografiche precise (lat/lng) obbligatorie');
      console.log('- Nome sede dovrebbe riflettere la specializzazione medica');
      console.log('- Conservare GHL Calendar ID per mapping eventi futuri');
    }

    console.log('\n🎯 TEST COMPLETATO - Dati pronti per mapping CUP Solidale!');
    console.log('Prossimi passi:');
    console.log('1. Definire indirizzi fisici per ogni calendario');
    console.log('2. Ottenere coordinate geografiche precise');
    console.log('3. Creare sedi CUP Solidale da questo mapping');
    console.log('4. Usare per mapping eventi → prenotazioni');
    
    return data;

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  testGHLCalendarsAPI();
}

module.exports = { testGHLCalendarsAPI };