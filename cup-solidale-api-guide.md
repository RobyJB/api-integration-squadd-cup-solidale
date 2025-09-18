API Cupsolidale v.1.5
API Cupsolidale per la gestione di agende, dottori, disponibilità, prestazioni, sedi e prenotazioni.


Grazie alle REST API puoi integrare il tuo software con CupSolidale.it in modo semplice e rapido.

Le RESTFul API si asano sui metodo HTTP quindi per l'integrazione potra utilizzare un client HTTP scritto in un qualsiasi linguaggio di programmazione.


Tramite le API sarà possibile effettuare, all'interno del sistema Cupsolidale, le seguenti operazioni:

Inserire/Aggiornare delle sedi geolocalizzate
Inserire/Aggiornare delle prestazioni interne ed associarle alle prestazioni Cupsolidale
Inserire/Aggiornare i propri dottori con la propria lista di prestazioni
Inserire/Aggiornare un'agenda e generare disponibilità sul portale
Inserire/Aggiornare una prenotazione o un periodo non disponibile
Recuperare tutti gli ordini effettuati per l'azienda corrispondente
Definizioni

Azienda fatturante: specifica l'azienda, partner di Cupsolidale
Sedi: è il luogo nel quale verrà effettuata la visita
Dottori: chi fornisce la prestazione
Prestazioni: è la visita al quale il paziente si sottopone
Agende: indica un periodo di disponibilità per un dottore, una prestazione ed una sede
Prenotazioni: sono le visite prenotate sul portale di Cupsolidale
Blocchi (temporali): sono periodi nei quali non è possibile prenotare
Ordine di chiamate
Creazione sedi
Creazione prestazioni
Creazione Dottori, associando le prestazioni che possono effettuare
Creazione Agenda per il Dottore in Sede per una serie di prestazioni

Prima di iniziare
Se non lo hai già fatto contatta info@cupsolidale.it e richiedi l'abilitazione alle API e la tua API key.
L'indirizzo API di produzione è il seguente:

https://api.cupsolidale.it/api/v1
mentre l'indirizzo di sviluppo, sul quale sarà possibile effettuare tutti i vari test, è il seguente:
https://sandboxapi.cupsolidale.it/api/v1
.
Il dominio delle API, sia produzione sia sviluppo, sarà disponibile solo ed esclusivamente (per motivi di sicurezza) al protocollo HTTPS.

Autenticazione & Richieste
Tutte le richieste API necessitano di una autenticazione tramite HTTP Basic Auth.
L'username e la password saranno forniti al momento dell'attivazione.
L'username dovrà assumere il valore del codice azienda, riportato nella parte alta del menù di sinistra in amministrazione di cupsolidale.it.
La password dovrà assumere il valore dell'api_key, riportato nel profilo azienda accessibile anch'esso dall'amministrazione di cupsolidale.it.
Nel caso in cui le credenziali inserite, al momento di una richiesta API, non fossero corrette o ancora disabilitate riceveremo in risposta un errore.
Tutte le richieste effettuate, di qualsiasi metodo, dovranno avere l'encoding UTF-8.
N.B. Le richieste con metodo POST e DELETE dovranno avere Content-type: application/json.


Formato di Risposta & Errori
Tutte le richieste API risponderanno un JSON, sia in caso di errore sia in caso di buon fine.
Esempi di formato:
Errore:

{
    "success": false,
    "error": {
        "code": 400,
        "message": "Il content-type deve essere application\/json"
    }
}


Caso di successo:
{
    "success": true,
    "data": [
        {
            "id_sede": "test_123",
            "stato": "disattiva",
            "indirizzo": "via lanza",
            "nome": "test",
            "latitude": 3,
            "longitude": 10.5
        }
    ]
}


La chiave success è un boolean ed indica se la richiesta è andata a buon fine o no.
Nel caso di esito positivo (success: true) troveremo, nella chiave data, i dati relativi alla richiesta. In base all'endpoint questa chiave potrà essere stringa o una lista di oggetti (come nell'esempio).

Nel caso di esito negativo (success: false), non troveremo una chiave data bensì una chiave error, contenente il codice e la descrizione dell'errore.
Il codice definito nella chiave code ricorda i codici dello status_code delle richieste: nell'esempio non è stato settato correttamente il content-type della richiesta, perciò 400 indica un "Bad Request".
Tutti gli endpoint con metodo POST supportano due tipologie di JSON di risposta, selezionabile tramile la chiave "detailed_response": true. Se la chiave, all'interno del body della richiesta, è settata a true verrà mostrata la risposta in "long form", con i dettagli di ciò che si è appena inserito/aggiornato.

Di default, quindi se la chiave non è specificata, la risposta sarà in "short form" indicando solo quanti oggetti sono stati inseriti/aggiornati correttamente.


Paginazione & Limiti
Nel caso di un endpoint di Listing i risultati sono suddivisi in più pagine. I link della paginazione sarà presente nella chiave, nella risposta, denominata paging, es:

"paging": {
        "next": "https://api.cupsolidale.it/api/v1/prenotazioni/?pagination=1"
    }
Nel caso di un endpoint con metodo POST il limite in input è di massimo 1000 elementi. Ad esempio, se è necessario inserire 1200 prestazioni sarà necessario dividere il payload in più richieste. Nel caso il limite fosse superato, l'endpoint segnalerà errore.


Sedi
In questo endpoint sarà possibile effettuare la creazione, l’aggiornamento, la lettura e la eliminazione delle sedi.

Le sedi dovranno essere sempre geolocalizzate per permettere di essere visualizzare nella ricerca di Cupsolidale.

L’id univoco che identifica la sede è un valore alfanumerico che deve essere utilizzato per tutte le future richieste.

 Listing
Effettuata una richiesta a questo endpoint verranno recuperate le sedi relative all’azienda definita tramite il Basic Auth.

Se nell’url della richiesta è definito un id_sede e.g /sedi/test_123 la risposta mostrerà solo il dettaglio della sede (se esiste).

Curl
HTTP
curl -X GET -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/sedi/test_12"
Richiesta di un dettaglio sede tramite un id non esistente
Elenco ti tutte le sedi inserite per l'azienda
Dettaglio della sede con id test_123 relativo all'azienda
curl -X GET -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/sedi/test_id_inesistente"
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	82
content-type	application/json
date	Fri, 20 Apr 2018 15:48:58 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": false,
    "error": {
        "code": 204,
        "message": "0 sedi trovate"
    }
}
 Add | Update
