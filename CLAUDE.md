# CLAUDE.md — memoria del progetto

Repository del corso di **TPSIT del 5° anno** (istituto tecnico). Il corso lavora con **PHP** e cresce
durante l'anno: un **modulo** (dispensa) per ogni argomento, più eventuali **strumenti** interattivi.

## Contesto didattico

- Studenti del 5° anno, al primo approccio con PHP. Sanno programmare e conoscono l'HTML di base.
- Il corso è **indipendente** da altri corsi: nessun rimando o confronto con materiali di altri anni.
- Tutta l'interfaccia e tutti i contenuti sono in **italiano**.
- Il concetto che regge tutto il corso: **il PHP gira sul server, il browser riceve solo HTML**
  (server-side rendering). Ogni esempio deve rendere visibile questo passaggio.
- Gli array PHP si presentano sempre come **coppie chiave → valore** (anche quelli con chiavi 0, 1, 2),
  mai come "vettori". I dati dell'utente si stampano sempre con `htmlspecialchars`.
- Ambiente di laboratorio: **Windows**, con **XAMPP** (Apache sulla porta 80, document root
  `C:\xampp\htdocs`) oppure **EasyPHP Devserver 17** (Apache sulla porta 8080, document root `eds-www`).
  Non si spiega l'installazione: solo avvio dei server, porte, DocumentRoot e cenni a `httpd.conf`. Cartella degli esercizi: `htdocs/tpsit/`.

## Vincoli tecnici

- Solo **HTML, CSS e JavaScript vanilla** per le dispense. Niente framework, niente build, niente npm.
- **Nessuna dipendenza esterna**: niente CDN, niente Google Fonts, immagini salvate nel repository.
  Nei laboratori la rete può mancare: tutto deve funzionare offline.
- Deve funzionare sia aprendo i file con doppio clic (`file://`) sia su **GitHub Pages**.
  Solo **percorsi relativi**, niente `fetch` di file locali, niente moduli ES.
- Il PHP **non viene eseguito** nelle dispense: l'output degli esempi è scritto nella pagina e
  controllato con `controlli/verifica-esempi.php` (serve PHP installato sul computer del docente).
- Browser di riferimento: Chrome, Edge e Firefox recenti.
- Pagine responsive, tema chiaro e scuro (`prefers-color-scheme` più interruttore manuale),
  contrasti accessibili. Gli stati non si comunicano **solo con il colore**.
- Le dispense hanno un **CSS di stampa**: schede ① e ② degli esempi una sotto l'altra, niente anteprima.
- `localStorage` sempre dentro `try/catch`.
- Codice commentato in italiano, pulito e leggibile: anche il docente deve poterlo modificare.

## Struttura del repository

```
README.md                 presentazione del corso e istruzioni
CLAUDE.md                 questo file
index.html                home del corso: schede generate da corso.js
corso.js                  elenco di moduli e strumenti
assets/
  css/base.css            variabili, temi, tipografia, barra, pulsanti, box, tabelle, codice, stampa
  css/dispensa.css        layout delle dispense: indice, componente "esempio PHP", figure, stampa
  js/tema.js              interruttore chiaro/scuro (nel <head>, senza defer)
  js/corso-ui.js          schede della home e link "Modulo precedente / successivo"
  js/dispensa.js          indice laterale generato dai titoli
  js/codice.js            evidenziatore di sintassi (PHP, HTML, CSS, JS, C++) ed "esempio PHP"
controlli/
  verifica-esempi.php     esegue gli esempi (simulando GET/POST/$_SERVER), confronta o riempie l'output
moduli/
  _modello/index.html     dispensa vuota da copiare (NON compare nella home)
  NN-nome/index.html      una dispensa per modulo
  NN-nome/modulo.css      stili specifici del modulo, solo se servono
  NN-nome/img/            immagini del modulo (con crediti e licenza in didascalia)
```

## Come si crea un nuovo modulo

