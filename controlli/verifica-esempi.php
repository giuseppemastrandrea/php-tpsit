<?php
/* ==========================================================================
   verifica-esempi.php — controlla gli esempi PHP delle dispense

   Ogni esempio di una dispensa è formato da due blocchi:
     <script type="text/plain" data-php="nome.php"> codice PHP </script>
     <script type="text/plain" data-html> HTML che il server spedisce </script>

   Questo script esegue il codice di ogni blocco data-php con il vero
   interprete PHP e confronta l'output con il blocco data-html.
   Gli errori vengono mostrati come in XAMPP (display_errors attivo) e il
   percorso del file diventa C:\xampp\htdocs\tpsit\nome.php.
   La richiesta viene simulata dagli attributi del blocco data-php:
   data-url (con la query string), data-metodo (GET o POST), data-corpo
   (i dati POST). $_SERVER contiene valori tipici di XAMPP (vedi superglobali()).

   Uso (dalla cartella principale del corso):
     php controlli/verifica-esempi.php              tutte le dispense
     php controlli/verifica-esempi.php moduli/01-primi-passi/index.html
     php controlli/verifica-esempi.php --mostra ... stampa anche l'output vero
     php controlli/verifica-esempi.php --riempi ... scrive l'output vero nei
                                                    blocchi data-html VUOTI
                                                    (gli altri vengono solo controllati)

   Alla fine controlla anche che le "sezioni" dei moduli in corso.js (l'indice
   del corso nella home) corrispondano ai titoli h2 delle dispense.

   Gli esempi sui file possono avere, subito prima, un blocco data-file-prima
   (il file di dati da creare prima di eseguire) e, subito dopo il data-html,
   un blocco data-file-dopo (com'è il file dopo l'esecuzione): anche questo
   viene confrontato, o riempito con --riempi se è vuoto. Ogni esempio gira in
   una cartella nuova, che fa da htdocs	psit.

   I blocchi data-html con l'attributo data-variabile (output che cambia a
   ogni richiesta, per esempio con date()) vengono eseguiti ma non confrontati.
   ========================================================================== */

const CARTELLA_XAMPP = 'C:\\xampp\\htdocs\\tpsit\\';

// Come dedent() di codice.js: toglie le righe vuote all'inizio e alla fine
// e l'indentazione comune a tutte le righe.
function dedent(string $testo): string
{
    $righe = explode("\n", str_replace(["\r\n", "\r", "\t"], ["\n", "\n", "  "], $testo));
    while ($righe && trim($righe[0]) === '') array_shift($righe);
    while ($righe && trim(end($righe)) === '') array_pop($righe);
    $minimo = PHP_INT_MAX;
    foreach ($righe as $r) {
        if (trim($r) === '') continue;
        $minimo = min($minimo, strlen($r) - strlen(ltrim($r, ' ')));
    }
    if ($minimo === PHP_INT_MAX) $minimo = 0;
    return implode("\n", array_map(fn($r) => (string) substr($r, $minimo), $righe));
}

// Toglie solo gli a capo iniziali e finali (gli spazi in mezzo contano)
function pulisci(string $testo): string
{
    return trim(str_replace("\r\n", "\n", $testo), "\n");
}

