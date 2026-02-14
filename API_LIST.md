# Elenco API FinProjection

Questo documento elenca le API disponibili tramite Supabase Edge Functions e il loro stato rispetto ai requisiti richiesti.

| Funzionalità | Endpoint | Metodo | Stato | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Saldo Attuale** | `financial-stats-api` | GET | ✅ Disponibile | Campo `total_balance`. *Nota: Attualmente calcolato senza le ricorrenze pregresse.* |
| **Disponibilità Reale** | `financial-stats-api` | GET | ✅ Disponibile | Campo `availability`. *Nota: Utilizza un margine fisso invece del minimo proiettato.* |
| **Proiezione al 5 Marzo** | - | - | ❌ Non Disponibile | Calcolata solo lato client nel componente `Index.tsx`. |
| **Proiezione al 10 Marzo** | - | - | ❌ Non Disponibile | Calcolata solo lato client nel componente `Index.tsx`. |
| **Stato Finanziario** | `financial-stats-api` | GET | ✅ Disponibile | Campo `financial_status`. |

## Dettagli Endpoint

### 1. Financial Stats API
**URL:** `/functions/v1/financial-stats-api`  
**Query Parameters:**  
- `budget` (opzionale): Default `500`. Imposta il budget mensile per il calcolo della disponibilità.
- `field` (opzionale): Restituisce solo il campo specificato (es. `total_balance`, `financial_status`).

**Esempi di chiamata:**
- Completa: `/functions/v1/financial-stats-api`
- Solo Stato Finanziario: `/functions/v1/financial-stats-api?field=financial_status`
- Solo Saldo: `/functions/v1/financial-stats-api?field=total_balance`

**Output Esempio (Completo):**
```json
{
  "total_balance": 1586.96,
  "monthly_expenses": 50.0,
  "availability": 1031.57,
  "availability_margin": 1031.57,
  "financial_status": "ok",
  "budget_used": 500,
  "currency": "EUR",
  "timestamp": "2026-02-14T14:24:35Z"
}
```

### 2. Transactions API
**URL:** `/functions/v1/transactions-api`  
**Metodi:** GET (lista), POST (crea), PUT (modifica), DELETE (elimina)

### 3. Recurring Items API
**URL:** `/functions/v1/recurring-api`  
**Metodi:** GET (lista), POST (crea), PUT (modifica), DELETE (elimina)  
**Parametri:** `?type=income` o `?type=expense`

---
*Documento generato il 14 Febbraio 2026.*
