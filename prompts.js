/**
 * Generate a prompt for creating a unique variation of a collection title
 * @param {string} title - The original collection title
 * @param {string} handle - Collection handle with additional details
 * @returns {string} The prompt for the AI
 */
export function getTitlePrompt(title, handle) {
    return `Je bent een expert in het schrijven van unieke collectietitels voor een webshop.

Hier is de originele titel van een collectie:
"${title}"

Collectie handle: ${handle}

Maak een unieke variatie van deze collectietitel. De nieuwe titel moet:
- Dezelfde informatie bevatten als de originele titel
- Uniek zijn en niet te veel lijken op de originele titel
- SEO-vriendelijk zijn met relevante zoekwoorden
- Niet langer zijn dan 60 karakters
- Geen speciale tekens of symbolen bevatten aan het begin of einde
- Direct beginnen met de titel, zonder aanhalingstekens of andere markeringen

BELANGRIJK: Begin je antwoord NOOIT met drie aanhalingstekens (""") of andere markeringen.
Begin je antwoord direct met de titel.

Geef alleen de nieuwe titel, zonder uitleg of extra tekst.`;
}

/**
 * Generate a prompt for creating a unique variation of a collection description
 * @param {string} description - The original collection description
 * @param {string} handle - Collection handle with additional details
 * @returns {string} The prompt for the AI
 */
export function getDescriptionPrompt(description, handle) {
    return `Je bent een expert in het schrijven van unieke collectiebeschrijvingen voor een webshop.

Hier is de originele beschrijving van een collectie:
"${description}"

Collectie handle: ${handle}

Maak een unieke variatie van deze collectiebeschrijving. De nieuwe beschrijving moet:
- Dezelfde informatie bevatten als de originele beschrijving
- Uniek zijn en niet te veel lijken op de originele beschrijving
- SEO-vriendelijk zijn met relevante zoekwoorden
- Geen speciale tekens of symbolen bevatten aan het begin of einde
- Direct beginnen met de beschrijving, zonder aanhalingstekens of andere markeringen

BELANGRIJK: Begin je antwoord NOOIT met drie aanhalingstekens (""") of andere markeringen.
Begin je antwoord direct met de beschrijving.

Geef alleen de nieuwe beschrijving, zonder uitleg of extra tekst.`;
}

/**
 * Generate a prompt for creating a unique variation of a collection HTML description
 * @param {string} html - The original collection HTML description
 * @param {string} handle - Collection handle with additional details
 * @returns {string} The prompt for the AI
 */
export function getBodyPrompt(html, handle) {
    return `Je bent een expert in het schrijven van unieke HTML-collectiebeschrijvingen voor een webshop.

Hier is de originele HTML-beschrijving van een collectie:
"${html}"

Collectie handle: ${handle}

Maak een unieke variatie van deze HTML-beschrijving. De nieuwe beschrijving moet:
- Dezelfde informatie bevatten als de originele beschrijving
- Uniek zijn en niet te veel lijken op de originele beschrijving
- SEO-vriendelijk zijn met relevante zoekwoorden
- Dezelfde HTML-structuur behouden (paragrafen, lijsten, etc.)
- Geen speciale tekens of symbolen bevatten aan het begin of einde
- Direct beginnen met de HTML-tag (bijvoorbeeld <p> of <div>), zonder aanhalingstekens of andere markeringen

BELANGRIJK: Begin je antwoord NOOIT met drie aanhalingstekens (""") of andere markeringen.
Begin je antwoord direct met de HTML-tag (bijvoorbeeld <p> of <div>).

Geef alleen de nieuwe HTML-beschrijving, zonder uitleg of extra tekst.`;
}

/**
 * Generate a prompt for creating a unique variation of general collection content
 * @param {string} content - The original collection content
 * @param {string} handle - Collection handle with additional details
 * @returns {string} The prompt for the AI
 */
export function getGeneralPrompt(content, handle) {
    return `Je bent een expert in het schrijven van unieke collectiecontent voor een webshop.

Hier is de originele content van een collectie:
"${content}"

Collectie handle: ${handle}

Maak een unieke variatie van deze collectiecontent. De nieuwe content moet:
- Dezelfde informatie bevatten als de originele content
- Uniek zijn en niet te veel lijken op de originele content
- SEO-vriendelijk zijn met relevante zoekwoorden
- Geen speciale tekens of symbolen bevatten aan het begin of einde
- Direct beginnen met de content, zonder aanhalingstekens of andere markeringen

BELANGRIJK: Begin je antwoord NOOIT met drie aanhalingstekens (""") of andere markeringen.
Begin je antwoord direct met de content.

Geef alleen de nieuwe content, zonder uitleg of extra tekst.`;
}
