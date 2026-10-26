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
      stato: "pubblicato"
    },
    {
      id: "02-superglobali",
      numero: 2,
      titolo: "Dati dal browser: GET, POST e superglobali",
      descrizione: "Le coppie chiave → valore, la query string, i moduli HTML e gli array $_GET, $_POST e $_SERVER.",
      argomenti: ["chiave → valore", "array", "superglobali", "query string", "$_GET", "form", "$_POST", "REQUEST_METHOD", "isset", "htmlspecialchars"],
      percorso: "moduli/02-superglobali/index.html",
      stato: "pubblicato"
    }
  ],

  // strumenti interattivi condivisi tra i moduli (per ora nessuno:
  // con l'elenco vuoto la sezione non compare nella home)
  strumenti: []
};