I campi minimi richiesti per l’aggiunta e l’aggiornamento di una sede sono i seguenti: id_sede, nome, indirizzo, longitudine, latitudine.

Le chiavi di localizzazione, longitudine e latitudine devono essere di tipo numerico.

L’id_sede è obbligatorio in quanto identifica la sede in tutte le future richieste.

In una singola richiesta possono essere aggiunte più sedi.

Curl
HTTP
curl -X POST -H "Content-Type: application/json" -H "Authorization: Basic basic_auth_encoding_here" -d '{
  "offices": [
    {
      "id_sede":"001",
      "nome":"Clinica di test",
      "indirizzo": "Via Fasulla, 123",
      "description":"La clinica di test opera da più di 10 anni su tutto il territorio nazionale.",
      "longitudine": 11.02415,
      "latitudine": 43.52114
    }
  ]
}' "https://api.cupsolidale.it/api/v1/sedi/add"
Aggiunta di una o più sedi
Esempio di richiesta non valido - Manca la chiave indirizzo
curl --request POST \
--url https://api.cupsolidale.it/api/v1/sedi/add \
--header 'Authorization: Basic basic_auth_encoding_here' \
--header 'Content-Type: application/json' \
--data '{
    "offices": [
        {
          "id_sede":"001",
          "nome":"Clinica di test",
          "description":"La clinica di test opera da più di 10 anni su tutto il territorio nazionale.",
          "longitudine": 11.02415,
          "latitudine": 43.52114
        }
    ]
}'
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	172
content-type	application/json
date	Fri, 20 Apr 2018 15:52:05 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": "2 sedi aggiunte"
}
 Delete
Per disattivare una sede è necessario effettuare questa richiesta con l’id_sede relativo.

Curl
HTTP
curl -X DELETE -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" -H "Content-Type: application/json" -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/sedi/test_123"
Response
curl --request DELETE \
  --url https://api.cupsolidale.it/api/v1/sedi/test_123 \
  --header 'Authorization: Basic basic_auth_encoding_here' \
  --header 'Content-Type: application/json' \
  --data '{
  "offices": [
    {
      "id_sede":"001",
      "nome":"Clinica di test",
      "indirizzo": "Via Fasulla, 123",
      "description":"La clinica di test opera da più di 10 anni su tutto il territorio nazionale.",
      "longitudine": 11.02415,
      "latitudine": 43.52114
    }
  ]
}'
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	89
content-type	application/json
date	Fri, 20 Apr 2018 15:59:41 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": {
        "id_sede": "test_123",
        "status": "Disattivata",
        "name": "test"
    }
}
Prestazioni
In questo endpoint sarà possibile effettuare la creazione, l’aggiornamento, la lettura e la eliminazione delle prestazioni.

Le prestazioni dovranno essere associate alle prestazioni già presenti su Cupsolidale. Questo è un passaggio che viene effettuato in automatico, secondo alcune regole di matching, e in modo manuale tramite amministratore cupsolidale.e

L’id univoco che identifica la prestazione è un valore alfanumerico che deve essere utilizzato per tutte le future richieste.

 Listing
Effettuata una richiesta a questo endpoint verranno recuperate tutte le prestazioni relative all’azienda definita tramite il Basic Auth.

Se nell’url della richiesta è definito un id_prestazione e.g /prestazione/test_123 la risposta mostrerà solo il dettaglio della prestazione corrispondente (se esiste).

Nel caso in cui ci siano molte prestazioni sarà necessario utilizzare la paginazione per navigare le varie pagine di risposta.

L’url della richiesta da effettuare è specificata nella chiave paging presente nella risposta (dove ci sono almeno 20 o più prestazioni).

Curl
HTTP
curl -X GET -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/prestazioni/test1"
Elenco di tutte le prestazioni inserite per l'azienda relativa (con paginazione)
Recupera il dettaglio di una singola prestazione (se esiste) recuperata tramite l'id
Nessuna prestazione trovata
curl --request GET \
  --url https://api.cupsolidale.it/api/v1/prestazioni \
  --header 'Authorization: Basic basic_auth_encoding_here'
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	4058
content-type	application/json
date	Fri, 20 Apr 2018 16:04:22 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": [
        {
            "id_prestazione": "rag056",
            "status": "attiva",
            "nome": "Ecg Medico",
            "prezzo": 20,
            "descrizione": "CAR005 ECG MEDICO ECG",
            "categoria": "diagnostica",
            "durata": 20
        },
        {
            "id_prestazione": "rag057",
            "status": "attiva",
            "nome": "Ecg Pediatrico Medico",
            "prezzo": 10,
            "descrizione": "CAR004 ECG PEDIATRICO MEDICO ECG PED",
            "categoria": "diagnostica",
            "durata": 20
        },
        ....
        {
            "id_prestazione": "rag139",
            "status": "attiva",
            "nome": "ALBUMINA",
            "prezzo": 3,
            "descrizione": "
Proteina presente nel plasma, sintetizzata dal fegato. 

Diminuisce nelle gravi insufficienze epatiche (es. cirrosi), in caso di malnutrizione proteica (Kwashiorkor) o per eccessiva eliminazione con le urine per alterazioni del filtro glomerulare, nel caso vi siano sintomi di disordini epatici o malattie del rene, quando si ha una perdita di peso inspiegabile, quando si hanno i sintomi associati a malnutrizione o preventivamente ad un ricovero pianificato.

Campione per analisi   sangue

Preparazione  digiuno da almeno 8 ore.

",
            "preparazione": "
 digiuno da almeno 8 ore.

",
            "categoria": "laboratorio",
            "durata": 1
        },
        {
            "id_prestazione": "rag153",
            "status": "attiva",
            "nome": "FOSFATASI ACIDA TOTALE",
            "prezzo": 4,
            "descrizione": "
Enzima presente nella prostata, nel fegato, nella milza, nei muscoli, nel midollo osseo, nei globuli rossi e nelle piastrine.Il dosaggio nella prostata serve come marcatore del carcinoma prostatico (anche se meno sensibile del PSA).

Aumenta in caso di morbo di Gaucher, osteopatie, ipertrofia della prostata, infarto del miocardio, mieloma multiplo, malattia di Paget, iperparatiroidismo, emolisi.

Campione per analisi   sangue 

",
            "categoria": "laboratorio",
            "durata": 1
        }
    ],
    "paging": {
        "next": "https://api.cupsolidale.it/api/v1/prenotazioni/?pagination=1"
    }
}
 Delete
