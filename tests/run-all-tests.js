require('dotenv').config();

const { testGHLUsersAPI } = require('../API Squadd/test-ghl-users');
const { testGHLEventsAPI } = require('../API Squadd/test-ghl-events');
const { testGHLCalendarsAPI } = require('../API Squadd/test-ghl-calendars');
const { testCupSolidaleConnection } = require('../API CUP Solidale/test-cup-connection');
const { testCupSolidaleSedi } = require('../API CUP Solidale/test-cup-sedi');

async function runAllTests() {
  console.log('🚀 AVVIO TEST SUITE COMPLETA');
  console.log('========================================');
  console.log('Integrazione Squadd ↔ CUP Solidale');
  console.log('========================================\n');

  const startTime = Date.now();
  const results = {};

  try {
    // Test 1: GoHighLevel Users (fonte dottori)
    console.log('📋 FASE 1: Test GoHighLevel Users API');
    console.log('─'.repeat(50));
    try {
      results.ghlUsers = await testGHLUsersAPI();
      results.ghlUsersStatus = '✅ SUCCESSO';
    } catch (error) {
      console.error('❌ Errore test GHL Users:', error.message);
      results.ghlUsersStatus = '❌ ERRORE';
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    // Test 2: GoHighLevel Events (fonte prenotazioni)
    console.log('📅 FASE 2: Test GoHighLevel Events API');
    console.log('─'.repeat(50));
    try {
      results.ghlEvents = await testGHLEventsAPI();
      results.ghlEventsStatus = '✅ SUCCESSO';
    } catch (error) {
      console.error('❌ Errore test GHL Events:', error.message);
      results.ghlEventsStatus = '❌ ERRORE';
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    // Test 3: GoHighLevel Calendars (fonte sedi)
    console.log('🗓️ FASE 3: Test GoHighLevel Calendars API');
    console.log('─'.repeat(50));
    try {
      results.ghlCalendars = await testGHLCalendarsAPI();
      results.ghlCalendarsStatus = '✅ SUCCESSO';
    } catch (error) {
      console.error('❌ Errore test GHL Calendars:', error.message);
      results.ghlCalendarsStatus = '❌ ERRORE';
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    // Test 4: CUP Solidale Connection
    console.log('🔌 FASE 3: Test CUP Solidale Connection');
    console.log('─'.repeat(50));
    try {
      results.cupConnection = await testCupSolidaleConnection();
      results.cupConnectionStatus = '✅ SUCCESSO';
    } catch (error) {
      console.error('❌ Errore test CUP Connection:', error.message);
      results.cupConnectionStatus = '❌ ERRORE';
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    // Test 5: CUP Solidale Sedi (solo se connessione ok)
    if (results.cupConnection) {
      console.log('🏥 FASE 5: Test CUP Solidale Sedi Management');
      console.log('─'.repeat(50));
      try {
        results.cupSedi = await testCupSolidaleSedi();
        results.cupSediStatus = '✅ SUCCESSO';
      } catch (error) {
        console.error('❌ Errore test CUP Sedi:', error.message);
        results.cupSediStatus = '❌ ERRORE';
      }
    } else {
      console.log('⏭️  FASE 5: SALTATA - CUP Solidale non disponibile');
      results.cupSediStatus = '⏭️ SALTATO';
    }

  } catch (error) {
    console.error('💥 ERRORE CRITICO nella test suite:', error.message);
  }

  // Riepilogo finale
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log('\n' + '🎯 RIEPILOGO TEST SUITE'.padEnd(60, '='));
  console.log(`⏱️  Durata totale: ${duration} secondi\n`);

  console.log('📊 RISULTATI:');
  console.log(`- GoHighLevel Users:     ${results.ghlUsersStatus || '❓ NON ESEGUITO'}`);
  console.log(`- GoHighLevel Events:    ${results.ghlEventsStatus || '❓ NON ESEGUITO'}`);
  console.log(`- GoHighLevel Calendars: ${results.ghlCalendarsStatus || '❓ NON ESEGUITO'}`);
  console.log(`- CUP Solidale Conn:     ${results.cupConnectionStatus || '❓ NON ESEGUITO'}`);
  console.log(`- CUP Solidale Sedi:     ${results.cupSediStatus || '❓ NON ESEGUITO'}`);

  // Analisi mapping
  console.log('\n🔄 ANALISI MAPPING DATI:');
  
  if (results.ghlUsers && results.ghlUsers.users) {
    console.log(`- Utenti GHL trovati: ${results.ghlUsers.users.length}`);
    console.log('- Questi diventeranno DOTTORI in CUP Solidale');
  }

  if (results.ghlEvents && results.ghlEvents.events) {
    console.log(`- Eventi GHL trovati: ${results.ghlEvents.events.length}`);
    console.log('- Questi diventeranno PRENOTAZIONI in CUP Solidale');
  }

  if (results.ghlCalendars && results.ghlCalendars.calendars) {
    console.log(`- Calendari GHL trovati: ${results.ghlCalendars.calendars.length}`);
    console.log('- Questi diventeranno SEDI in CUP Solidale');
  }

  if (results.cupConnection) {
    console.log('- Connessione CUP Solidale: ATTIVA');
    console.log('- Endpoint disponibili: sedi, prestazioni, dottori, agende');
  }

  // Prossimi passi
  console.log('\n📋 PROSSIMI PASSI IMPLEMENTAZIONE:');
  console.log('1. 🏥 Creare mapping calendari GHL → sedi CUP Solidale');
  console.log('2. 👨‍⚕️ Mappare utenti GHL → dottori CUP Solidale');
  console.log('3. 💊 Definire prestazioni mediche per ogni calendario');
  console.log('4. 📅 Creare agende per ogni dottore/sede');
  console.log('5. 🔄 Sincronizzare eventi GHL → prenotazioni CUP Solidale');

  // Considerazioni critiche
  console.log('\n⚠️  CONSIDERAZIONI CRITICHE:');
  console.log('- Codici fiscali dottori: RICHIESTI per CUP Solidale');
  console.log('- Coordinate geografiche: NECESSARIE per ogni sede');
  console.log('- Mapping prestazioni: DA DEFINIRE manualmente');
  console.log('- Gestione conflitti: DA IMPLEMENTARE');
  console.log('- Logging completo: IMPLEMENTARE per debugging');

  console.log('\n✅ TEST SUITE COMPLETATA');
  console.log('═'.repeat(60));

  return results;
}

// Se eseguito direttamente
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n🎉 Tutti i test completati!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Errore durante esecuzione test suite:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };