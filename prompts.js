/**
 * Generate a prompt for the AI to create a title variation
 * @param {string} text - The original title text
 * @param {string} handle - The product handle which may contain additional details
 * @returns {string} The formatted prompt
 */
function getTitlePrompt(text, handle) {
    // Extract color information from handle if available
    let colorInfo = '';
    const colorKeywords = [
        'zwart',
        'wit',
        'rood',
        'blauw',
        'groen',
        'geel',
        'grijs',
        'bruin',
        'oranje',
        'paars',
        'roze',
        'beige',
        'silver',
        'gold',
        'mat',
        'glanzend',
        'metallic'
    ];

    for (const color of colorKeywords) {
        if (handle.toLowerCase().includes(color)) {
            colorInfo = `\nKleur informatie uit handle: "${color}"`;
            break;
        }
    }

    return `Genereer een unieke variatie van deze producttitel in het Nederlands, met behoud van de betekenis en structuur:

    Titel: "${text}"
    Handle: "${handle}"${colorInfo}

    Vereisten:
        - Behoud de belangrijkste zoekwoorden en productinformatie
        - Zorg dat eventuele kleur- of stijlinformatie uit de handle behouden blijft
        - Gebruik synoniemen of herschik de volgorde subtiel
        - Houd de lengte en het format vergelijkbaar (kort, scanbaar, geen overbodige woorden)
        - Gebruik geen extra marketingtaal of creatieve toevoegingen
        - Behoud consistentie in stijl (zoals gebruik van "|" of koppeltekens)
        - Geef alleen de nieuwe titel terug — geen uitleg, geen extra tekst
        - De output moet volledig in het Nederlands zijn`;
}

/**
 * Generate a prompt for the AI to create a duplicate productbeschrijving (HTML body) variation
 * @param {string} html - The original HTML product description
 * @param {string} handle - The product handle (optional context)
 * @returns {string} The formatted prompt
 */
function getBodyPrompt(html, handle) {
    return `Genereer een unieke variatie van deze productbeschrijving in HTML, met behoud van de betekenis:

Beschrijving (HTML): """${html}"""
Handle: "${handle}"

Vereisten:
    - Behoud alle belangrijke informatie en verkooppunten
    - Gebruik andere zinsstructuren en synoniemen waar mogelijk
    - Houd de HTML-structuur functioneel gelijk (zoals <ul>, <p>, <strong>, enz.)
    - Geen toevoegingen of creatieve uitbreidingen
    - Houd de lengte vergelijkbaar
    - Behoud dezelfde toon en stijl
    - Geef alleen de nieuwe HTML-beschrijving terug — geen uitleg, geen extra tekst
    - De output moet volledig in het Nederlands zijn
    - Geef alleen de herschreven HTML terug, zonder aanhalingstekens of andere tekens eromheen
    - BELANGRIJK: Begin je antwoord NOOIT met drie aanhalingstekens (""") of andere markeringen
    - Begin je antwoord direct met de HTML-tag (bijvoorbeeld <p> of <div>)
    `;
}

export { getTitlePrompt, getBodyPrompt };