Per disattivare una prestazione è necessario effettuare questa richiesta con l’id_prestazione relativo.

Curl
HTTP
curl -X DELETE -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/prestazioni/test123"
L'endpoint delete necessità di un content-type "application/json"
Disattivazione di una prestazione tramite il suo id (se esiste)
                                        
curl --request DELETE \
  --url https://api.cupsolidale.it/api/v1/prestazioni/test123 \
  --header 'Authorization: Basic basic_auth_encoding_here'
                                        

                                    
Status	400
connection	close
content-encoding	gzip
content-length	105
content-type	application/json
date	Fri, 20 Apr 2018 16:25:27 GMT
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": false,
    "error": {
        "code": 400,
        "message": "The content-type must be application\/json"
    }
}
 Add | Update
Tramite questa richiesta sarà possibile inserire le prestazioni di terze parti all’interno di Cupsolidale.

I dati minimi necessari alla creazione di una prestazione sono: id_prestazione, nome, prezzo, durata, categoria.

L’id_prestazione identifica la prestazione anche nelle future richieste. In aggiunta alle chiavi sopra riportate è possibile inserire una descrizione e una preparazione all’esame, entrambi devono assumere valori testuali e possono presentare tag HTML.

La chiave categoria può assumare uno dei seguenti valori: visita, laboratorio, diagnostica.

Il parametro aggiorna è un parametro opzionale che può assumere uno dei seguenti valori: singolo, forza_tutti, eccetto_singolo. Il valore singolo istruisce il sistema ad aggiornare esclusivamente la singola prestazione mantenendo inalterate le prestazioni di ogni singolo dottore; il valore forza_tutti istruisce il sistema ad aggiornare forzatamente la prestazione generale e tutte le prestazioni dei dottori anche se avevano il campo settato a singolo (è di fatto una sovrascrittura forzata); il valore eccetto_singolo istruisce il sistema ad aggiornare la singola prestazione globale e le prestazioni di tutti i dottori eccetto quelle prestazioni il cui campo era stato settato a singolo. Se il campo aggiorna viene omesso, il valore di default considerato sarà eccetto_singolo.

N.B Tutte le prestazioni inserite tramite API dovranno essere associate alle prestazioni presenti su Cupsolidale. Questo è un procedimento che viene effettuato in automatico durante l’importazione (seguendo dei criteri) e in modo manuale dall’amministratore Cupsolidale. Le prestazioni che non sono attive non potranno risultare prenotabili.

Curl
HTTP
curl -X POST -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" -d '{
"services": [
    {
      "nome": "Ecografia Ginocchio Sinistro [88.79.3]",
      "prezzo": 20,
      "durata":15,
      "categoria":"diagnostica",
      "id_prestazione":"test123",
      "aggiorna":"eccetto_singolo"
    }
  ]
}
' "https://api.cupsolidale.it/api/v1/prestazioni/add"
Aggiunta di una prestazione (+ descrizione)
Aggiunta di una prestazione con valori non validi
curl --request POST \
  --url https://api.cupsolidale.it/api/v1/prestazioni/add \
  --header 'Authorization: Basic basic_auth_encoding_here' \
  --header 'Content-Type: application/json' \
  --data '{
"services": [
        {
            "nome": "Ecografia Ginocchio Sinistro [88.79.3]",
            "prezzo": 20,
            "durata":15,
            "categoria":"diagnostica",
            "id_prestazione":"test123"
        }
    ]
}
'
                                    
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	754
content-type	application/json
date	Thu, 05 Apr 2018 13:43:30 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": "1 prestazioni aggiunte"
}
Dottori
In questo endpoint sarà possibile effettuare la creazione, l’aggiornamento, la lettura e la eliminazione dei dottori e delle proprie prestazioni.

I dottori dovranno essere associati alle prestazioni caricate o in precedenza o in contemporanea nella creazione/aggiornamento del dottore stesso.

L’id univoco che identifica il dottore è un valore alfanumerico che deve essere utilizzato per tutte le future richieste.

 Add | Update
Tramite questa richiesta sarà possibile inserire i dottori, con le relative prestazioni associate per poter poi creare la disponibilità.

I dati minimi necessari alla creazione di un dottore sono: nome, cognome, codice_fiscale, id_dottore.

In aggiunta a queste chiavi è possibile aggiungere una lista di prestazioni che il dottore può effettuare. La lista, contentente una serie di oggetti prestazione, deve seguire il format presentato nell’endpoint relativo alle prestazioni, ovvero: nome, prezzo, durata, id_prestazione, categoria.

All'interno di ogni prestazione del dottore è possibile inserire il parametro opzionale aggiorna che può assumere uno dei seguenti valori: singolo, forza_tutti, eccetto_singolo. Il valore singolo istruisce il sistema ad aggiornare la prestazione solo per il dottore in questione; il valore forza_tutti istruisce il sistema ad aggiornare forzatamente la singola prestazioni globale, il singolo dottore e tutti gli altri dottori anche se avevano il campo settato a singolo (è di fatto una sovrascrittura forzata); il valore eccetto_singolo istruisce il sistema ad aggiornare la singola prestazione globale e le prestazioni di tutti i dottori eccetto quelle il cui campo era stato settato a singolo. Se il campo aggiorna viene omesso, il valore di default considerato sarà eccetto_singolo.

L’id_dottore deve essere fornito sempre e rappresenta il dottore così da permettere eventuali aggiornamenti.