// Le superglobali che Apache e PHP preparerebbero per questa richiesta.
// I valori imitano XAMPP su Windows, così l'output è sempre lo stesso.
function superglobali(string $nomeFile, array $attributi): array
{
    $metodo = strtoupper($attributi['data-metodo'] ?? 'GET');
    $url = $attributi['data-url'] ?? 'http://localhost/' . $nomeFile;
    $corpo = $attributi['data-corpo'] ?? '';
    $parti = parse_url($url);
    $host = $parti['host'] ?? 'localhost';
    $porta = (string) ($parti['port'] ?? 80);
    $percorso = $parti['path'] ?? '/' . $nomeFile;
    $query = $parti['query'] ?? '';

    parse_str($query, $get);
    $post = [];
    if ($metodo === 'POST') parse_str($corpo, $post);

    $server = [
        'HTTP_HOST' => $host . (isset($parti['port']) ? ':' . $porta : ''),
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'HTTP_ACCEPT_LANGUAGE' => 'it-IT,it;q=0.9,en;q=0.8',
        'SERVER_SOFTWARE' => 'Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12',
        'SERVER_NAME' => $host,
        'SERVER_ADDR' => '::1',
        'SERVER_PORT' => $porta,
        'REMOTE_ADDR' => '::1',
        'DOCUMENT_ROOT' => 'C:/xampp/htdocs',
        'SCRIPT_FILENAME' => 'C:/xampp/htdocs' . $percorso,
        'SERVER_PROTOCOL' => 'HTTP/1.1',
        'REQUEST_METHOD' => $metodo,
        'QUERY_STRING' => $query,
        'REQUEST_URI' => $percorso . ($query !== '' ? '?' . $query : ''),
        'SCRIPT_NAME' => $percorso,
        'PHP_SELF' => $percorso,
        'REQUEST_TIME' => 1793011200,
    ];
    if ($metodo === 'POST') {
        $server['CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
        $server['CONTENT_LENGTH'] = (string) strlen($corpo);
    }
    return ['get' => $get, 'post' => $post, 'server' => $server];
}

// Legge gli attributi di un tag: data-x="..." → ['data-x' => '...']
function attributi(string $tag): array
{
    preg_match_all('/([\w-]+)(?:="([^"]*)")?/', $tag, $m, PREG_SET_ORDER);
    $risultato = [];
    foreach ($m as $a) $risultato[$a[1]] = html_entity_decode($a[2] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return $risultato;
}

// Esegue un esempio in una cartella nuova, come se fosse htdocs\tpsit:
// $filePrima = [nome => contenuto] sono i file di dati da creare prima,
// $nomeDopo è il file di dati da leggere dopo (null se non serve).
// Restituisce [output, contenuto del file dopo (null se non esiste)].
function esegui(string $codice, string $nomeFile, array $attributi, array $filePrima, ?string $nomeDopo): array
{
    static $contatore = 0;
    $contatore++;
    $cartella = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'verifica-esempi-' . getmypid() . '-' . $contatore;
    mkdir($cartella);
    $percorso = $cartella . DIRECTORY_SEPARATOR . $nomeFile;
    file_put_contents($percorso, $codice . "\n");
    foreach ($filePrima as $nome => $contenuto) {
        file_put_contents($cartella . DIRECTORY_SEPARATOR . $nome, $contenuto);
    }

    // file eseguito prima dell'esempio: riempie $_GET, $_POST e $_SERVER
    $s = superglobali($nomeFile, $attributi);
    $preludio = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'verifica-esempi-preludio-' . getmypid() . '.php';
    file_put_contents($preludio, "<?php\n"
        . '$_GET = ' . var_export($s['get'], true) . ";\n"
        . '$_POST = ' . var_export($s['post'], true) . ";\n"
        . '$_SERVER = ' . var_export($s['server'], true) . ";\n"
        . '$_REQUEST = array_merge($_GET, $_POST);' . "\n");

    // come Apache: la cartella di lavoro è quella dello script,
    // così fopen("iscritti.txt", ...) trova il file accanto all'esempio
    $comando = 'cd ' . escapeshellarg($cartella) . ' && ' . escapeshellarg(PHP_BINARY)
        . ' -n -d display_errors=1 -d html_errors=1 -d log_errors=0 -d date.timezone=Europe/Rome'
        . ' -d auto_prepend_file=' . escapeshellarg($preludio) . ' '
        . escapeshellarg($nomeFile);
    $output = (string) shell_exec($comando);
    // il percorso temporaneo diventa quello che vedrebbe uno studente con XAMPP
    $output = str_replace([realpath($percorso), $percorso], CARTELLA_XAMPP . $nomeFile, $output);

    $dopo = null;
    if ($nomeDopo !== null && is_file($cartella . DIRECTORY_SEPARATOR . $nomeDopo)) {
        $dopo = file_get_contents($cartella . DIRECTORY_SEPARATOR . $nomeDopo);
    }
    foreach (glob($cartella . DIRECTORY_SEPARATOR . '*') as $x) unlink($x);
    rmdir($cartella);
    unlink($preludio);
    return [$output, $dopo];
}

// Contenuto di un blocco data-file-prima/dopo → contenuto del file:
// ogni riga è una riga del file, e il file finisce con un a capo
function contenutoFile(string $blocco): string
{
    $testo = dedent($blocco);
    return $testo === '' ? '' : $testo . "\n";
}

// Rientra un testo come il tag <script> che lo conterrà (per --riempi)
function rientra(string $testo, string $rientro): string
{
    return preg_replace('/^(?=.)/m', $rientro . '  ', $testo);
}

$argomenti = array_slice($argv, 1);
$mostra = in_array('--mostra', $argomenti, true);
$riempi = in_array('--riempi', $argomenti, true);
$file = array_values(array_filter($argomenti, fn($a) => !str_starts_with($a, '--')));
if (!$file) {
    $file = glob(__DIR__ . '/../moduli/[0-9]*/index.html');
}

$errori = 0;
$totale = 0;
// [file prima]  data-php  data-html  [file dopo]
$espressione = '#(?:<script type="text/plain" data-file-prima="(?<pnome>[^"]+)">(?<pcont>.*?)</script>\s*)?'
    . '<script type="text/plain" (?<tag>data-php="(?<nome>[^"]+)"[^>]*)>(?<php>.*?)</script>(?<spazio>\s*)'
    . '<script type="text/plain" data-html(?<attr>[^>]*)>(?<html>.*?)</script>'
    . '(?:(?<dspazio>\s*)<script type="text/plain" data-file-dopo="(?<dnome>[^"]+)">(?<dcont>.*?)</script>)?#s';

foreach ($file as $f) {
    $html = file_get_contents($f);
    if ($html === false) {
        echo "✗ Non riesco a leggere $f\n";
        $errori++;
        continue;
    }
    echo "\n" . str_replace(__DIR__ . '/../', '', $f) . "\n";
    $n = 0;
    $riempiti = 0;

    $nuovo = preg_replace_callback($espressione, function ($t) use (&$n, &$totale, &$errori, &$riempiti, $mostra, $riempi) {
        $n++;
        $totale++;
        $inizio = $t[0][1];
        $tutto = $t[0][0];
        $g = fn($k) => isset($t[$k]) && $t[$k][1] >= 0 ? $t[$k][0] : null;
        $nome = $g('nome');
        $numero = str_pad((string) $n, 2, ' ', STR_PAD_LEFT);
        $variabile = str_contains($g('attr'), 'data-variabile');
        $filePrima = $g('pnome') !== null ? [$g('pnome') => contenutoFile($g('pcont'))] : [];
        $nomeDopo = $g('dnome');

        [$vero, $dopo] = esegui(dedent($g('php')), $nome, attributi($g('tag')), $filePrima, $nomeDopo);
        $vero = pulisci($vero);
        $rientro = preg_replace('/^.*\n/s', '', $g('spazio'));

        // sostituzioni da fare dentro il testo trovato: [posizione, lunghezza, testo nuovo]
        $modifiche = [];
        $problemi = [];

        $atteso = $g('html');
        if ($riempi && trim($atteso) === '') {
            $modifiche[] = [$t['html'][1] - $inizio, strlen($atteso), "\n" . rientra($vero, $rientro) . "\n" . $rientro];
            echo "  + $numero. $nome (data-html riempito)\n";
        } elseif ($variabile) {
            echo "  ~ $numero. $nome (output variabile: non confrontato)\n";
        } elseif ($vero !== pulisci(dedent($atteso))) {
            $problemi[] = "l'output vero è diverso dal blocco data-html\n"
                . "    --- atteso (data-html)\n" . preg_replace('/^/m', '    | ', pulisci(dedent($atteso))) . "\n"
                . "    --- vero (php)\n" . preg_replace('/^/m', '    | ', $vero);
        }

        if ($nomeDopo !== null) {
            $veroFile = $dopo === null ? null : (str_ends_with($dopo, "\n") ? substr($dopo, 0, -1) : $dopo);
            $attesoFile = $g('dcont');
            if ($dopo === null) {
                $problemi[] = "dopo l'esecuzione il file $nomeDopo non esiste";
            } elseif ($dopo !== '' && !str_ends_with($dopo, "\n")) {
                $problemi[] = "il file $nomeDopo non finisce con un a capo: il blocco data-file-dopo non lo può mostrare";
            } elseif ($riempi && trim($attesoFile) === '') {
                $modifiche[] = [$t['dcont'][1] - $inizio, strlen($attesoFile), "\n" . rientra($veroFile, $rientro) . "\n" . $rientro];
                echo "  + $numero. $nome (data-file-dopo $nomeDopo riempito)\n";
            } elseif ($veroFile !== dedent($attesoFile)) {
                $problemi[] = "il file $nomeDopo è diverso dal blocco data-file-dopo\n"
                    . "    --- atteso\n" . preg_replace('/^/m', '    | ', dedent($attesoFile)) . "\n"
                    . "    --- vero\n" . preg_replace('/^/m', '    | ', $veroFile);
            }
        }

        if ($problemi) {
            $errori++;
            foreach ($problemi as $p) echo "  ✗ $numero. $nome: $p\n";
        } elseif (!$modifiche && !$variabile) {
            echo "  ✓ $numero. $nome\n";
        }
        if ($mostra) {
            echo preg_replace('/^/m', '    | ', $vero) . "\n";
            if ($nomeDopo !== null && $dopo !== null) echo "    🗄 $nomeDopo dopo:\n" . preg_replace('/^/m', '    | ', $dopo);
        }

        // applico le modifiche dalla fine all'inizio, così le posizioni restano valide
        usort($modifiche, fn($a, $b) => $b[0] <=> $a[0]);
        foreach ($modifiche as [$pos, $lung, $testo]) $tutto = substr_replace($tutto, $testo, $pos, $lung);
        if ($modifiche) $riempiti++;
        return $tutto;
    }, $html, -1, $quanti, PREG_OFFSET_CAPTURE);

    if ($n === 0) echo "  (nessun esempio PHP)\n";
    if ($riempiti > 0) file_put_contents($f, $nuovo);
}

// Indice del corso: le "sezioni" di corso.js devono corrispondere ai titoli h2
// (con id) delle dispense, tranne l'introduzione
echo "\nIndice del corso (corso.js)\n";
$corso = (string) file_get_contents(__DIR__ . '/../corso.js');
preg_match_all('#percorso: "([^"]+)",\s*sezioni: \[(.*?)\n\s*\]#s', $corso, $moduli, PREG_SET_ORDER);
foreach ($moduli as [, $percorso, $elenco]) {
    preg_match_all('#\{ id: "([^"]+)", titolo: ("(?:[^"\\\\]|\\\\.)*") \}#', $elenco, $voci, PREG_SET_ORDER);
    $nelCorso = array_map(fn($v) => $v[1] . ' ' . json_decode($v[2]), $voci);
    $html = (string) @file_get_contents(__DIR__ . '/../' . $percorso);
    preg_match_all('#<h2 id="([^"]+)">(.*?)</h2>#s', $html, $titoli, PREG_SET_ORDER);
    $nellaDispensa = [];
    foreach ($titoli as [, $id, $testo]) {
        if ($id === 'introduzione') continue;
        $nellaDispensa[] = $id . ' ' . html_entity_decode(strip_tags($testo), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    if ($nelCorso === $nellaDispensa) {
        echo "  ✓ $percorso\n";
    } else {
        $errori++;
        echo "  ✗ $percorso: le sezioni in corso.js non corrispondono ai titoli h2\n";
        foreach (array_diff($nellaDispensa, $nelCorso) as $x) echo "    manca in corso.js: $x\n";
        foreach (array_diff($nelCorso, $nellaDispensa) as $x) echo "    non c'è nella dispensa: $x\n";
    }
}

echo "\n" . ($errori === 0 ? "Tutto a posto: $totale esempi controllati.\n" : "$errori problemi da correggere ($totale esempi controllati).\n");
exit($errori === 0 ? 0 : 1);
