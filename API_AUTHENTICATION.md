# Autenticazione API e Chiamate Esterne

Questa applicazione utilizza **Supabase Auth** per gestire l'autenticazione. Per chiamare le API (Edge Functions) dall'esterno (es. Postman, script Python, cURL), è necessario fornire un token di accesso valido.

## Meccanismo di Autenticazione

Le Edge Functions sono protette e richiedono un header `Authorization` contenente un token JWT (JSON Web Token) valido dell'utente.

### Header Richiesto

```http
Authorization: Bearer <TUO_ACCESS_TOKEN_JWT>
```

Il token viene verificato internamente dalla funzione tramite `supabase.auth.getUser(token)`.

## Come ottenere un Token di Accesso

Ci sono due modi principali per ottenere un token per i test o l'uso esterno:

### 1. Dal Browser (Applicazione Web)
Se sei già loggato nell'applicazione:
1. Apri gli strumenti di sviluppo del browser (F12).
2. Vai alla scheda **Application** (Chrome/Edge) o **Storage** (Firefox).
3. Espandi **Local Storage** e seleziona il tuo dominio (es. `http://localhost:8083`).
4. Cerca una chiave che inizia con `sb-` (es. `sb-<project-id>-auth-token`).
5. Copia il valore `access_token` dal JSON.

### 2. Tramite Supabase JS Client (Script Node.js/JS)
Puoi ottenere un token programmaticamente effettuando il login:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'example-password',
})

const token = data.session.access_token
console.log(token)
```

## Esempio di Chiamata API (cURL)

Ecco un esempio di come chiamare la funzione `transactions-api` per ottenere le transazioni:

```bash
curl -X GET 'https://<PROJECT_REF>.supabase.co/functions/v1/transactions-api' \
  -H 'Authorization: Bearer <TUO_ACCESS_TOKEN_JWT>' \
  -H 'Content-Type: application/json'
```

### Esempio per CREARE una transazione (POST)

```bash
curl -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/transactions-api' \
  -H 'Authorization: Bearer <TUO_ACCESS_TOKEN_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "Test Transaction",
    "category": "Food",
    "amount": 50,
    "date": "2023-10-27T12:00:00Z"
  }'
```

## Note Importanti

- **Scadenza Token**: I token JWT di Supabase scadono (di solito dopo 1 ora). Dovrai aggiornare il token (`refresh_token`) se lo script gira per lungo tempo.
- **Sicurezza**: Non condividere mai il tuo `access_token` o `service_role` key pubblicamente.
- **RLS**: Le funzioni Edge rispettano le policy RLS (Row Level Security) decise nel database, assicurando che un utente possa vedere/modificare solo i propri dati.