Curl
HTTP
curl -X POST -H "Content-Type: application/json" -H "Authorization: Basic basic_auth_encoding_here" -d '{
  "doctors":[
    {
      "nome":"Dottore",
      "cognome": "di Test",
      "codice_fiscale": "DTTESH65PD612P",
      "id_dottore":"123",
      "prestazioni": [
        {
          "nome": "Prestazione di test",
          "prezzo": 10,
          "durata": 20,
          "id_prestazione": "test_321",
          "categoria": "diagnostica"
        },
        {
          "nome": "Rx Ginocchio DX",
          "prezzo":45,
          "durata":15,
          "id_prestazione":"interna_test_541",
          "categoria":"diagnostica",
          "aggiorna":"singolo"
        }
      ]
    }
  ]
}' "https://api.cupsolidale.it/api/v1/dottori/add"
Response
curl --request POST \
  --url https://api.cupsolidale.it/api/v1/dottori/add \
  --header 'Authorization: Basic basic_auth_encoding_here' \
  --header 'Content-Type: application/json' \
  --data '{
  "doctors":[
    {
      "nome":"Dottore",
      "cognome": "di Test",
      "codice_fiscale": "DTTESH65PD612P",
      "id_dottore":"123",
      "prestazioni": [
        {
          "nome": "Prestazione di test",
          "prezzo": 10,
          "durata": 20,
          "id_prestazione": "test_321",
          "categoria": "diagnostica"
        },
        {
          "nome": "Rx Ginocchio DX",
          "prezzo":45,
          "durata":15,
          "id_prestazione":"interna_test_541",
          "categoria":"diagnostica"
        }
      ]
    }
  ]
}'
                                    
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	173
content-type	application/json
date	Thu, 29 Mar 2018 15:21:48 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": "Sono stati aggiornati 1 dottore e 2 prestazioni"
}
 Listing
Effettuata una richiesta a questo endpoint verranno recuperate i dottori relativi all’azienda definita tramite il Basic Auth.

Se nell’url della richiesta è definito un id_dottore e.g /dottore/test_123 la risposta mostrerà solo il dettaglio del dottore corrispondente (se esiste).

Curl
HTTP
curl -X GET -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/dottori/123"
Elenco di tutti i dottori per l'azienda
Dettaglio di un dottore tramite il suo id
curl --request GET \
  --url https://api.cupsolidale.it/api/v1/dottori \
  --header 'Authorization: Basic basic_auth_encoding_here'
                                    
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	245
content-type	application/json
date	Fri, 20 Apr 2018 16:51:49 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": [
        [
            {
                "id_dottore": "123",
                "nome": "Dottore di Test",
                "status": "attivo",
                "services": [
                    {
                        "id_prestazione": "test_321",
                        "status": "disattivo",
                        "id_dottore": "123",
                        "nome": "Prestazione di test"
                    },
                    {
                        "id_prestazione": "interna_test_541",
                        "status": "attivo",
                        "id_dottore": "123",
                        "nome": "Rx Ginocchio DX"
                    }
                ]
            }
        ],
        [
            {
                "id_dottore": "test_miki",
                "nome": "Miki Aperion",
                "status": "attivo",
                "services": [
                    {
                        "id_prestazione": "s7892",
                        "status": "attivo",
                        "id_dottore": "test_miki",
                        "nome": "Radiografia Ginocchio DX"
                    },
                    {
                        "id_prestazione": "s7898",
                        "status": "attivo",
                        "id_dottore": "test_miki",
                        "nome": "ACIDO URICO (URATO EMATICO)\tURATO EMATICO"
                    }
                ]
            }
        ]
    ]
}
 Delete
Per disattivare un dottore è necessario effettuare questa richiesta con l’id_dottore relativo.

Curl
HTTP
curl -X DELETE -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" "https://api.cupsolidale.it/api/v1/dottori/123"
Response
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	82
content-type	application/json
date	Fri, 20 Apr 2018 16:50:52 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": {
        "id_dottore": "123",
        "status": "Disattivato"
    }
}
 Delete Prestazioni da Dottore
Per disattivare una prestazione da un dottore (es. perché non viene più effettuata) è necessario effettuare questa richiesta specificando l’id_dottore dal quale rimuovere la prestazione e l’id_prestazione relativo.

Se questi due criteri verranno matchati, la prestazione sarà rimossa dall’associazione con il dottore.

In caso non venisse trovata la prestazione o il dottore, verrà segnalato l’errore.

Curl
HTTP
curl -X DELETE -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" "https://api.cupsolidale.it/api/v1/dottori/123/prestazioni/test_124"
Rimuove una prestazione, test124, associata al dottore, 123
Tentativo di rimozione prestazione da un dottore non esistente
curl --request DELETE \
  --url https://api.cupsolidale.it/api/v1/dottori/123/test124 \
  --header 'Authorization: Basic basic_auth_encoding_here' \
  --header 'Content-Type: application/json'
                                    
Status	200
{
    "success": true,
    "data": [
        {
            "id_dottore": 123,
            "id_prestazione": "test124",
            "status": "Prestazione disattivata"
        }
    ]
}
Agende
In questo endpoint sarà possibile effettuare la creazione, l’aggiornamento, la lettura e la eliminazione delle agende.

Le agende dovranno presentare un dottore, una sede, almeno una prestazione attiva (quindi associata al dottore) ed un periodo di disponibilità valido per poter essere visualizzate su cupsolidale.

L’id univoco che identifica le agende è un valore alfanumerico che deve essere utilizzato per tutte le future richieste.

Se non si dispone di un id univoco, sarà necessario crearlo prima di effettuare la richiesta.

Se non presente la richiesta restituirà un Status Code: 400.

 Agende Listing
Effettuata una richiesta a questo endpoint verranno recuperate le agende relative all’azienda definita tramite il Basic Auth.

Se nell’url della richiesta è definito un id_agenda e.g /agende/test_agenda_987 la risposta mostrerà solo il dettaglio dell’agenda corrispondente (se esiste).

Curl
HTTP
curl -X GET -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/agende/test_agenda_987"
Dettaglio agenda tramite id
Nessuna agenda
curl --request GET \
  --url https://api.cupsolidale.it/api/v1/agende/test_agenda_987 \
  --header 'Authorization: Basic basic_auth_encoding_here'
                                    
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	251
content-type	application/json
date	Mon, 23 Apr 2018 09:12:38 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": [
        {
            "id_agenda": "test_agenda_987",
            "data_inizio": "2018-04-20",
            "data_fine": "2018-06-30",
            "ora_inizio": "09:00",
            "ora_fine": "13:00",
            "giorni_settimana": [
                "lun",
                "mar",
                "mer",
                "gio",
                "ven",
                "sab"
            ],
            "orari": [
                {
                    "ora_inizio": "09:00",
                    "ora_fine": "13:00"
                },
                {
                    "ora_inizio": "15:00",
                    "ora_fine": "19:00"
                }
            ],
            "office": {
                "id_sede": "sede_1",
                "name": "Sede test"
            },
            "doctor": {
                "id_dottore": "123",
                "nome": "Dottore di Test"
            },
            "service": [
                {
                    "id_prestazione": "interna_test_541",
                    "nome": "Rx Ginocchio DX",
                    "prezzo": 15,
                    "durata": 20
                }
            ]
        }
    ]
}
 Add | Update
