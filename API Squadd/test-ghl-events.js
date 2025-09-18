require('dotenv').config();

async function testGHLEventsAPI() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID || 'i30YnwSzJ1ld5lsxtnb2';
  
  // Uso il primo calendario dal test precedente
  const calendarId = '6ubVWUGAkb8XphOF73Mm'; // "Risonanza"
  
  // Calcolo date: un anno fa fino ad oggi (come strategia discussa)
  const endTime = new Date().getTime(); // Oggi
  const startTime = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)).getTime(); // 365 giorni fa
  
  console.log('🧪 Test API GoHighLevel Calendar Events → CUP Solidale Prenotazioni');
  console.log('API Key presente:', !!apiKey);
  console.log('Location ID:', locationId);
  console.log('Calendar ID:', calendarId);
  console.log('Periodo:', new Date(startTime).toISOString(), '→', new Date(endTime).toISOString());

  try {
    const url = `https://services.leadconnectorhq.com/calendars/events?calendarId=${calendarId}&locationId=${locationId}&startTime=${startTime}&endTime=${endTime}`;
    
    const response = await fetch(url, {
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
    console.log('- Totale eventi:', data.events?.length);
    console.log('- TraceId:', data.traceId);

    // ANALISI DETTAGLIATA PER MAPPING CUP SOLIDALE
    if (data.events && data.events.length > 0) {
      console.log('\n📊 ANALISI STRUTTURA PER CUP SOLIDALE:');
      console.log('- Campi primo evento:', Object.keys(data.events[0]));
      
      // JSON COMPLETO PRIMO EVENTO
      console.log('\n📄 JSON COMPLETO PRIMO EVENTO:');
      console.log(JSON.stringify(data.events[0], null, 2));

      // JSON COMPLETO SECONDO EVENTO (se esiste)
      if (data.events[1]) {
        console.log('\n📄 JSON COMPLETO SECONDO EVENTO:');
        console.log(JSON.stringify(data.events[1], null, 2));
      }

      // ANALISI STATUS EVENTI
      console.log('\n📅 ANALISI STATUS EVENTI:');
      const eventStatuses = {};
      data.events.forEach(event => {
        const status = event.appointmentStatus;
        eventStatuses[status] = (eventStatuses[status] || 0) + 1;
      });
      Object.entries(eventStatuses).forEach(([status, count]) => {
        console.log(`- ${status}: ${count} eventi`);
      });

      // MAPPING DETTAGLIATO PER CUP SOLIDALE
      console.log('\n🏥 MAPPING DETTAGLIATO CUP SOLIDALE:');
      data.events.slice(0, 3).forEach((event, index) => {
        console.log(`\n--- EVENTO ${index + 1} ---`);
        console.log('GHL Event ID:', event.id);
        console.log('Titolo:', event.title);
        console.log('Status:', event.appointmentStatus);
        console.log('Data/Ora inizio:', new Date(event.startTime).toLocaleString('it-IT'));
        console.log('Data/Ora fine:', new Date(event.endTime).toLocaleString('it-IT'));
        console.log('Durata (min):', Math.round((event.endTime - event.startTime) / (1000 * 60)));
        console.log('Contact ID:', event.contactId);
        console.log('Calendar ID:', event.calendarId);
        console.log('Assigned User ID:', event.assignedUserId);
        
        // Mapping per CUP Solidale
        console.log('\n🔄 MAPPING CUP SOLIDALE PRENOTAZIONE:');
        console.log(`- id_prenotazione: "${event.id}"`);
        console.log(`- tipologia: "prenotazione"`);
        
        // Estrazione data e ora per CUP Solidale
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        console.log(`- data_inizio: "${startDate.toISOString().split('T')[0]}"`); // YYYY-MM-DD
        console.log(`- ora_inizio: "${startDate.toTimeString().split(' ')[0].substring(0,5)}"`); // HH:MM
        console.log(`- data_fine: "${endDate.toISOString().split('T')[0]}"`);
        console.log(`- ora_fine: "${endDate.toTimeString().split(' ')[0].substring(0,5)}"`);
        
        // Mapping degli ID per CUP Solidale
        console.log(`- id_dottore: "${event.assignedUserId || 'DA_MAPPARE'}"`);
        console.log(`- id_sede: "DA_MAPPARE"`) // Dipende dal calendario
        console.log(`- id_prestazione: "DA_MAPPARE"`); // Dipende dal tipo di evento
        console.log(`- id_paziente: "${event.contactId || 'DA_CREARE'}"`);
        
        // Status mapping
        const cupStatus = event.appointmentStatus === 'confirmed' ? 'confermata' : 
                         event.appointmentStatus === 'cancelled' ? 'cancellata' : 
                         event.appointmentStatus === 'showed' ? 'completata' : 'da_confermare';
        console.log(`- status_cup: "${cupStatus}"`);
      });

      // ANALISI DATE EVENTI
      console.log('\n📊 ANALISI TEMPORALE:');
      const eventsByMonth = {};
      data.events.forEach(event => {
        const date = new Date(event.startTime);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        eventsByMonth[monthKey] = (eventsByMonth[monthKey] || 0) + 1;
      });
      console.log('- Eventi per mese:', eventsByMonth);

      // ANALISI CONTATTI COLLEGATI
      const eventsWithContact = data.events.filter(e => e.contactId);
      console.log('\n👤 CONTATTI COLLEGATI:');
      console.log(`- Eventi con contactId: ${eventsWithContact.length}/${data.events.length}`);

      // ANALISI UTENTI ASSEGNATI
      const assignedUsers = {};
      data.events.forEach(event => {
        const userId = event.assignedUserId;
        if (userId) {
          assignedUsers[userId] = (assignedUsers[userId] || 0) + 1;
        }
      });
      console.log('\n👥 UTENTI ASSEGNATI (mapping dottori):');
      Object.entries(assignedUsers).forEach(([userId, count]) => {
        console.log(`- ${userId}: ${count} eventi`);
      });

      // ANALISI DURATE APPUNTAMENTI
      console.log('\n⏱️  ANALISI DURATE:');
      const durations = data.events.map(e => Math.round((e.endTime - e.startTime) / (1000 * 60)));
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      console.log(`- Durata media: ${Math.round(avgDuration)} minuti`);
      console.log(`- Durata min: ${Math.min(...durations)} minuti`);
      console.log(`- Durata max: ${Math.max(...durations)} minuti`);

      // CONSIDERAZIONI SPECIFICHE CUP SOLIDALE
      console.log('\n⚠️  CONSIDERAZIONI CUP SOLIDALE:');
      console.log('- Mapping calendario → sede: RICHIESTO');
      console.log('- Mapping tipo evento → prestazione: RICHIESTO');
      console.log('- Gestione status: confirmed→confermata, showed→completata, cancelled→cancellata');
      console.log('- Formato date: Conversione da timestamp a YYYY-MM-DD HH:MM');
      console.log('- Pazienti: Serve mapping contactId → dati paziente completi');

    } else {
      console.log('\n📭 Nessun evento trovato nel periodo specificato');
      console.log('💡 Suggerimento: Prova con un calendario diverso o periodo diverso');
    }

    console.log('\n🎯 TEST COMPLETATO - Dati pronti per mapping CUP Solidale!');
    console.log('Prossimi passi:');
    console.log('1. Mappare calendari GHL → sedi CUP Solidale');
    console.log('2. Mappare tipi evento → prestazioni mediche');
    console.log('3. Sincronizzare contatti → pazienti');
    console.log('4. Implementare conversione status');
    
    return data;

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  testGHLEventsAPI();
}

module.exports = { testGHLEventsAPI };