# Prezentacje v2 – Podstawy programowania w R

Interaktywne prezentacje Quarto (revealjs) w kolorach Collegium Da Vinci. Jeden plik `.qmd` na zjazd.

| Plik | Zjazd |
|---|---|
| `zjazd0_organizacja.qmd` | 0. Organizacja zajęć (dawne 00_wstep): prowadzący, cel kursu, program 4 zjazdów, narzędzia, praca między zjazdami, zasady AI |
| `zjazd1_wprowadzenie.qmd` | 1. Wprowadzenie do R i typy danych (dawne 01_wprowadzenie + 02_typy_danych, bez slajdów o interfejsie) |
| `zjazd2_przetwarzanie.qmd` | 2. Przetwarzanie danych (próbka z 18.11.2026) |

## Jak wygenerować

W tym folderze (terminal RStudio lub Positron):

```
quarto render                          # wszystkie prezentacje
quarto render zjazd1_wprowadzenie.qmd  # jedna
```

Wystarczy Quarto, R ani pakiety nie są potrzebne (brak wykonywanych chunków `{r}`).
Wynik to jeden plik `.html` na zjazd, który działa po otwarciu w przeglądarce.

Folder ma własny `_quarto.yml`, więc renderuje się niezależnie od podręcznika w folderze nadrzędnym.
Wspólne ustawienia (motyw, czcionka, rozmiar slajdów) są w `_quarto.yml`.

## Wspólne zasoby (`assets/`)

- `widgets.css` – kolory CDV (zmienne `--cdv-*` na początku pliku) i wygląd widgetów
- `widgets.js` – widgety (czysty JavaScript)
- `widgets-include.html` – dołącza `widgets.js`
- `cdv_logo.png`, `cdv_tytul.png` – logo i grafika slajdu tytułowego z szablonu CDV 2026

## Widgety ogólne (do użycia na dowolnym slajdzie)

**Quiz** – pytania w JSON wewnątrz bloku HTML:

````
```{=html}
<div class="w-quiz" data-widget="quiz"><script type="application/json">
{"button": "Losuj pytanie",
 "options": ["A", "B", "C"],
 "items": [ {"code": "1 / 0", "answer": "A", "why": "wyjaśnienie"},
            {"q": "pytanie tekstowe", "options": ["X", "Y"], "answer": "Y", "why": "..."} ]}
</script></div>
```
````

Opcje: `options` wspólne dla wszystkich pytań albo osobno w pytaniu, `"vertical": true` układa odpowiedzi pionowo.

**Minutnik** – `<div class="w-timer" data-widget="timer" data-minutes="5"></div>`

**Pokaż odpowiedź** – `<button class="w-btn" data-reveal-target="id">Pokaż</button>` i blok `::: {#id .w-hidden}`.

## Widgety specjalne (po id, raz w prezentacji)

| id | Zjazd | Co robi |
|---|---|---|
| `logbuilder` | 1 | argumenty funkcji na przykładzie `log()` |
| `vecindex` | 1 | indeksowanie wektora `month.name` |
| `dfexplorer` | 1 | indeksowanie ramki danych z podświetlaniem komórek |
| `pipeline` | 2 | budowniczy potoku dplyr |
| `verbquiz` | 2 | który czasownik dplyr? |
| `parsons` | 2 | układanie potoku |
| `bughunt` | 2 | znajdź błąd |
| `joins` | 2 | złączenia tabel |
| `aihunt` | 2 | polowanie na błędy AI |
| `webr` | 2 | R w przeglądarce (webR, wymaga internetu) |