Tramite questa richiesta sarà possibile inserire un agenda per i vari dottori nelle varie sedi, così da creare poi la disponibilità su Cupsolidale. Prima di effettuare una richiesta a questo endpoint sarà quindi necessario inserire le varie sedi, i vari dottori con le prestazioni già associate ed attive.

Nel caso in cui il dottore o la sede o le prestazioni non fossero attive, la disponibilità non verrà creata.

I dati minimi necessari alla creazione di una agenda sono: id_agenda, id_dottore, id_sede, giorni_settimana, data_inizio, ora_inizio, data_fine, ora_fine.

L’id_agenda identifica l’agenda anche nelle future richieste. L’id_dottore e l’id_sede rappresentano il dottore e la sede precedentemente inseriti tramite le rispettive API.

I giorni_settimana rapprensentano i giorni della settimana nei quali ci può essere almeno una disponibilità. I valori che questa chiave può assumere sono i seguenti (in minuscolo): ‘lun, mar, mer, gio, ven, sab, dom’. Per specificare più giorni è necessario separare i vari valori da una virgola es: "giorni_settimana": "lun,gio,sab"

Le chiavi data_inizio e data_fine sono di tipo stringa e rappresentano il periodo nel quale l’agenda è attiva. La chiave orari contiene una lista di ora_inizio ed ora_fine in formato stringa corrispondente agli orari in cui l'agenda è attiva all’interno del periodo. Le date (data_inizio e data_fine) devono avere il seguente formato: "yyyy-mm-dd" mentre gli orari (ora_inizio e ora_fine) devono avere il seguente formato: "hh:mm".

Se il periodo risulta non essere nel formato corretto (o un periodo non valido), verrà segnalato un errore.

In aggiunta a queste chiavi è possibile aggiungere la chiave "prestazioni", contenente una lista di id_prestazione che il dottore, per questa agenda, può effettuare. Se non viene specificata questa chiave, verranno considerate tutte le prestazioni attive associate al dottore.

Curl
HTTP
curl -X POST -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" -d '{
  "calendar":[
    {
      "id_agenda": "test_agenda_987",
      "id_dottore": "123",
      "id_sede": "test_123",
      "giorni_settimana": "Mar,Gio",
      "data_inizio": "2018-04-23",
      "data_fine": "2018-06-30",
      "orari":[
        {
            "ora_inizio": "09:00",
            "ora_fine": "13:00"
        },
        {
            "ora_inizio": "15:00",
            "ora_fine": "19:00"
        }
      ]
    }
  ]
}' "https://api.cupsolidale.it/api/v1/agende/add"
Aggiunta di un'agenda con dottore inesistente o prestazioni non associate
Inserimento / Aggiornamento Agenda di un dottore già inserito con le sue prestazioni
Aggiunta di una agenda con solo due prestazioni
curl --request POST \
  --url https://api.cupsolidale.it/api/v1/agende/add \
  --header 'Authorization: Basic basic_auth_encoding_here' \
  --header 'Content-Type: application/json' \
  --data '{
  "calendar":[
    {
      "id_agenda": "test_agenda_987",
      "id_dottore": "1234",
      "id_sede": "test_123",
      "giorni_settimana": "Mar,Gio",
      "data_inizio": "2018-04-23",
      "data_fine": "2018-06-30",
      "orari":[
        {
            "ora_inizio": "09:00",
            "ora_fine": "13:00"
        },
        {
            "ora_inizio": "15:00",
            "ora_fine": "19:00"
        }
      ]
    }
  ]
}'
                                    
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	131
content-type	application/json
date	Mon, 23 Apr 2018 09:02:04 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "error": {
        "code": 400,
        "message": "Ricontrollare se ci sono prestazioni attive per il dottore: 1234 e se la sede: test_123 \u00e8 attiva."
    }
}
 Agende Delete Singole
Per disattivare una agenda è necessario effettuare questa richiesta con l’id_agenda relativo.

L’eliminazione di un'agenda rimuoverà anche le eventuali disponibilità presenti.

Curl
HTTP
DELETE /v1/agende/215 HTTP/1.1
Host: api.cupsolidale.it
Authorization: Basic basic_auth_encoding_here
 Agende Delete TUTTE
Per cancellare completamente TUTTE le agende e TUTTE le disponibilità attualmente presenti nel sistema. L'operazione è irreversibile.

Curl
HTTP
DELETE /v1/agende/removeall HTTP/1.1
Host: api.cupsolidale.it
Authorization: Basic basic_auth_encoding_here
Slot
In questa sezione sono descritti gli endpoint per l'aggiunta e la rimozione delle disponibilità per ciascun dottore.

Gli slot rappresentano le disponibilità effettive che possono essere prenotate dagli utenti tramite il portale Cup Solidale.

 Add | Update
Questo endpoint consente di aggiungere o aggiornare fino a 5000 slot (disponibilità) per uno o più dottori. Le disponibilità possono essere inviate singolarmente o in batch.

Quando si aggiunge uno slot:

Vengono rimossi eventuali slot precedenti con la stessa data per lo stesso id_dottore
Viene effettuata una validazione automatica su tutti i campi
Eventuali sovrapposizioni con prenotazioni o indisponibilità vengono automaticamente gestite
I campi prezzo e id_orario sono opzionali. In caso non venissero passati, il campo id_orario verrà generato automaticamente mentre il prezzo verrà ricavato direttamente dalle prestazioni aggiunte tramite il relativo endpoint.


Curl
HTTP
curl -X POST -H "Authorization: Basic base64credentials" -H "Content-Type: application/json" -d '{
  "availabilities": [
    {
      "id_dottore": "123",
      "id_sede": "456",
      "id_prestazione": "789",
      "id_disponibilita": "2024-06-01|mat",
      "data": "2024-06-01",
      "prezzo": 45.00,
      "orari": [
        {
          "id_orario": "CONTR123|001",
          "ora_inizio": "08:30",
          "ora_fine": "08:50"
        },
        {
          "ora_inizio": "09:00",
          "ora_fine": "09:20"
        }
      ]
    }
  ]
}' "https://api.cupsolidale.it/api/v1/disponibilita/add"
Risposta:

Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	88
content-type	application/json
date	Fri, 20 Apr 2018 16:24:46 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
  "success": true,
  "data": "1 disponibilita inserite"
}
 Delete Giorni Disponibilità
