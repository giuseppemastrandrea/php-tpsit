/* ==========================================================================
   corso.js — elenco dei moduli e degli strumenti del corso
   È l'unico file da modificare per far comparire un modulo nella home
   e nei collegamenti "Modulo precedente / successivo".

   Campi di ogni voce:
     id          nome della cartella (per i moduli: "NN-nome")
     numero      solo per i moduli: ordine di presentazione
     titolo      titolo mostrato nella scheda
     descrizione una o due frasi
     argomenti   elenco di parole chiave
     percorso    percorso della pagina, relativo alla cartella principale
     sezioni     solo per i moduli: i titoli h2 della dispensa (id e testo),
                 per l'indice del corso nella home. Se cambi un titolo o un id
                 nella dispensa, aggiornalo anche qui (verifica-esempi.php
                 segnala le differenze)
     stato       "pubblicato" oppure "in preparazione"
                 (i moduli in preparazione si vedono ma non sono cliccabili)
   ========================================================================== */
window.CORSO = {
  titolo: "TPSIT · 5° anno",

  moduli: [
    {
      id: "01-primi-passi",
      numero: 1,
      titolo: "Primi passi con PHP",
      descrizione: "Un server sul tuo PC con XAMPP o EasyPHP, le porte, il primo script. E cosa arriva davvero al browser.",
      argomenti: ["client e server", "XAMPP", "EasyPHP", "porte", "localhost", "DocumentRoot", "httpd.conf", "<?php ?>", "echo", "variabili", "commenti"],
      percorso: "moduli/01-primi-passi/index.html",
      sezioni: [
        { id: "s1", titolo: "1. Client e server: chi fa cosa" },
        { id: "s2", titolo: "2. Un server sul tuo PC: XAMPP ed EasyPHP" },
        { id: "s3", titolo: "3. Il primo script" },
        { id: "s4", titolo: "4. Il server prepara, il browser riceve" },
        { id: "s5", titolo: "5. Aprire e chiudere: HTML e PHP nello stesso file" },
        { id: "s6", titolo: "6. echo in pratica: stringhe e variabili" },
        { id: "s7", titolo: "7. Commenti: chi resta e chi parte" },
        { id: "s8", titolo: "8. Quando qualcosa va storto" },
        { id: "s9", titolo: "9. Riepilogo ed esercizi" }
      ],
      stato: "pubblicato"
    },
    {
      id: "02-superglobali",
      numero: 2,
      titolo: "Dati dal browser: GET, POST e superglobali",
      descrizione: "Le coppie chiave → valore, la query string, i moduli HTML e gli array $_GET, $_POST e $_SERVER.",
      argomenti: ["chiave → valore", "array", "superglobali", "query string", "$_GET", "form", "$_POST", "REQUEST_METHOD", "isset", "htmlspecialchars"],
      percorso: "moduli/02-superglobali/index.html",
      sezioni: [
        { id: "s1", titolo: "1. Coppie chiave → valore" },
        { id: "s2", titolo: "2. Gli array superglobali" },
        { id: "s3", titolo: "3. $_GET: i dati nell'indirizzo" },
        { id: "s4", titolo: "4. I moduli HTML: le coppie le prepara il browser" },
        { id: "s5", titolo: "5. $_POST: i dati nel corpo della richiesta" },
        { id: "s6", titolo: "6. $_SERVER[\"REQUEST_METHOD\"]: GET o POST?" },
        { id: "s7", titolo: "7. Riepilogo ed esercizi" }
      ],
      stato: "pubblicato"
    },
    {
      id: "03-documentazione",
      numero: 3,
      titolo: "Leggere la documentazione: date() e il timestamp",
      descrizione: "Come si legge una pagina del manuale di PHP: la firma, i parametri facoltativi, i tipi. E che cos'è un timestamp.",
      argomenti: ["php.net", "firma", "parametri", "valori predefiniti", "tipi", "timestamp", "time", "date", "mktime", "number_format"],
      percorso: "moduli/03-documentazione/index.html",
      sezioni: [
        { id: "s1", titolo: "1. Il manuale di PHP" },
        { id: "s2", titolo: "2. Anatomia della pagina di date()" },
        { id: "s3", titolo: "3. Che cos'è un timestamp" },
        { id: "s4", titolo: "4. Leggere la firma" },
        { id: "s5", titolo: "5. Seguire un rimando: i caratteri di formato" },
        { id: "s6", titolo: "6. Un metodo per leggere qualsiasi pagina" },
        { id: "s7", titolo: "7. Riepilogo ed esercizi" }
      ],
      stato: "pubblicato"
    },
    {
      id: "04-file",
      numero: 4,
      titolo: "Gestione dei file in PHP",
      descrizione: "Apertura, scrittura, lettura e chiusura di un file di testo: i record restano sul server da una richiesta all'altra.",
      argomenti: ["fopen", "modalità a e r", "stream", "record", ".=", "fwrite", "fgets", "feof", "fclose"],
      percorso: "moduli/04-file/index.html",
      sezioni: [
        { id: "s1", titolo: "1. Le operazioni su un file di testo" },
        { id: "s2", titolo: "2. Apertura del file: fopen()" },
        { id: "s3", titolo: "3. Preparazione del record" },
        { id: "s4", titolo: "4. Registrazione e chiusura: fwrite() e fclose()" },
        { id: "s5", titolo: "5. Lettura di tutti i record: fgets()" },
        { id: "s6", titolo: "6. Chiusura del file: fclose()" },
        { id: "s7", titolo: "7. Esempio completo: scrittura e successiva lettura" },
        { id: "s8", titolo: "8. Riepilogo ed esercizi" }
      ],
      stato: "pubblicato"
    }
  ],

  // strumenti interattivi condivisi tra i moduli (per ora nessuno:
  // con l'elenco vuoto la sezione non compare nella home)
  strumenti: []
};
