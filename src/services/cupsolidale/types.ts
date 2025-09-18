export interface CupSolidaleConfig {
  baseUrl: string;
  auth: {
    username: string;
    password: string;
  };
  headers: Record<string, string>;
}

export interface CupApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
  paging?: {
    next: string;
  };
}

// Prenotazioni
export interface PrenotazioniRequest {
  status?: 'completata' | 'cancellata';
  time?: 1 | 3 | 6 | 12 | 24 | 48;
  extended?: 'true' | 'false';
  pagination?: string;
}

export interface PrenotazioneResponse {
  id_prenotazione: number;
  sede: string;
  dottore: string;
  data_prestazione: string; // "2018-04-27 16:30"
  nome_prestazione: string;
  dati_cliente: string;
  dati_paziente: string;
  euro_struttura: number;
  euro_portale: number;
  euro_totale: number;
  metodo_pagamento: string;
}

// Sedi
export interface SedeResponse {
  id_sede: string;
  stato: string;
  indirizzo: string;
  nome: string;
  latitude: number;
  longitude: number;
}

export interface SedeRequest {
  id_sede: string;
  nome: string;
  indirizzo: string;
  description?: string;
  longitudine: number;
  latitudine: number;
}

// Dottori
export interface DottoreResponse {
  id_dottore: string;
  nome: string;
  status: string;
  services: Array<{
    id_prestazione: string;
    status: string;
    id_dottore: string;
    nome: string;
  }>;
}

export interface DottoreRequest {
  nome: string;
  cognome: string;
  codice_fiscale: string;
  id_dottore: string;
  prestazioni?: PrestazioneRequest[];
}

// Prestazioni
export interface PrestazioneResponse {
  id_prestazione: string;
  status: string;
  nome: string;
  prezzo: number;
  descrizione: string;
  preparazione?: string;
  categoria: 'visita' | 'laboratorio' | 'diagnostica';
  durata: number;
}

export interface PrestazioneRequest {
  nome: string;
  prezzo: number;
  durata: number;
  id_prestazione: string;
  categoria: 'visita' | 'laboratorio' | 'diagnostica';
  descrizione?: string;
  preparazione?: string;
  aggiorna?: 'singolo' | 'forza_tutti' | 'eccetto_singolo';
}

// Agende
export interface AgendaResponse {
  id_agenda: string;
  data_inizio: string;
  data_fine: string;
  ora_inizio: string;
  ora_fine: string;
  giorni_settimana: string[];
  orari: Array<{
    ora_inizio: string;
    ora_fine: string;
  }>;
  office: {
    id_sede: string;
    name: string;
  };
  doctor: {
    id_dottore: string;
    nome: string;
  };
  service: Array<{
    id_prestazione: string;
    nome: string;
    prezzo: number;
    durata: number;
  }>;
}

export interface AgendaRequest {
  id_agenda: string;
  id_dottore: string;
  id_sede: string;
  giorni_settimana: string; // "lun,mar,mer,gio,ven,sab,dom"
  data_inizio: string; // "yyyy-mm-dd"
  data_fine: string; // "yyyy-mm-dd"
  orari: Array<{
    ora_inizio: string; // "hh:mm"
    ora_fine: string; // "hh:mm"
  }>;
  prestazioni?: string[]; // array of id_prestazione
}

// Disponibilità
export interface DisponibilitaRequest {
  id_dottore: string;
  id_sede: string;
  id_prestazione: string;
  id_disponibilita: string;
  data: string; // "yyyy-mm-dd"
  prezzo?: number;
  orari: Array<{
    id_orario?: string;
    ora_inizio: string; // "hh:mm"
    ora_fine: string; // "hh:mm"
  }>;
}

export interface RemoveDisponibilitaRequest {
  id_dottore: string;
  id_prestazione?: string;
  id_sede?: string;
  data_inizio: string; // "yyyy-mm-dd"
  data_fine: string; // "yyyy-mm-dd"
}

// Indisponibilità
export interface IndisponibilitaRequest {
  id_indisponibilita: string;
  id_dottore: string;
  id_sede: string;
  tipologia: 'indisponibile';
  data_inizio: string; // "yyyy-mm-dd"
  ora_inizio: string; // "hh:mm"
  data_fine: string; // "yyyy-mm-dd"
  ora_fine: string; // "hh:mm"
}

// Change Date
export interface ChangeDataRequest {
  invoice_id: number;
  where_id: string;
  new_date: string; // "yyyy-mm-dd"
  new_time: string; // "hh:mm"
  requestor: 'app';
}

// Batch requests
export interface BatchSedeRequest {
  offices: SedeRequest[];
  detailed_response?: boolean;
}

export interface BatchDottoreRequest {
  doctors: DottoreRequest[];
  detailed_response?: boolean;
}

export interface BatchPrestazioneRequest {
  services: PrestazioneRequest[];
  detailed_response?: boolean;
}

export interface BatchAgendaRequest {
  calendar: AgendaRequest[];
  detailed_response?: boolean;
}

export interface BatchDisponibilitaRequest {
  availabilities: DisponibilitaRequest[];
  detailed_response?: boolean;
}

export interface BatchRemoveDisponibilitaRequest {
  availabilities: RemoveDisponibilitaRequest[];
}

export interface BatchIndisponibilitaRequest {
  blocks: IndisponibilitaRequest[];
  detailed_response?: boolean;
}