Questo endpoint consente di rimuovere blocchi di disponibilità per uno o più dottori, specificando un intervallo di date. È possibile inviare fino a 2000 elementi per richiesta.

I campi obbligatori per ciascun oggetto sono:

id_dottore: identificativo del medico
data_inizio: data iniziale del range (YYYY-MM-DD)
data_fine: data finale del range (YYYY-MM-DD)
Facoltativamente è possibile includere anche:

id_prestazione
id_sede
Il formato delle date deve essere yyyy-mm-dd.

Curl
HTTP
curl -X POST -H "Authorization: Basic base64credentials" -H "Content-Type: application/json" -d '{
  "availabilities": [
    {
      "id_dottore": "123",
      "id_prestazione": "test_321",
      "data_inizio": "2024-04-22",
      "data_fine": "2024-04-23"
    }
  ]
}' "https://api.cupsolidale.it/api/v1/disponibilita/remove_days"
Risposta:

Status	200
{
  "success": true,
  "data": "2 giorni rimossi"
}
Prenotazioni Cup Solidale
In questo endpoint sarà possibile effettuare la lettura delle prenotazioni effettuate sul portale di Cup Solidale.

 Listing
Mostrerà un elenco di prenotazione completate e/o annullate effettuate per l’azienda sul portale di Cupsolidale.

I filtri, che potranno essere passati in query string, sono:

status: [‘completata’, ‘cancellata’]
time: 1, 3, 6, 12, 24, 48 - Se settato filtra le prenotazioni effettuate nelle x precedenti ore
extended: [‘true’, ‘false’] - Se settato estende i dati delle prenotazioni, aggiungendo anche gli id delle varie entità coinvolte
Curl
HTTP
curl -X GET -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/prenotazioni/"
Recupero prenotazioni
Recupero prenotazioni - Esteso
Empty Listing
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	807
content-type	application/json
date	Mon, 16 Apr 2018 13:03:02 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": [
        {
            "id_prenotazione": 11259,
            "sede": "NUOVA IGEA",
            "dottore": "Carmen Zumpano",
            "data_prestazione": "2018-04-27 16:30",
            "nome_prestazione": "Ecografia Mammaria",
            "dati_cliente": "valentina marino (vm4579@gmail.com) MRNVNT98L50A717H",
            "dati_paziente": "valentina marino (vm4579@gmail.com) MRNVNT98L50A717H",
            "euro_struttura": 77,
            "euro_portale": 5,
            "euro_totale": 82,
            "metodo_pagamento": "office"
        },
        {
            "id_prenotazione": 11233,
            "sede": "NUOVA IGEA",
            "dottore": "Sirio Garbocci",
            "data_prestazione": "2018-04-26 12:40",
            "nome_prestazione": "Ecografia Addome Completo",
            "dati_cliente": "roberto fallani (fallani.roberto@libero.it) FLLRRT73R22D612B",
            "dati_paziente": "roberto fallani (fallani.roberto@libero.it) FLLRRT73R22D612B",
            "euro_struttura": 81.69,
            "euro_portale": 5.31,
            "euro_totale": 87,
            "metodo_pagamento": "office"
        },
        {
            "id_prenotazione": 10994,
            "sede": "Punto Prelievo - Via Bessi",
            "dottore": "Prelievi",
            "data_prestazione": "2018-04-12 09:30",
            "nome_prestazione": "Vitamina D3 (liposolubile) (25 Oh)",
            "dati_cliente": "alessandro gerini (alessandrogerini87@libero.it) GRNLSN87L08D575R",
            "dati_paziente": "alessandro gerini (alessandrogerini87@libero.it) GRNLSN87L08D575R",
            "euro_struttura": 31.93,
            "euro_portale": 2.07,
            "euro_totale": 34,
            "metodo_pagamento": "office"
        },
        .....
        {
            "id_prenotazione": 10950,
            "sede": "NUOVA IGEA",
            "dottore": "Operatore Prestazioni Prestazioni",
            "data_prestazione": "2018-03-28 11:50",
            "nome_prestazione": "Hpv Cervicale Con Prelievo (real Time Pcr)",
            "dati_cliente": "giulia bernocchi (giulia.bernocchi@gmail.com) BRNGLI92E45D612Y",
            "dati_paziente": "giulia bernocchi (giulia.bernocchi@gmail.com) BRNGLI92E45D612Y",
            "euro_struttura": 61.03,
            "euro_portale": 3.97,
            "euro_totale": 65,
            "metodo_pagamento": "office"
        },
        {
            "id_prenotazione": 10940,
            "sede": "NUOVA IGEA",
            "dottore": "Carmen Zumpano",
            "data_prestazione": "2018-03-23 16:30",
            "nome_prestazione": "Ecografia Capo E Collo",
            "dati_cliente": "samuele tomeo (tomeo.globalsecur@gmail.com) TMOSML91P04A509W",
            "dati_paziente": "samuele tomeo (tomeo.globalsecur@gmail.com) TMOSML91P04A509W",
            "euro_struttura": 56.34,
            "euro_portale": 3.66,
            "euro_totale": 60,
            "metodo_pagamento": "paypal"
        }
    ],
    "paging": {
        "next": "https://api.cupsolidale.it/api/v1/prenotazioni/?pagination=1"
    }
}
 Cambia data prenotazione
Permette di modificare data e ora di una prenotazione esistente sul portale di Cup Solidale. La modifica aggiorna l'ordine e crea un blocco di indisponibilità relativo al nuovo orario.

I dati minimi necessari sono: invoice_id, where_id, new_date, new_time.

Curl
HTTP
curl -X POST \
  -H "Authorization: Basic basic_auth_encoding_here" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": 12345,
    "where_id": "624afc3fbc1f46a5418b456f",
    "new_date": "2025-08-25",
    "new_time": "10:30",
    "requestor": "app"
  }' \
  "https://api.cupsolidale.it/api/v1/prenotazioni/change_date"
Modifica effettuata
Parametri non validi
Status	200
{
  "success": true,
  "data": "1 elemento inserito"
}
Indisponibilità
Questa sezione descrive gli endpoint dedicati all'inserimento e alla rimozione di periodi di indisponibilità per un dottore.

