/* ==========================================================================
   codice.js — evidenziatore di sintassi e componente "esempio PHP"
   Comune a tutte le dispense. Vedi CLAUDE.md per la sintassi completa.

   Nell'HTML della dispensa:

   1) Codice da leggere (evidenziato):
        <script type="text/plain" data-codice="php|html|css|js|cpp|testo"> ... </script>
      oppure
        <pre class="codice"><code class="lang-php"> ... </code></pre>

   2) Esempio PHP: un blocco data-php (il file sul server) seguito SUBITO
      da un blocco data-html (l'HTML che il server spedisce al browser).
      Il file può anche essere un .html (senza PHP): viene spedito così com'è.
        <script type="text/plain" data-php="ciao.php"> ... </script>
        <script type="text/plain" data-html> ... </script>

      Diventa un riquadro con tre schede (quattro con data-metodo):
        ⓪ La richiesta    cosa manda il browser e cosa trova PHP in $_GET/$_POST
        ① Sul server      il codice PHP del file
        ② Spedito         l'HTML che viaggia in rete verso il browser
        ③ Nel browser     la pagina che vede l'utente
      Attributi facoltativi del blocco data-php:
        data-url="http://localhost:8080/ciao.php"  indirizzo mostrato nella scheda ③
                                                   (con la query string: ...?nome=Anna&amp;eta=18)
        data-metodo="GET" oppure "POST"            aggiunge la scheda ⓪ "La richiesta":
                                                   la richiesta HTTP e le coppie
                                                   chiave → valore di $_GET / $_POST
        data-corpo="nome=Anna&amp;eta=18"           corpo della richiesta POST
      Prima del blocco data-php e dopo il data-html possono esserci i file di
      dati sul server (vedi preparaFileServer):
        <script type="text/plain" data-file-prima="iscritti.txt"> ... </script>
        <script type="text/plain" data-file-dopo="iscritti.txt"> ... </script>
      Attributi facoltativi del blocco data-html:
        data-variabile   l'output cambia a ogni richiesta (es. data e ora):
                         controlli/verifica-esempi.php non lo confronta

   Il PHP NON viene eseguito nella pagina: l'HTML della scheda ② è scritto
   nella dispensa (generato con il vero interprete PHP e controllato con
   controlli/verifica-esempi.php). Così tutto funziona anche offline.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Utilità
     ------------------------------------------------------------------------ */

  function escapeHtml(testo) {
    return testo
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Toglie le righe vuote iniziali e finali e l'indentazione comune a tutte
  // le righe: così il docente può indentare i blocchi dentro l'HTML.
  function dedent(testo) {
    const righe = testo.replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
    while (righe.length && righe[0].trim() === "") righe.shift();
    while (righe.length && righe[righe.length - 1].trim() === "") righe.pop();
    let minimo = Infinity;
    righe.forEach(function (r) {
      if (r.trim() === "") return;
      const spazi = r.match(/^ */)[0].length;
      if (spazi < minimo) minimo = spazi;
    });
    if (minimo === Infinity) minimo = 0;
    return righe.map(function (r) { return r.slice(minimo); }).join("\n");
  }

  function crea(tag, classe, testo) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (testo !== undefined) el.textContent = testo;
    return el;
  }

  /* ------------------------------------------------------------------------
     2. Evidenziatore di sintassi (semplice, fatto a mano)
        Ogni funzione riceve il codice come testo e restituisce HTML con
        <span class="tk-...">. Non è perfetto, ma basta per gli esempi.
     ------------------------------------------------------------------------ */

  const PAROLE_JS = new Set(("const let var if else for while do return function true false null " +
    "undefined new typeof of in break continue switch case default class this NaN Infinity " +
    "try catch finally throw async await").split(" "));

  const PAROLE_CPP = new Set(("int double float char bool string void return if else for while do " +
    "using namespace std cout cin endl true false const auto long short unsigned struct class " +
    "new delete break continue switch case default include").split(" "));

  function span(classe, testo) {
    return '<span class="' + classe + '">' + escapeHtml(testo) + "</span>";
  }

  // Evidenzia linguaggi "simili al C" (JavaScript e C++)
  function evidenziaStileC(codice, parole, lingua) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(`)|(#\s*include[^\n]*)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_$][\w$]*)/g;
    let out = "";
    let ultimo = 0;
    let m;
    while ((m = re.exec(codice)) !== null) {
      out += escapeHtml(codice.slice(ultimo, m.index));
      if (m[1]) {
        out += span("tk-commento", m[1]);
      } else if (m[2]) {
        out += span("tk-stringa", m[2]);
      } else if (m[3]) {
        if (lingua === "js") {
          // template literal: cerco il backtick di chiusura e coloro i ${...}
          const fine = trovaFineTemplate(codice, m.index + 1);
          out += evidenziaTemplate(codice.slice(m.index, fine));
          re.lastIndex = fine;
        } else {
          out += escapeHtml(m[3]);
        }
      } else if (m[4] && lingua === "cpp") {
        out += span("tk-parola", m[4]);
      } else if (m[5]) {
        out += span("tk-numero", m[5]);
      } else if (m[6]) {
        const parola = m[6];
        const dopo = codice.slice(re.lastIndex).match(/^\s*\(/);
        if (parole.has(parola)) out += span("tk-parola", parola);
        else if (dopo) out += span("tk-funzione", parola);
        else out += escapeHtml(parola);
      } else {
        out += escapeHtml(m[0]);
      }
      ultimo = re.lastIndex;
    }
    out += escapeHtml(codice.slice(ultimo));
    return out;
  }

  // Restituisce l'indice subito dopo il backtick che chiude il template literal
  function trovaFineTemplate(codice, i) {
    while (i < codice.length) {
      const c = codice[i];
      if (c === "\\") { i += 2; continue; }
      if (c === "`") return i + 1;
      if (c === "$" && codice[i + 1] === "{") {
        let profondita = 1;
        i += 2;
        while (i < codice.length && profondita > 0) {
          if (codice[i] === "{") profondita++;
          else if (codice[i] === "}") profondita--;
          i++;
        }
        continue;
      }
      i++;
    }
    return codice.length;
  }

  // Template literal: il testo è "stringa", le espressioni ${...} sono codice
  function evidenziaTemplate(t) {
    let out = "";
    let i = 0;
    let inizioTesto = 0;
    while (i < t.length) {
      if (t[i] === "\\") { i += 2; continue; }
      if (t[i] === "$" && t[i + 1] === "{") {
        out += span("tk-stringa", t.slice(inizioTesto, i));
        let profondita = 1;
        let j = i + 2;
        while (j < t.length && profondita > 0) {
          if (t[j] === "{") profondita++;
          else if (t[j] === "}") profondita--;
          j++;
        }
        const chiusa = profondita === 0;
        const interno = t.slice(i + 2, chiusa ? j - 1 : j);
        out += span("tk-parola", "${") + evidenziaStileC(interno, PAROLE_JS, "js") + (chiusa ? span("tk-parola", "}") : "");
        i = j;
        inizioTesto = j;
        continue;
      }
      i++;
    }
    out += span("tk-stringa", t.slice(inizioTesto));
    return out;
  }

  function evidenziaCss(codice) {
    const re = /(\/\*[\s\S]*?(?:\*\/|$))|("[^"\n]*"?|'[^'\n]*'?)|([{}])|(-?\d*\.?\d+(?:px|em|rem|%|vh|vw|s|ms|deg)?)|([\w-]+)/g;
    let out = "";
    let ultimo = 0;
    let profondita = 0;
    let m;
    while ((m = re.exec(codice)) !== null) {
      out += escapeHtml(codice.slice(ultimo, m.index));
      if (m[1]) out += span("tk-commento", m[1]);
      else if (m[2]) out += span("tk-stringa", m[2]);
      else if (m[3]) {
        profondita += m[3] === "{" ? 1 : -1;
        if (profondita < 0) profondita = 0;
        out += escapeHtml(m[3]);
      } else if (m[4]) {
        out += profondita > 0 ? span("tk-numero", m[4]) : escapeHtml(m[4]);
      } else if (m[5]) {
        if (profondita === 0) out += span("tk-tag", m[5]);
        else if (/^\s*:/.test(codice.slice(re.lastIndex))) out += span("tk-proprieta", m[5]);
        else out += escapeHtml(m[5]);
      }
      ultimo = re.lastIndex;
    }
    out += escapeHtml(codice.slice(ultimo));
    return out;
  }

  // Colora un singolo tag, per esempio <input type="text" name="nome">
  function evidenziaTag(tag) {
    const m = tag.match(/^(<\/?|<!)([\w-]+)?([\s\S]*)$/);
    if (!m) return escapeHtml(tag);
    let out = escapeHtml(m[1]) + (m[2] ? span("tk-tag", m[2]) : "");
    out += m[3].replace(/("[^"]*"?|'[^']*'?)|([^\s="'\/>]+)|([\s\S])/g, function (_, str, parola, altro) {
      if (str) return span("tk-stringa", str);
      if (parola) return span("tk-attributo", parola);
      return escapeHtml(altro);
    });
    return out;
  }

  function evidenziaHtml(codice) {
    let out = "";
    let i = 0;
    while (i < codice.length) {
      if (codice.startsWith("<!--", i)) {
        let fine = codice.indexOf("-->", i + 4);
        fine = fine === -1 ? codice.length : fine + 3;
        out += span("tk-commento", codice.slice(i, fine));
        i = fine;
      } else if (codice[i] === "<" && /[A-Za-z\/!]/.test(codice[i + 1] || "")) {
        // cerco la fine del tag, ignorando i ">" dentro le virgolette
        let j = i + 1;
        let virgoletta = null;
        while (j < codice.length) {
          const c = codice[j];
          if (virgoletta) { if (c === virgoletta) virgoletta = null; }
          else if (c === '"' || c === "'") virgoletta = c;
          else if (c === ">") break;
          j++;
        }
        const fine = Math.min(j + 1, codice.length);
        const tag = codice.slice(i, fine);
        out += evidenziaTag(tag);
        i = fine;
        // contenuto di <style> e <script>: lo coloro con il linguaggio giusto
        const apertura = tag.match(/^<(style|script)\b/i);
        if (apertura) {
          const nome = apertura[1].toLowerCase();
          let chiusura = codice.toLowerCase().indexOf("</" + nome, i);
          if (chiusura === -1) chiusura = codice.length;
          const interno = codice.slice(i, chiusura);
          out += nome === "style" ? evidenziaCss(interno) : evidenziaStileC(interno, PAROLE_JS, "js");
          i = chiusura;
        }
      } else {
        let j = codice.indexOf("<", i + 1);
        if (j === -1) j = codice.length;
        out += escapeHtml(codice.slice(i, j));
        i = j;
      }
    }
    return out;
  }


  /* ------------------------------------------------------------------------
     3. Evidenziatore del PHP
        Un file .php è un file HTML con dentro dei "blocchi PHP", delimitati
        da <?php (oppure <?=) e ?>. Fuori dai blocchi coloro come HTML,
        dentro come PHP. I tag di apertura e chiusura hanno uno stile
        proprio (tk-php-tag), ben visibile: è il confine tra i due mondi.
     ------------------------------------------------------------------------ */

  const PAROLE_PHP = new Set(("echo print if else elseif endif for foreach endforeach while endwhile do " +
    "return function fn true false null TRUE FALSE NULL as new class const array isset empty unset " +
    "include include_once require require_once switch case default break continue and or xor " +
    "public private protected static global match try catch finally throw").split(" "));

  // Colora il contenuto di una stringa tra virgolette doppie: le variabili
  // al suo interno ($nome) vengono sostituite dal loro valore, le evidenzio.
  function evidenziaStringaDoppia(s) {
    let out = "";
    let ultimo = 0;
    const re = /\\.|(\{?\$[A-Za-z_]\w*\}?)/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      if (!m[1]) continue; // sequenza di escape (\n, \", \$...): resta stringa
      out += span("tk-stringa", s.slice(ultimo, m.index));
      out += span("tk-variabile", m[1]);
      ultimo = re.lastIndex;
    }
    return out + span("tk-stringa", s.slice(ultimo));
  }

  // Colora il codice PHP a partire dalla posizione i, fino al tag di
  // chiusura ?> (escluso) o alla fine del testo. Restituisce { html, fine }.
  function evidenziaBloccoPhp(codice, i) {
    let out = "";
    let testo = ""; // caratteri "normali" accumulati (operatori, spazi, parentesi)
    function svuota() { out += escapeHtml(testo); testo = ""; }

    while (i < codice.length) {
      const resto = codice.slice(i, i + 2);
      if (resto === "?>") break;
      const c = codice[i];

      if (c === '"' || c === "'") {
        // stringa: cerco la virgoletta di chiusura saltando gli escape
        let j = i + 1;
        while (j < codice.length && codice[j] !== c) j += codice[j] === "\\" ? 2 : 1;
        j = Math.min(j + 1, codice.length);
        svuota();
        out += c === '"' ? evidenziaStringaDoppia(codice.slice(i, j)) : span("tk-stringa", codice.slice(i, j));
        i = j;
      } else if (resto === "//" || c === "#") {
        // commento di una riga: finisce all'a capo... oppure a ?>
        let j = i;
        while (j < codice.length && codice[j] !== "\n" && codice.slice(j, j + 2) !== "?>") j++;
        svuota();
        out += span("tk-commento", codice.slice(i, j));
        i = j;
      } else if (resto === "/*") {
        let j = codice.indexOf("*/", i + 2);
        j = j === -1 ? codice.length : j + 2;
        svuota();
        out += span("tk-commento", codice.slice(i, j));
        i = j;
      } else if (c === "$" && /[A-Za-z_]/.test(codice[i + 1] || "")) {
        const m = codice.slice(i).match(/^\$[A-Za-z_]\w*/);
        svuota();
        out += span("tk-variabile", m[0]);
        i += m[0].length;
      } else if (/[0-9]/.test(c) && !/[\w$]/.test(codice[i - 1] || "")) {
        const m = codice.slice(i).match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        svuota();
        out += span("tk-numero", m[0]);
        i += m[0].length;
      } else if (/[A-Za-z_]/.test(c)) {
        const m = codice.slice(i).match(/^[A-Za-z_]\w*/);
        const parola = m[0];
        const dopo = /^\s*\(/.test(codice.slice(i + parola.length));
        svuota();
        if (PAROLE_PHP.has(parola)) out += span("tk-parola", parola);
        else if (dopo) out += span("tk-funzione", parola);
        else out += escapeHtml(parola);
        i += parola.length;
      } else {
        testo += c;
        i++;
      }
    }
    svuota();
    return { html: out, fine: i };
  }

  function evidenziaPhp(codice) {
    let out = "";
    let i = 0;
    const apertura = /<\?(?:php\b|=)/gi;
    while (i < codice.length) {
      apertura.lastIndex = i;
      const m = apertura.exec(codice);
      if (!m) {
        out += evidenziaHtml(codice.slice(i));
        break;
      }
      out += evidenziaHtml(codice.slice(i, m.index));
      out += span("tk-php-tag", m[0]);
      const blocco = evidenziaBloccoPhp(codice, m.index + m[0].length);
      out += blocco.html;
      i = blocco.fine;
      if (codice.slice(i, i + 2) === "?>") {
        out += span("tk-php-tag", "?>");
        i += 2;
      }
    }
    return out;
  }

  // Richiesta HTTP: metodo nella prima riga, nomi delle intestazioni, corpo
  function evidenziaHttp(codice) {
    const vuota = codice.indexOf("\n\n");
    const testa = vuota === -1 ? codice : codice.slice(0, vuota);
    const corpo = vuota === -1 ? "" : codice.slice(vuota);
    const righe = testa.split("\n").map(function (riga, i) {
      if (i === 0) {
        const m = riga.match(/^(\S+)(\s+)(\S+)([\s\S]*)$/);
        if (!m) return escapeHtml(riga);
        const q = m[3].indexOf("?");
        const percorso = q === -1 ? escapeHtml(m[3]) : escapeHtml(m[3].slice(0, q)) + span("tk-stringa", m[3].slice(q));
        return span("tk-parola", m[1]) + m[2] + percorso + escapeHtml(m[4]);
      }
      const d = riga.indexOf(":");
      return d === -1 ? escapeHtml(riga) : span("tk-proprieta", riga.slice(0, d)) + escapeHtml(riga.slice(d));
    });
    return righe.join("\n") + (corpo ? span("tk-stringa", corpo) : "");
  }

  function evidenzia(codice, lingua) {
    switch (lingua) {
      case "php": return evidenziaPhp(codice);
      case "http": return evidenziaHttp(codice);
      case "js": case "javascript": return evidenziaStileC(codice, PAROLE_JS, "js");
      case "cpp": case "c++": return evidenziaStileC(codice, PAROLE_CPP, "cpp");
      case "css": return evidenziaCss(codice);
      case "html": return evidenziaHtml(codice);
      default: return escapeHtml(codice);
    }
  }

  const NOMI_LINGUE = { php: "PHP", http: "HTTP", js: "JavaScript", html: "HTML", css: "CSS", cpp: "C++" };

  /* ------------------------------------------------------------------------
     4. Componente "esempio PHP": le schede richiesta → server → rete → browser
     ------------------------------------------------------------------------ */

  // La scheda ⓪ "La richiesta" compare solo se il blocco data-php ha data-metodo
  const PASSO_RICHIESTA = { numero: "⓪", titolo: "La richiesta", dettaglio: "dal browser" };
  const PASSI_SERVER = [
    { numero: "①", titolo: "Sul server", dettaglio: "il file PHP" },
    { numero: "②", titolo: "Spedito al browser", dettaglio: "solo HTML" },
    { numero: "③", titolo: "Nel browser", dettaglio: "la pagina" }
  ];

  let contatore = 0;

  function creaCodice(testo, lingua) {
    const pre = crea("pre", "codice");
    const code = crea("code", "lang-" + lingua);
    code.innerHTML = evidenzia(testo, lingua);
    code.setAttribute("data-evidenziato", "");
    pre.appendChild(code);
    if (NOMI_LINGUE[lingua]) pre.setAttribute("data-lingua", NOMI_LINGUE[lingua]);
    return pre;
  }

  // Copia negli appunti, con un ripiego per i browser che non lo permettono
  function copiaTesto(testo, avvisa) {
    function ripiego() {
      const area = crea("textarea");
      area.value = testo;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove();
      avvisa(ok ? "Copiato ✓" : "Copia non riuscita: seleziona il codice a mano");
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(testo).then(function () { avvisa("Copiato ✓"); }, ripiego);
    } else {
      ripiego();
    }
  }

  // Scompone una query string ("nome=Anna&eta=18") in coppie [chiave, valore],
  // decodificando %XX e "+" come fa PHP.
  function coppie(testo) {
    const risultato = [];
    if (!testo) return risultato;
    new URLSearchParams(testo).forEach(function (valore, chiave) { risultato.push([chiave, valore]); });
    return risultato;
  }

  // Tabella "chiave → valore": così PHP vede l'array superglobale
  function creaTabellaCoppie(nome, elenco) {
    const box = crea("div", "coppie");
    const titolo = crea("p", "coppie-titolo");
    titolo.appendChild(crea("code", "", nome));
    titolo.appendChild(document.createTextNode(elenco.length
      ? " contiene " + elenco.length + (elenco.length === 1 ? " coppia" : " coppie") + " chiave → valore"
      : " è vuoto: nessuna coppia"));
    box.appendChild(titolo);
    if (!elenco.length) return box;

    const tabella = crea("table");
    const testa = crea("thead");
    const rigaTesta = crea("tr");
    rigaTesta.appendChild(crea("th", "", "Chiave"));
    rigaTesta.appendChild(crea("th", "coppie-freccia", "→"));
    rigaTesta.appendChild(crea("th", "", "Valore"));
    rigaTesta.appendChild(crea("th", "", "In PHP si legge con"));
    testa.appendChild(rigaTesta);
    tabella.appendChild(testa);
    const corpo = crea("tbody");
    elenco.forEach(function (c) {
      const riga = crea("tr");
      const tdChiave = crea("td");
      tdChiave.appendChild(crea("code", "coppie-chiave", '"' + c[0] + '"'));
      riga.appendChild(tdChiave);
      riga.appendChild(crea("td", "coppie-freccia", "→"));
      const tdValore = crea("td");
      tdValore.appendChild(crea("code", "coppie-valore", '"' + c[1] + '"'));
      riga.appendChild(tdValore);
      const tdUso = crea("td");
      tdUso.appendChild(crea("code", "", nome + '["' + c[0] + '"]'));
      riga.appendChild(tdUso);
      corpo.appendChild(riga);
    });
    tabella.appendChild(corpo);
    const scorri = crea("div", "tabella");
    scorri.appendChild(tabella);
    box.appendChild(scorri);
    return box;
  }

  function EsempioPhp(scriptPhp, scriptHtml) {
    contatore++;
    this.id = "esempio-php-" + contatore;
    this.nomeFile = scriptPhp.getAttribute("data-php") || "pagina.php";
    this.url = scriptPhp.getAttribute("data-url") || "http://localhost/" + this.nomeFile;
    this.metodo = (scriptPhp.getAttribute("data-metodo") || "").toUpperCase();
    this.corpo = scriptPhp.getAttribute("data-corpo") || "";
    this.php = dedent(scriptPhp.textContent);
    this.html = dedent(scriptHtml.textContent);
    this.passi = (this.metodo ? [PASSO_RICHIESTA] : []).concat(PASSI_SERVER);
    this.costruisci(scriptPhp, scriptHtml);
  }

  // Il testo della richiesta HTTP, come la manda il browser
  EsempioPhp.prototype.testoRichiesta = function () {
    let indirizzo;
    try { indirizzo = new URL(this.url); } catch (e) { indirizzo = new URL("http://localhost/" + this.nomeFile); }
    const righe = [
      this.metodo + " " + indirizzo.pathname + indirizzo.search + " HTTP/1.1",
      "Host: " + indirizzo.host,
      // intestazioni tipiche di Chrome su Windows (le stesse usate da verifica-esempi.php)
      "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Accept-Language: it-IT,it;q=0.9,en;q=0.8"
    ];
    if (this.metodo === "POST") {
      righe.push("Content-Type: application/x-www-form-urlencoded");
      righe.push("Content-Length: " + new TextEncoder().encode(this.corpo).length);
      righe.push("");
      righe.push(this.corpo);
    }
    return { testo: righe.join("\n"), query: indirizzo.search.slice(1) };
  };

  EsempioPhp.prototype.costruisci = function (scriptPhp, scriptHtml) {
    const self = this;
    const box = crea("figure", "esempio-php");
    const passi = this.passi;

    // testata: nome del file e pulsante Copia
    const testata = crea("div", "esempio-testata");
    testata.appendChild(crea("span", "esempio-file", this.nomeFile));
    this.stato = crea("span", "esempio-stato");
    this.stato.setAttribute("role", "status");
    testata.appendChild(this.stato);
    const btnCopia = crea("button", "pulsante", "Copia il codice");
    btnCopia.type = "button";
    btnCopia.addEventListener("click", function () {
      copiaTesto(self.php, function (t) { self.avvisa(t); });
    });
    testata.appendChild(btnCopia);
    box.appendChild(testata);

    // schede
    const elenco = crea("div", "esempio-schede");
    elenco.setAttribute("role", "tablist");
    elenco.setAttribute("aria-label", "Il viaggio di " + this.nomeFile);
    this.schede = [];
    this.pannelli = [];

    passi.forEach(function (passo, n) {
      if (n > 0) {
        const freccia = crea("span", "esempio-freccia", "→");
        freccia.setAttribute("aria-hidden", "true");
        elenco.appendChild(freccia);
      }
      const scheda = crea("button", "esempio-scheda");
      scheda.type = "button";
      scheda.id = self.id + "-scheda-" + n;
      scheda.setAttribute("role", "tab");
      scheda.setAttribute("aria-controls", self.id + "-pannello-" + n);
      scheda.appendChild(crea("span", "esempio-scheda-numero", passo.numero));
      const testi = crea("span", "esempio-scheda-testi");
      testi.appendChild(crea("strong", "", passo.titolo));
      testi.appendChild(crea("small", "", passo.dettaglio));
      scheda.appendChild(testi);
      scheda.addEventListener("click", function () { self.mostra(n); });
      scheda.addEventListener("keydown", function (e) {
        // frecce sinistra/destra per passare da una scheda all'altra
        let nuova = null;
        if (e.key === "ArrowRight") nuova = (n + 1) % passi.length;
        if (e.key === "ArrowLeft") nuova = (n + passi.length - 1) % passi.length;
        if (nuova !== null) {
          e.preventDefault();
          self.mostra(nuova);
          self.schede[nuova].focus();
        }
      });
      elenco.appendChild(scheda);
      self.schede.push(scheda);
    });
    box.appendChild(elenco);

    // pannello ⓪: la richiesta HTTP e le coppie chiave → valore che PHP riceve
    if (this.metodo) {
      const richiesta = this.testoRichiesta();
      const p = this.creaPannello();
      p.appendChild(crea("p", "esempio-nota", this.metodo === "POST"
        ? "Questo è ciò che il browser spedisce al server. Con POST i dati viaggiano nel corpo della richiesta, sotto la riga vuota: nell'indirizzo non ci sono."
        : "Questo è ciò che il browser spedisce al server. Con GET i dati viaggiano nell'indirizzo, dopo il punto interrogativo."));
      p.appendChild(creaCodice(richiesta.testo, "http"));
      p.appendChild(crea("p", "esempio-nota", "Prima di eseguire il tuo codice, PHP legge la richiesta e prepara le coppie chiave → valore:"));
      const coppieGet = coppie(richiesta.query);
      p.appendChild(creaTabellaCoppie("$_GET", coppieGet));
      if (this.metodo === "POST") p.appendChild(creaTabellaCoppie("$_POST", coppie(this.corpo)));
    }

    // pannello ①: il file sul server
    const conPhp = /<\?php/i.test(this.php);
    const p0 = this.creaPannello();
    p0.appendChild(crea("p", "esempio-nota", "Questo è il file " + this.nomeFile + " così come lo hai scritto, salvato sul server."));
    p0.appendChild(creaCodice(this.php, conPhp ? "php" : "html"));

    // pannello ②: l'HTML spedito
    const p1 = this.creaPannello();
    p1.appendChild(crea("p", "esempio-nota", conPhp
      ? "Questo è tutto ciò che il server spedisce al browser. Del codice PHP non è rimasta traccia: lo stesso testo lo vedi nel browser con Ctrl+U (Visualizza sorgente pagina)."
      : "Il file non contiene PHP: il server lo spedisce così com'è."));
    p1.appendChild(creaCodice(this.html, "html"));

    // pannello ③: la pagina (iframe senza script, creato al primo uso)
    const p2 = this.creaPannello();
    const finestra = crea("div", "esempio-browser");
    const barraUrl = crea("div", "esempio-browser-barra");
    barraUrl.appendChild(crea("span", "esempio-browser-pallini", "● ● ●"));
    barraUrl.lastChild.setAttribute("aria-hidden", "true");
    barraUrl.appendChild(crea("span", "esempio-browser-url", this.url));
    finestra.appendChild(barraUrl);
    this.contenitorePagina = crea("div", "esempio-browser-pagina");
    finestra.appendChild(this.contenitorePagina);
    p2.appendChild(finestra);
    if (/<form\b/i.test(this.html)) {
      p2.appendChild(crea("p", "esempio-nota", "Questa è un'anteprima: il modulo non si può inviare. Per provarlo davvero, copia i file sul tuo server."));
    }
    this.indicePagina = this.pannelli.length - 1;

    this.pannelli.forEach(function (p) { box.appendChild(p); });

    scriptPhp.replaceWith(box);
    scriptHtml.remove();
    this.el = box;
    this.mostra(0);
  };

  EsempioPhp.prototype.creaPannello = function () {
    const n = this.pannelli.length;
    const passo = this.passi[n];
    const p = crea("div", "esempio-pannello");
    p.id = this.id + "-pannello-" + n;
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", this.id + "-scheda-" + n);
    // titolo visibile solo in stampa, dove le schede spariscono
    p.appendChild(crea("p", "esempio-titolo-stampa", passo.numero + " " + passo.titolo + " (" + passo.dettaglio + ")"));
    this.pannelli.push(p);
    return p;
  };

  EsempioPhp.prototype.mostra = function (n) {
    this.schede.forEach(function (s, i) {
      s.setAttribute("aria-selected", i === n ? "true" : "false");
      s.tabIndex = i === n ? 0 : -1;
    });
    this.pannelli.forEach(function (p, i) { p.hidden = i !== n; });
    if (n === this.indicePagina) this.creaPagina();
  };

  // La pagina viene mostrata in un iframe "sandbox" senza script:
  // proprio come nel browser, l'unica cosa da disegnare è l'HTML ricevuto.
  EsempioPhp.prototype.creaPagina = function () {
    if (this.iframe) return;
    const iframe = crea("iframe", "esempio-iframe");
    iframe.setAttribute("sandbox", "allow-same-origin");
    iframe.setAttribute("title", "Anteprima di " + this.nomeFile);
    iframe.srcdoc = this.html;
    iframe.addEventListener("load", function () {
      try {
        const doc = iframe.contentDocument;
        const h = Math.max(doc.documentElement.scrollHeight, doc.body ? doc.body.scrollHeight : 0);
        iframe.style.height = Math.min(Math.max(h + 4, 60), 480) + "px";
      } catch (e) { /* altezza predefinita del CSS */ }
    });
    this.contenitorePagina.appendChild(iframe);
    this.iframe = iframe;
  };

  EsempioPhp.prototype.avvisa = function (testo) {
    const stato = this.stato;
    stato.textContent = testo;
    clearTimeout(this.timerAvviso);
    this.timerAvviso = setTimeout(function () { stato.textContent = ""; }, 2500);
  };

  /* ------------------------------------------------------------------------
     5. Avvio: trasforma i blocchi presenti nella pagina
     ------------------------------------------------------------------------ */

  const esempi = [];

  function preparaCodiceDaLeggere() {
    // <script type="text/plain" data-codice="php"> → <pre class="codice">
    document.querySelectorAll('script[type="text/plain"][data-codice]').forEach(function (s) {
      const lingua = s.getAttribute("data-codice");
      const pre = crea("pre", "codice");
      const code = crea("code", "lang-" + lingua);
      code.textContent = dedent(s.textContent);
      pre.appendChild(code);
      s.replaceWith(pre);
    });
    // <pre class="codice"><code class="lang-..."> → evidenziato
    document.querySelectorAll("pre.codice > code:not([data-evidenziato])").forEach(function (code) {
      const m = code.className.match(/lang-([\w+]+)/);
      const lingua = m ? m[1] : "";
      const testo = dedent(code.textContent);
      code.innerHTML = evidenzia(testo, lingua);
      if (NOMI_LINGUE[lingua]) code.parentElement.setAttribute("data-lingua", NOMI_LINGUE[lingua]);
    });
  }

  function preparaEsempi() {
    document.querySelectorAll('script[type="text/plain"][data-php]').forEach(function (s) {
      const succ = s.nextElementSibling;
      if (!succ || !succ.matches('script[type="text/plain"][data-html]')) {
        console.warn("codice.js: blocco data-php senza blocco data-html subito dopo.", s);
        return;
      }
      esempi.push(new EsempioPhp(s, succ));
    });
    document.querySelectorAll('script[type="text/plain"][data-html]').forEach(function (s) {
      console.warn("codice.js: blocco data-html senza blocco data-php subito prima.", s);
    });
  }

  // File di dati sul server (per i moduli sui file):
  //   <script type="text/plain" data-file-prima="iscritti.txt"> com'è il file prima della richiesta
  //   <script type="text/plain" data-file-dopo="iscritti.txt">  com'è il file dopo la richiesta
  // Ogni riga del blocco è una riga del file, che finisce sempre con un a capo:
  // gli a capo si vedono come ↵, perché nei file di record contano.
  function preparaFileServer() {
    document.querySelectorAll('script[type="text/plain"][data-file-prima], script[type="text/plain"][data-file-dopo]').forEach(function (s) {
      const prima = s.hasAttribute("data-file-prima");
      const nome = s.getAttribute(prima ? "data-file-prima" : "data-file-dopo");
      const testo = dedent(s.textContent);
      const box = crea("figure", "file-server" + (prima ? "" : " file-server-dopo"));
      const titolo = crea("figcaption");
      titolo.appendChild(crea("span", "file-server-icona", "🗄"));
      titolo.appendChild(document.createTextNode(" Sul server: "));
      titolo.appendChild(crea("code", "", nome));
      titolo.appendChild(document.createTextNode(prima ? ", prima della richiesta" : ", dopo la richiesta"));
      box.appendChild(titolo);
      const pre = crea("pre", "file-server-contenuto");
      if (testo === "") {
        pre.appendChild(crea("span", "file-server-vuoto", "(file vuoto)"));
      } else {
        testo.split("\n").forEach(function (riga) {
          pre.appendChild(document.createTextNode(riga));
          const acapo = crea("span", "file-server-acapo", "↵");
          acapo.title = "a capo (\\n)";
          pre.appendChild(acapo);
          pre.appendChild(document.createTextNode("\n"));
        });
      }
      box.appendChild(pre);
      s.replaceWith(box);
    });
  }

  window.CodicePHP = { evidenzia: evidenzia, dedent: dedent, esempi: esempi };

  function avvia() {
    preparaFileServer();
    preparaEsempi();
    preparaCodiceDaLeggere();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
