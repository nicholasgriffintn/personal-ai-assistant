export function extractQuotes(text: string): string[] {
	const quoteRegex = /"([^"]*)"/g;

	const quotes: string[] = [];
	let match;

	while ((match = quoteRegex.exec(text)) !== null) {
		const quote = match[1].trim();

		if (quote.length > 10 && !quote.match(/^\d+$/)) {
			quotes.push(quote);
		}
	}

	return [...new Set(quotes)];
}