1. Copiare `moduli/_modello/` in `moduli/NN-nome/`.
2. Nel `<body>` impostare `data-modulo="NN-nome"` (uguale all'`id` in `corso.js`), lasciare `data-radice="../../"`.
3. Aggiornare `<title>`, il titolo nella barra, `<h1>` e sottotitolo.
4. Registrare il modulo in `corso.js` (`stato: "in preparazione"` → scheda visibile ma non cliccabile).
5. Scrivere i contenuti. Lasciare vuoti i `data-html` e riempirli con
   `php controlli/verifica-esempi.php --riempi`; alla fine controllare che tutto sia ✓.

## Convenzioni didattiche

- Partire da un **esercizio concreto** (una "Traccia") e far emergere **il problema prima dello strumento**.
- In ogni esempio far notare **cosa cambia tra la scheda ① e la scheda ②**: cosa resta sul server,
  cosa parte verso il browser.
- **Nessuna soluzione** agli esercizi "Prova tu".
- Stile chiaro e diretto, frasi brevi, seconda persona singolare.
- Nel codice PHP: sempre e solo il tag `<?php` (mai `<?` corto, mai `<?=`), `echo` (non `print`),
  `===` e `!==`, nei file di solo PHP niente `?>` finale.
- Screenshot: preferire immagini con licenza libera (Wikimedia Commons) e scrivere sempre autore,
  fonte e licenza nella didascalia (`<span class="crediti">`).

## Sintassi delle dispense

### Sezioni e indice

Ogni sezione è un `<section>` con un `<h2 id="...">`; sottosezioni con `<h3 id="...">`.
L'indice laterale si genera da tutti gli `h2` e `h3` con `id`.

### Codice da leggere

```html
<script type="text/plain" data-codice="php">
<?php
echo "Ciao";
</script>
```

Linguaggi: `php`, `html`, `css`, `js`, `cpp`, `testo`. L'indentazione comune viene rimossa.
Dentro il blocco non si può scrivere `</script>`: in quel caso usare
`<pre class="codice"><code class="lang-php">...</code></pre>` con `&lt;` e `&amp;`.

### Esempio PHP (tre schede: ① sul server, ② spedito al browser, ③ nel browser)

```html
<script type="text/plain" data-php="ciao.php" data-url="http://localhost/tpsit/ciao.php">
<?php
echo "<p>Ciao!</p>";
</script>
<script type="text/plain" data-html>
<p>Ciao!</p>
</script>
```

- Il blocco `data-html` deve seguire **subito** il `data-php` ed essere l'output **esatto** di PHP
  (spazi e a capo compresi: PHP toglie l'a capo subito dopo `?>`).
- `data-url` è facoltativo (predefinito `http://localhost/nome.php`); può contenere la query string
  (negli attributi `&` si scrive `&amp;`).
- `data-metodo="GET|POST"` aggiunge la scheda **⓪ La richiesta** (richiesta HTTP + tabelle chiave → valore
  di `$_GET`/`$_POST`); `data-corpo="a=1&amp;b=2"` è il corpo di una richiesta POST.
- Il file può essere anche un `.html` senza PHP: la scheda ② dice che viene spedito così com'è.
- Il `data-html` si lascia vuoto e si riempie con `php controlli/verifica-esempi.php --riempi`.
- `data-variabile` sul `data-html`: output che cambia a ogni richiesta (per esempio `date()`),
  non confrontato dalla verifica.
- La scheda ③ mostra l'HTML in un iframe senza script.

### Box didattici

```html
<aside class="box box-server">     <!-- ⇄ Server e client: cosa resta sul server, cosa arriva al browser -->
<aside class="box box-attenzione"> <!-- ⚠ Attenzione: trappole -->
<aside class="box box-prova">      <!-- ▶ Prova: esperimenti sul proprio server -->
<aside class="box box-prova-tu">   <!-- ✎ Prova tu: esercizi senza soluzione -->
<aside class="box box-curiosita">  <!-- 💡 Curiosità -->
<aside class="box box-regola">     <!-- frase chiave, senza etichetta -->
```

Etichetta diversa: `data-titolo="⚠ Attenzione: niente doppio clic"`.

### Altri elementi

- Traccia: `<blockquote class="traccia"><p>...</p></blockquote>`
- Tabella: `<div class="tabella"><table>...</table></div>`
- Figura: `<figure class="figura"><img ...><figcaption>... <span class="crediti">...</span></figcaption></figure>`
- Link precedente/successivo: `<nav class="nav-moduli" data-navigazione-moduli></nav>`

## Verifiche prima di consegnare

- `php controlli/verifica-esempi.php`: tutti ✓ (o ~ per gli output variabili).
- Aprire ogni pagina modificata in tema chiaro e scuro, anche a larghezza da telefono,
  e passare le tre schede di ogni esempio.
