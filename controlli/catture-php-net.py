"""
catture-php-net.py — rifà gli screenshot del manuale di PHP usati nel modulo 03

Il manuale di php.net è distribuito con licenza Creative Commons Attribution 3.0
(https://www.php.net/manual/en/copyright.php): le immagini si possono usare
citando "PHP Documentation Group" e la licenza, come nelle didascalie.

Quando php.net cambia grafica, basta lanciare (dalla cartella del corso):

    python3 controlli/catture-php-net.py

Serve: Google Chrome, ImageMagick (comando "magick") e il pacchetto Python
websocket-client (pip install websocket-client). Lo script apre Chrome senza
finestra, carica le pagine, toglie il banner degli avvisi, misura le sezioni
e salva i ritagli in moduli/03-documentazione/img/.
"""
import base64, json, os, subprocess, sys, tempfile, time, urllib.request
import websocket

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if sys.platform.startswith("win"):
    CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORTA = 9333
CARTELLA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "moduli", "03-documentazione", "img")


class Pagina:
    """Una scheda di Chrome headless comandata con il protocollo DevTools."""

    def __init__(self, larghezza=1100):
        self.profilo = tempfile.mkdtemp()
        self.processo = subprocess.Popen(
            [CHROME, "--headless=new", f"--remote-debugging-port={PORTA}", f"--user-data-dir={self.profilo}",
             "--no-first-run", "--hide-scrollbars", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        indirizzo = None
        for _ in range(50):
            try:
                schede = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORTA}/json"))
                indirizzo = [s for s in schede if s["type"] == "page"][0]["webSocketDebuggerUrl"]
                break
            except Exception:
                time.sleep(0.2)
        self.ws = websocket.create_connection(indirizzo, timeout=60)
        self.n = 0
        self.comando("Emulation.setDeviceMetricsOverride", width=larghezza, height=900, deviceScaleFactor=1, mobile=False)

    def comando(self, metodo, **parametri):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": metodo, "params": parametri}))
        while True:
            risposta = json.loads(self.ws.recv())
            if risposta.get("id") == self.n:
                if "error" in risposta:
                    raise RuntimeError(risposta["error"])
                return risposta["result"]

    def vai(self, url, attesa=4):
        self.comando("Page.enable")
        self.comando("Page.navigate", url=url)
        time.sleep(attesa)

    def js(self, codice):
        return self.comando("Runtime.evaluate", expression=codice, returnByValue=True)["result"].get("value")

    def cattura(self, nome, x, y, w, h, scala=1.5):
        r = self.comando("Page.captureScreenshot", format="png", captureBeyondViewport=True,
                         clip={"x": x, "y": y, "width": w, "height": h, "scale": scala})
        with open(os.path.join(CARTELLA, nome + ".png"), "wb") as f:
            f.write(base64.b64decode(r["data"]))

    def chiudi(self):
        self.ws.close()
        self.processo.terminate()


# Misura le zone della pagina di date() (coordinate in pixel: x, y, larghezza, altezza)
MISURA_DATE = """(() => {
  document.querySelectorAll('.headsup').forEach(e => e.remove());   // banner degli avvisi
  window.scrollTo(0, 0);
  const r = e => { if (!e) return null; const b = e.getBoundingClientRect();
    return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; };
  const sez = id => document.getElementById('refsect1-function.date-' + id);
  const cerca = document.elementFromPoint(innerWidth - 160, 32);    // casella "Search docs"
  return {
    cerca: r(cerca && (cerca.closest('button, a, label, form') || cerca)),
    nome: r(document.querySelector('.refnamediv')),
    firma: r(document.querySelector('.methodsynopsis')),
    descrizione: r(sez('description')), parametri: r(sez('parameters')), ritorno: r(sez('returnvalues')),
    changelog: r(sez('changelog')), esempi: r(sez('examples')), seealso: r(sez('seealso')),
    esempio1: r(sez('examples').querySelector('.example'))
  };
})()"""

# Misura la tabella dei caratteri di formato su DateTimeInterface::format()
MISURA_FORMATI = """(() => {
  document.querySelectorAll('.headsup').forEach(e => e.remove());
  const t = document.querySelector('table'); const b = t.getBoundingClientRect();
  const righe = [...t.querySelectorAll('tbody tr')].map(tr => { const q = tr.getBoundingClientRect();
    return [Math.round(q.top + scrollY), Math.round(q.height)]; });
  return { tabella: [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width)], righe };
})()"""


def annota(sorgente, destinazione, zone):
    """Disegna riquadri arancioni numerati sulle zone (elenco di (numero, [x, y, w, h]))."""
    comandi = ["magick", sorgente, "-fill", "none", "-stroke", "#e8590c", "-strokewidth", "4"]
    for _, (x, y, w, h) in zone:
        comandi += ["-draw", f"roundrectangle {x-6},{y-6} {x+w+6},{y+h+6} 8,8"]
    centri = [(n, (x - 22, y + h // 2) if n == "1" else (x - 6, y - 6)) for n, (x, y, w, h) in zone]
    comandi += ["-stroke", "none", "-fill", "#e8590c"]
    for _, (cx, cy) in centri:
        comandi += ["-draw", f"circle {cx},{cy} {cx+17},{cy}"]
    comandi += ["-fill", "white", "-font", "Helvetica-Bold", "-pointsize", "22"]
    for n, (cx, cy) in centri:
        comandi += ["-annotate", f"+{cx-6}+{cy+8}", n]
    subprocess.run(comandi + ["-strip", destinazione], check=True)


def main():
    os.makedirs(CARTELLA, exist_ok=True)
    p = Pagina()

    p.vai("https://www.php.net/manual/en/function.date.php")
    m = p.js(MISURA_DATE)
    x0, w0 = 8, m["nome"][2] + 32
    fondo = lambda z: z[1] + z[3]

    p.cattura("_panoramica", 0, 0, 1100, fondo(m["ritorno"]) + 20, scala=1)
    p.cattura("date-firma", x0, m["nome"][1] - 8, w0, fondo(m["firma"]) - m["nome"][1] + 20)
    p.cattura("date-descrizione", x0, fondo(m["firma"]) + 4, w0, fondo(m["descrizione"]) - fondo(m["firma"]))
    for chiave in ["parametri", "ritorno", "changelog", "seealso"]:
        s = m[chiave]
        p.cattura("date-" + chiave, x0, s[1] - 8, w0, s[3] + 16)
    p.cattura("date-esempi", x0, m["esempi"][1] - 8, w0, fondo(m["esempio1"]) - m["esempi"][1] + 16)

    grezza = os.path.join(CARTELLA, "_panoramica.png")
    annota(grezza, os.path.join(CARTELLA, "date-panoramica-annotata.png"),
           [("1", m["cerca"]), ("2", m["nome"]), ("3", m["firma"]), ("4", m["parametri"]), ("5", m["ritorno"])])
    os.remove(grezza)

    # intestazione della tabella + gruppo "Day" + caratteri d e D
    p.vai("https://www.php.net/manual/en/datetime.format.php")
    t = p.js(MISURA_FORMATI)
    fine = t["righe"][2][0] + t["righe"][2][1]
    p.cattura("format-tabella", t["tabella"][0] - 6, t["tabella"][1] - 22, t["tabella"][2] + 12, fine - t["tabella"][1] + 30)

    p.chiudi()
    print("Catture salvate in", os.path.normpath(CARTELLA))


if __name__ == "__main__":
    main()
