require('dotenv').config();

async function testGHLUsersAPI() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID || 'i30YnwSzJ1ld5lsxtnb2';

  console.log('🧪 Test API GoHighLevel Users → CUP Solidale Dottori');
  console.log('API Key presente:', !!apiKey);
  console.log('Location ID:', locationId);

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/users/?locationId=${locationId}`, {
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
    console.log('- Totale utenti:', data.users?.length);
    console.log('- TraceId:', data.traceId);

    // ANALISI DETTAGLIATA PER MAPPING CUP SOLIDALE
    if (data.users && data.users.length > 0) {
      console.log('\n📊 ANALISI STRUTTURA PER CUP SOLIDALE:');
      console.log('- Campi primo utente:', Object.keys(data.users[0]));
      
      // JSON COMPLETO PRIMO UTENTE
      console.log('\n📄 JSON COMPLETO PRIMO UTENTE:');
      console.log(JSON.stringify(data.users[0], null, 2));

      // JSON COMPLETO SECONDO UTENTE (se esiste)
      if (data.users[1]) {
        console.log('\n📄 JSON COMPLETO SECONDO UTENTE:');
        console.log(JSON.stringify(data.users[1], null, 2));
      }

      // ANALISI RUOLI
      console.log('\n👥 ANALISI RUOLI:');
      const roleStats = {};
      data.users.forEach(user => {
        const roleKey = `${user.roles?.type}_${user.roles?.role}`;
        roleStats[roleKey] = (roleStats[roleKey] || 0) + 1;
      });
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`- ${role}: ${count} utenti`);
      });

      // MAPPING POTENZIALE PER CUP SOLIDALE
      console.log('\n🏥 MAPPING POTENZIALE CUP SOLIDALE:');
      data.users.forEach((user, index) => {
        console.log(`\n--- UTENTE ${index + 1} ---`);
        console.log('GHL User ID:', user.id);
        console.log('Nome completo:', `${user.firstName} ${user.lastName}`);
        console.log('Email:', user.email);
        console.log('Telefono:', user.phone);
        console.log('Ruolo:', `${user.roles?.type}/${user.roles?.role}`);
        
        // Suggerimenti per mapping CUP Solidale
        console.log('\n🔄 MAPPING CUP SOLIDALE:');
        console.log(`- id_dottore: "${user.id}"`);
        console.log(`- nome: "${user.firstName}"`);
        console.log(`- cognome: "${user.lastName}"`);
        console.log(`- codice_fiscale: "DA_RICHIEDERE"`); // Serve per CUP Solidale
        console.log(`- email: "${user.email}"`);
        console.log(`- telefono: "${user.phone}"`);
      });

      // ANALISI SCOPES
      const firstUser = data.users[0];
      if (firstUser.scopes) {
        console.log('\n🔐 SCOPES PRIMO UTENTE:');
        console.log('- Numero scopes:', firstUser.scopes.length);
        console.log('- Prime 5 scopes:', firstUser.scopes.slice(0, 5));
        console.log('- Scopes completi:', JSON.stringify(firstUser.scopes, null, 2));
      }

      // STATISTICHE GENERALI
      console.log('\n📈 STATISTICHE GENERALI:');
      console.log('- Utenti con telefono:', data.users.filter(u => u.phone).length);
      console.log('- Utenti agency type:', data.users.filter(u => u.roles?.type === 'agency').length);
      console.log('- Utenti account type:', data.users.filter(u => u.roles?.type === 'account').length);
      console.log('- Utenti admin role:', data.users.filter(u => u.roles?.role === 'admin').length);
      console.log('- Utenti user role:', data.users.filter(u => u.roles?.role === 'user').length);

      // CONSIDERAZIONI PER CUP SOLIDALE
      console.log('\n⚠️  CONSIDERAZIONI CUP SOLIDALE:');
      console.log('- Codici fiscali mancanti: TUTTI (da richiedere manualmente)');
      console.log('- Prestazioni mediche: DA MAPPARE con endpoint separato');
      console.log('- Sedi operative: DA MAPPARE con le sedi CUP Solidale');
      console.log('- Specializzazioni: DA DEFINIRE in base al ruolo/permessi');
    }

    console.log('\n🎯 TEST COMPLETATO - Dati pronti per mapping CUP Solidale!');
    console.log('Prossimi passi:');
    console.log('1. Mappare utenti → dottori');
    console.log('2. Richiedere codici fiscali');
    console.log('3. Definire prestazioni per ogni dottore');
    console.log('4. Creare mapping con sedi CUP Solidale');
    
    return data;

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  testGHLUsersAPI();
}

module.exports = { testGHLUsersAPI };