È utile per bloccare giorni o fasce orarie in cui il medico non sarà disponibile (causa appuntamenti esterni a Cup Solidale, ferie, malattia, ect.), evitando la generazione di slot prenotabili.

 Add
Tramite questa richiesta sarà possibile inserire le indisponibilità di terze parti (prenotazioni, chiusure temporanee, ferie, etc.) all’interno di Cupsolidale.

I dati minimi necessari alla creazione di una prenotazione sono: id_prenotazione, id_dottore, id_sede, tipologia, data_inizio, ora_inizio, data_fine, ora_fine.

L’id_prenotazione identifica la prenotazione anche nelle future richieste.

L’indisponibilità verrà inserita all’interno del sistema di Cupsoldiale solo nel caso in cui, nel periodo selezionato, non ci siano già delle indisponibilità inserite. In tal caso segnalerà un errore.

Se non ci dovesse essere un dottore o la sede, segnalerà errore poiché non è possibile aggiungere una indisponibilità che non coincida con i dati inseriti all’interno del sistema.

Le chiavi data_inizio e data_fine devono essere nel formato: yyyy-mm-dd Le chiavi ora_inizio e ora_fine devono essere nel formato: hh:mm

Curl
HTTP
curl -X POST -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" -d '{
  "blocks": [
    {
      "id_indisponibilita": "indisponibilita18",
      "id_dottore": "doc123",
      "id_sede": "sede123",
      "tipologia":"indisponibile",
      "data_inizio": "2018-04-23",
      "ora_inizio": "09:00",
      "data_fine": "2018-04-23",
      "ora_fine": "18:00"
    }
  ]
}' "https://api.cupsolidale.it/api/v1/indisponibilita/add"
Aggiunta di indisponibilita
Errore nel periodo selezionato - Sono già presenti delle indisponibilita
curl -X POST -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" -d '{
  "blocks": [
    {
      "id_indisponibilita": "indisponibilita18",
      "id_dottore": "doc123",
      "id_sede": "sede123",
      "tipologia":"indisponibile",
      "data_inizio": "2018-04-23",
      "ora_inizio": "09:00",
      "data_fine": "2018-04-23",
      "ora_fine": "18:00"
    }
  ]
}' "https://api.cupsolidale.it/api/v1/indisponibilita/add"
Status	200
{
    "success": true,
    "data": "10 indisponibilità aggiunte"
}
 Delete
Per annullare una indisponibilità è necessario effettuare questa richiesta con l’id_indisponibilita relativa.

Curl
HTTP
curl -X DELETE -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" "https://api.cupsolidale.it/api/v1/indisponibilita/123"
Response
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	82
content-type	application/json
date	Fri, 20 Apr 2018 16:50:52 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": {
        "id_indisponibilita": "123",
        "status": "Rimossa"
    }
}
Prenotazioni DEPRECATA
API DEPRECATA - In questo endpoint sarà possibile effettuare la creazione e la cancellazione delle prenotazioni effettuate al di fuori del portale di Cup Solidale.

Le prenotazione rimuoveranno la disponibilità di Cupsolidale per il periodo passato in richiesta. Se il periodo non è valido, segnalerà errore.

L’id univoco che identifica la prenotazione è un valore alfanumerico che deve essere utilizzato per tutte le future richieste.

 Add
Tramite questa richiesta sarà possibile inserire le prenotazioni di terze parti all’interno di Cupsolidale.

I dati minimi necessari alla creazione di una prenotazione sono: id_prenotazione, id_dottore, id_sede, id_prestazione, tipologia, data_inizio, ora_inizio, data_fine, ora_fine.

L’id_prenotazione identifica la prenotazione anche nelle future richieste.

La prenotazione verrà inserita all’interno del sistema di Cupsoldiale solo nel caso in cui, nel periodo selezionato, non ci siano già delle prenotazioni inserite. In tal caso segnalerà un errore.

Se non ci dovesse essere un dottore o la sede o la prestazione, segnalerà errore poiché non è possibile aggiungere una prenotazione che non coincida con i dati inseriti all’interno del sistema.

Le chiavi data_inizio e data_fine devono essere nel formato: yyyy-mm-dd Le chiavi ora_inizio e ora_fine devono essere nel formato: hh:mm

Curl
HTTP
curl -X POST -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" -d '{
  "reservations": [
    {
      "id_prenotazione": "prenotazione87",
      "id_dottore": "doc123",
      "id_sede": "sede123",
      "id_prestazione": "test123",
      "tipologia":"indisponibile",
      "data_inizio": "2018-04-23",
      "ora_inizio": "09:00",
      "data_fine": "2018-04-23",
      "ora_fine": "18:00"
    }
  ]
}' "https://api.cupsolidale.it/api/v1/prenotazioni/add"
Aggiunte di prenotazioni
Errore nel periodo selezionato - Sono già presenti delle prenotazioni
curl -X POST -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" -d '{
  "reservations": [
    {
      "id_prenotazione": "prenotazione87",
      "id_dottore": "doc123",
      "id_sede": "sede123",
      "id_prestazione": "test123",
      "tipologia":"indisponibile",
      "data_inizio": "2018-04-23",
      "ora_inizio": "09:00",
      "data_fine": "2018-04-23",
      "ora_fine": "18:00"
    }
  ]
}' "https://api.cupsolidale.it/api/v1/prenotazioni/add"
Status	200
{
    "success": true,
    "data": "10 prenotazioni aggiunte"
}
 Delete
Per annullare una prenotazione è necessario effettuare questa richiesta con l’id_prenotazione relativa.

Curl
HTTP
curl -X DELETE -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" "https://api.cupsolidale.it/api/v1/prenotazioni/123"
Response
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	82
content-type	application/json
date	Fri, 20 Apr 2018 16:50:52 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": {
        "id_prenotazione": "123",
        "status": "Rimossa"
    }
}
 Listing
Mostrerà un elenco di prenotazione completate e/o annullate effettuate per l’azienda sul sito di Cupsolidale.

I filtri, che potranno essere passati in query string, sono:

