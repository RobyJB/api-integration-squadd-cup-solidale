require('dotenv').config();

async function testCupSolidaleConnection() {
  const apiUrl = process.env.CUP_SOLIDALE_API_URL;
  const username = process.env.CUP_SOLIDALE_COMPANY_CODE;
  const apiKey = process.env.CUP_SOLIDALE_API_KEY;

  console.log('🧪 Test Connessione API CUP Solidale');
  console.log('API URL:', apiUrl);
  console.log('Username presente:', !!username);
  console.log('API Key presente:', !!apiKey);

  if (!apiUrl || !username || !apiKey) {
    console.error('❌ Configurazione mancante! Verifica il file .env');
    console.log('Variabili richieste:');
    console.log('- CUP_SOLIDALE_API_URL');
    console.log('- CUP_SOLIDALE_COMPANY_CODE (codice azienda)');
    console.log('- CUP_SOLIDALE_API_KEY');
    return;
  }

  // Creazione delle credenziali Basic Auth
  const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');

  try {
    // Test 1: Connessione base con endpoint sedi
    console.log('\n🔍 TEST 1: Verifica connessione - Endpoint Sedi');
    
    const response = await fetch(`${apiUrl}/sedi/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Server:', response.headers.get('server'));

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Errore connessione:', responseText);
      
      if (response.status === 401) {
        console.log('\n💡 Suggerimenti per errore 401:');
        console.log('- Verifica il codice azienda (username)');
        console.log('- Verifica la API key');
        console.log('- Contatta info@cupsolidale.it per attivazione API');
      }
      
      return;
    }

    // Parse della risposta JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Errore parsing JSON:', e.message);
      console.log('Risposta grezza:', responseText);
      return;
    }

    console.log('✅ Connessione riuscita!');
    console.log('- Success:', data.success);
    console.log('- Tipo risposta:', Array.isArray(data.data) ? 'Array' : typeof data.data);

    if (data.success && data.data) {
      if (Array.isArray(data.data)) {
        console.log('- Numero sedi trovate:', data.data.length);
        
        if (data.data.length > 0) {
          console.log('\n📄 PRIMA SEDE TROVATA:');
          console.log(JSON.stringify(data.data[0], null, 2));
        }
      } else {
        console.log('- Messaggio:', data.data);
      }
    }

    // Test 2: Endpoint Prestazioni
    console.log('\n🔍 TEST 2: Verifica endpoint Prestazioni');
    
    const prestazioniResponse = await fetch(`${apiUrl}/prestazioni/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    const prestazioniText = await prestazioniResponse.text();
    const prestazioniData = JSON.parse(prestazioniText);

    console.log('Status Prestazioni:', prestazioniResponse.status);
    console.log('Success:', prestazioniData.success);
    
    if (prestazioniData.success && prestazioniData.data) {
      console.log('- Numero prestazioni:', prestazioniData.data.length || 'N/A');
      
      if (Array.isArray(prestazioniData.data) && prestazioniData.data.length > 0) {
        console.log('\n📄 PRIMA PRESTAZIONE TROVATA:');
        console.log(JSON.stringify(prestazioniData.data[0], null, 2));
      }
    }

    // Test 3: Endpoint Dottori
    console.log('\n🔍 TEST 3: Verifica endpoint Dottori');
    
    const dottoriResponse = await fetch(`${apiUrl}/dottori/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    const dottoriText = await dottoriResponse.text();
    const dottoriData = JSON.parse(dottoriText);

    console.log('Status Dottori:', dottoriResponse.status);
    console.log('Success:', dottoriData.success);
    
    if (dottoriData.success && dottoriData.data) {
      console.log('- Numero dottori:', dottoriData.data.length || 'N/A');
      
      if (Array.isArray(dottoriData.data) && dottoriData.data.length > 0) {
        console.log('\n📄 PRIMO DOTTORE TROVATO:');
        console.log(JSON.stringify(dottoriData.data[0], null, 2));
      }
    }

    // Test 4: Endpoint Agende
    console.log('\n🔍 TEST 4: Verifica endpoint Agende');
    
    const agendeResponse = await fetch(`${apiUrl}/agende/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    const agendeText = await agendeResponse.text();
    const agendeData = JSON.parse(agendeText);

    console.log('Status Agende:', agendeResponse.status);
    console.log('Success:', agendeData.success);
    
    if (agendeData.success && agendeData.data) {
      console.log('- Numero agende:', agendeData.data.length || 'N/A');
      
      if (Array.isArray(agendeData.data) && agendeData.data.length > 0) {
        console.log('\n📄 PRIMA AGENDA TROVATA:');
        console.log(JSON.stringify(agendeData.data[0], null, 2));
      }
    }

    console.log('\n✅ TEST COMPLETATO - API CUP Solidale funzionante!');
    console.log('\n📋 RIEPILOGO STATO:');
    console.log(`- Sedi: ${data.success && data.data ? (Array.isArray(data.data) ? data.data.length : 'Disponibile') : 'Errore'}`);
    console.log(`- Prestazioni: ${prestazioniData.success ? 'Disponibile' : 'Errore'}`);
    console.log(`- Dottori: ${dottoriData.success ? 'Disponibile' : 'Errore'}`);
    console.log(`- Agende: ${agendeData.success ? 'Disponibile' : 'Errore'}`);

    return {
      sedi: data,
      prestazioni: prestazioniData,
      dottori: dottoriData,
      agende: agendeData
    };

  } catch (error) {
    console.error('❌ Errore durante test:', error.message);
    console.log('\n🔧 DEBUG INFO:');
    console.log('- URL utilizzato:', `${apiUrl}/sedi/`);
    console.log('- Credentials length:', credentials.length);
    console.log('- Error type:', error.constructor.name);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  testCupSolidaleConnection();
}

module.exports = { testCupSolidaleConnection };