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
    }
  ],

  // strumenti interattivi condivisi tra i moduli (per ora nessuno:
  // con l'elenco vuoto la sezione non compare nella home)
  strumenti: []
};
