# TPSIT · 5° anno — PHP

Materiali del corso di **TPSIT** (Tecnologie e progettazione di sistemi informatici e di
telecomunicazioni) del **5° anno**. Quest'anno si lavora con **PHP**, il linguaggio che gira sul
server e costruisce le pagine web prima di spedirle al browser.

Ogni **modulo** è una dispensa. Ogni esempio di codice si mostra in tre schede:
**① Sul server** (il file PHP), **② Spedito al browser** (l'HTML che viaggia in rete),
**③ Nel browser** (la pagina che vede l'utente). Così è sempre chiaro che il browser non riceve
mai il codice PHP, ma solo il risultato.

Le dispense funzionano **offline**: niente librerie esterne, niente installazioni.
Per provare il PHP, invece, serve un server: in laboratorio usiamo **XAMPP** o **EasyPHP**.

## Contenuti

| # | Modulo | Argomenti |
|---|--------|-----------|
| 01 | [Primi passi con PHP](moduli/01-primi-passi/index.html) | client e server, XAMPP ed EasyPHP, porte e `localhost`, DocumentRoot, `httpd.conf`, `<?php ?>`, `echo`, variabili, virgolette, commenti, errori |
| 02 | [Dati dal browser: GET, POST e superglobali](moduli/02-superglobali/index.html) | coppie chiave → valore, array, superglobali, query string, `$_GET`, moduli HTML, `$_POST`, GET o POST, `$_SERVER["REQUEST_METHOD"]`, `isset`, `htmlspecialchars` |

## Aprire le pagine in locale

1. Scarica il repository (pulsante **Code → Download ZIP** su GitHub) ed estrai la cartella.
2. Fai **doppio clic su `index.html`**: si apre la home del corso nel browser.

Le dispense non hanno bisogno di un server. Gli esercizi PHP sì: vanno salvati nella cartella
`htdocs` di XAMPP (o `eds-www` di EasyPHP) e aperti da `http://localhost/...`.

## Pubblicare con GitHub Pages

1. Carica il repository su GitHub (branch `main`).
2. Nel repository vai su **Settings → Pages**.
3. In **Build and deployment**, alla voce **Source** scegli **Deploy from a branch**.
4. In **Branch** scegli `main` e la cartella **`/ (root)`**, poi premi **Save**.
5. Dopo uno o due minuti, in cima alla stessa pagina compare l'indirizzo del sito.

## Struttura del repository

```
index.html                 home del corso (le schede sono generate da corso.js)
corso.js                   elenco di moduli e strumenti
assets/css/                stile comune (base.css) e layout delle dispense (dispensa.css)
assets/js/                 tema chiaro/scuro, home, indice, evidenziatore ed esempi PHP (codice.js)
controlli/                 verifica-esempi.php: controlla l'output degli esempi
moduli/_modello/           dispensa vuota da copiare per un nuovo modulo
moduli/01-primi-passi/     dispensa del modulo 01, con le sue immagini
CLAUDE.md                  convenzioni del progetto (utili anche per lavorare con Claude Code)
```

## Aggiungere un nuovo modulo

1. Copia la cartella `moduli/_modello` e rinominala, per esempio `moduli/03-condizioni`.
2. In `moduli/03-condizioni/index.html` cambia `<title>`, titolo nella barra, `<h1>`, sottotitolo
   e, nel tag `<body>`, l'attributo `data-modulo="03-condizioni"`.
3. Registra il modulo in `corso.js`, aggiungendo una voce all'elenco `moduli`
   (con `stato: "in preparazione"` la scheda si vede ma non è cliccabile).
   Nel campo `sezioni` elenca i titoli `h2` della dispensa (id e testo): compaiono
   nell'**Indice del corso** in home. Il controllo `verifica-esempi.php` ti avvisa se non
   corrispondono più ai titoli.
4. Scrivi i contenuti: il modello contiene un esempio di ogni elemento.

## Scrivere un esempio PHP

```html
<script type="text/plain" data-php="ciao.php" data-url="http://localhost/tpsit/ciao.php">
<?php
echo "<p>Ciao!</p>";
</script>
<script type="text/plain" data-html>
<p>Ciao!</p>
</script>
```

Il primo blocco è il file PHP, il secondo (subito dopo) è l'HTML che il server spedisce. Il secondo
blocco deve essere l'output **esatto** del primo: non scriverlo a mano. Lascialo vuoto
(`<script type="text/plain" data-html></script>`) e lancia `php controlli/verifica-esempi.php --riempi`.

Per un esempio che riceve dati, aggiungi al primo blocco la richiesta: compare la scheda
**⓪ La richiesta**, con la richiesta HTTP e la tabella chiave → valore di `$_GET` / `$_POST`.

```html
<script type="text/plain" data-php="saluto.php" data-metodo="GET"
        data-url="http://localhost/tpsit/saluto.php?nome=Anna&amp;classe=5A">
...
<script type="text/plain" data-php="accesso.php" data-metodo="POST"
        data-url="http://localhost/tpsit/accesso.php" data-corpo="utente=anna&amp;password=segreto">
```

Negli attributi la `&` si scrive `&amp;`.

## Controllare gli esempi

Con PHP installato sul computer, dalla cartella del corso:

```
php controlli/verifica-esempi.php            controlla tutte le dispense
php controlli/verifica-esempi.php --mostra   stampa anche l'output vero di ogni esempio
php controlli/verifica-esempi.php --riempi   scrive l'output vero nei blocchi data-html vuoti
```

Ogni esempio deve mostrare **✓**. Gli esempi con output che cambia a ogni richiesta (per esempio
l'ora, con `date()`) hanno l'attributo `data-variabile` e mostrano **~**: vengono eseguiti ma non
confrontati. Gli errori vengono riprodotti come in XAMPP, con il percorso
`C:\xampp\htdocs\tpsit\nome.php`. La richiesta viene simulata da `data-url`, `data-metodo` e
`data-corpo`; `$_SERVER` contiene valori tipici di XAMPP (porta 80, DocumentRoot `C:/xampp/htdocs`,
`REMOTE_ADDR` `::1`, Chrome su Windows).

## Crediti delle immagini

- Screenshot di XAMPP Control Panel: Drstrange85 ([CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:XAMPP_for_Windows_11.png), ritagliato)
  e VulcanSphere ([GPL](https://commons.wikimedia.org/wiki/File:XAMPP_Windows_10.PNG)), da Wikimedia Commons.
- Screenshot della Dashboard di EasyPHP: [Finxter, "Setup the EasyPHP Dashboard"](https://blog.finxter.com/setup-the-easyphp-dashboard/).