status: [‘completata’, ‘cancellata’]
time: 1, 3, 6, 12, 24, 48 - Se settato filtra le prenotazioni effettuate nelle x precedenti ore
extended: [‘true’, ‘false’] - Se settato estende i dati delle prenotazioni, aggiungendo anche gli id delle varie entità coinvolte
Curl
HTTP
curl -X GET -H "Authorization: Basic basic_auth_encoding_here" "https://api.cupsolidale.it/api/v1/prenotazioni/"
Recupero prenotazioni
Recupero prenotazioni - Esteso
Empty Listing
Status	200
connection	Keep-Alive
content-encoding	gzip
content-length	807
content-type	application/json
date	Mon, 16 Apr 2018 13:03:02 GMT
keep-alive	timeout=5, max=100
server	Apache/2.2.22 (Debian)
vary	Accept-Encoding
x-powered-by	PHP/5.4.45-0+deb7u2
{
    "success": true,
    "data": [
        {
            "id_prenotazione": 11259,
            "sede": "NUOVA IGEA",
            "dottore": "Carmen Zumpano",
            "data_prestazione": "2018-04-27 16:30",
            "nome_prestazione": "Ecografia Mammaria",
            "dati_cliente": "valentina marino (vm4579@gmail.com) MRNVNT98L50A717H",
            "dati_paziente": "valentina marino (vm4579@gmail.com) MRNVNT98L50A717H",
            "euro_struttura": 77,
            "euro_portale": 5,
            "euro_totale": 82,
            "metodo_pagamento": "office"
        },
        {
            "id_prenotazione": 11233,
            "sede": "NUOVA IGEA",
            "dottore": "Sirio Garbocci",
            "data_prestazione": "2018-04-26 12:40",
            "nome_prestazione": "Ecografia Addome Completo",
            "dati_cliente": "roberto fallani (fallani.roberto@libero.it) FLLRRT73R22D612B",
            "dati_paziente": "roberto fallani (fallani.roberto@libero.it) FLLRRT73R22D612B",
            "euro_struttura": 81.69,
            "euro_portale": 5.31,
            "euro_totale": 87,
            "metodo_pagamento": "office"
        },
        {
            "id_prenotazione": 10994,
            "sede": "Punto Prelievo - Via Bessi",
            "dottore": "Prelievi",
            "data_prestazione": "2018-04-12 09:30",
            "nome_prestazione": "Vitamina D3 (liposolubile) (25 Oh)",
            "dati_cliente": "alessandro gerini (alessandrogerini87@libero.it) GRNLSN87L08D575R",
            "dati_paziente": "alessandro gerini (alessandrogerini87@libero.it) GRNLSN87L08D575R",
            "euro_struttura": 31.93,
            "euro_portale": 2.07,
            "euro_totale": 34,
            "metodo_pagamento": "office"
        },
        .....
        {
            "id_prenotazione": 10950,
            "sede": "NUOVA IGEA",
            "dottore": "Operatore Prestazioni Prestazioni",
            "data_prestazione": "2018-03-28 11:50",
            "nome_prestazione": "Hpv Cervicale Con Prelievo (real Time Pcr)",
            "dati_cliente": "giulia bernocchi (giulia.bernocchi@gmail.com) BRNGLI92E45D612Y",
            "dati_paziente": "giulia bernocchi (giulia.bernocchi@gmail.com) BRNGLI92E45D612Y",
            "euro_struttura": 61.03,
            "euro_portale": 3.97,
            "euro_totale": 65,
            "metodo_pagamento": "office"
        },
        {
            "id_prenotazione": 10940,
            "sede": "NUOVA IGEA",
            "dottore": "Carmen Zumpano",
            "data_prestazione": "2018-03-23 16:30",
            "nome_prestazione": "Ecografia Capo E Collo",
            "dati_cliente": "samuele tomeo (tomeo.globalsecur@gmail.com) TMOSML91P04A509W",
            "dati_paziente": "samuele tomeo (tomeo.globalsecur@gmail.com) TMOSML91P04A509W",
            "euro_struttura": 56.34,
            "euro_portale": 3.66,
            "euro_totale": 60,
            "metodo_pagamento": "paypal"
        }
    ],
    "paging": {
        "next": "https://api.cupsolidale.it/api/v1/prenotazioni/?pagination=1"
    }
}
Blocco Orari DISMESSA
 Blocca orari
API DISMESSA - Tramite questa richiesta sarà possibile rimuovere un periodo di disponibilità dal portale di Cupsolidale, relativo al dottore, la sede e la prestazione.

Nel caso in cui il dottore o la sede o le prestazioni non fossero attive, la richiesta segnalerà errore.

I dati minimi necessari alla rimozione delle disponibilità sono: id_dottore, id_sede, giorni_settimana, data_inizio, ora_inizio, data_fine, ora_fine.

L’id_dottore e l’id_sede rappresentano il dottore e la sede precedentemente inseriti tramite le rispettive API.
I giorni_settimana rapprensentano i giorni della settimana nei quali ci può essere almeno una disponibilità. I valori che questa chiave può assumere sono i seguenti (in minuscolo): ‘lun, mar, mer, gio, ven, sab, dom’. Per specificare più giorni è necessario separare i vari valori da una virgola es: "giorni_settimana": "lun,gio,sab"

Le chiavi data_inizio, data_fine, ora_inizio e ora_fine sono di tipo stringa e rappresentano il periodo nel quale l’agenda è attiva. Le date (data_inizio e data_fine) devono avere il seguente formato: "yyyy-mm-dd" mentre gli orari (ora_inizio e ora_fine) devono avere il seguente formato: "hh:mm".

Se il periodo risulta non essere nel formato corretto (o un periodo non valido), verrà segnalato un errore.

Nel caso in cui nel periodo selezionato ci dovessero essere una o più prenotazioni, la richiesta segnalerà un errore e nessun periodo verrà eliminato dalla disponibilità.

Curl
HTTP
curl -X POST -H "Authorization: Basic basic_auth_encoding_here" -H "Content-Type: application/json" -d '{
  "reservations": [
    {
      "id_dottore": "doc123",
      "id_sede": "sede123",
      "id_prestazione": "test123",
      "tipologia":"indisponibile",
      "giorni_settimana": "Mar,Gio",
      "data_inizio": "2018-04-23",
      "ora_inizio": "09:00",
      "data_fine": "2018-06-30",
      "ora_fine": "18:00"
    }
  ]
}' "https://api.cupsolidale.it/api/v1/blocco_orari/add"
Response
Status	200
{
    "success": true,
    "data": "Sono stati bloccati 2 giorni dalle 09:00 alle 18:00"
}
