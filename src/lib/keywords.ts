export class KeywordFilter {
	private filter: Set<string>;

	constructor(keywords: string[]) {
		this.filter = new Set(keywords.map((k) => k.toLowerCase().trim()));
	}

	public static readonly CODING_KEYWORDS = [
		// Programming languages
		"python",
		"javascript",
		"typescript",
		"java",
		"c++",
		"ruby",
		"rust",
		"go",
		"swift",
		"kotlin",
		"scala",
		"php",
		"perl",

		// Coding concepts
		"code",
		"program",
		"function",
		"debug",
		"algorithm",
		"class",
		"object",
		"method",
		"module",
		"library",
		"framework",
		"api",
		"interface",
		"compile",
		"refactor",
		"recursion",
		"iteration",
		"loop",
		"conditional",
		"variable",
		"datastructure",
		"parsing",
		"regex",
		"testing",
		"optimization",
		"react",
		"vue",
		"angular",
		"node",
		"express",
		"flask",
		"django",
		"backend",
		"frontend",
		"fullstack",
	];

	public static readonly MATH_KEYWORDS = [
		"calculate",
		"solve",
		"equation",
		"math",
		"algebra",
		"geometry",
		"calculus",
		"statistics",
		"probability",
		"matrix",
		"vector",
		"derivative",
		"integral",
		"trigonometry",
		"logarithm",
		"polynomial",
		"formula",
		"theorem",
		"proof",
		"numerical",
		"computation",
		"algorithm",
		"optimization",
		"regression",
		"interpolation",
		"extrapolation",
		"linear",
		"nonlinear",
		"function",
	];

	hasKeywords(text: string): boolean {
		const words = text.toLowerCase().split(/\W+/);
		return words.some((word) => this.filter.has(word));
	}

	getMatchedKeywords(text: string): string[] {
		const words = text.toLowerCase().split(/\W+/);
		return words.filter((word) => this.filter.has(word));
	}
}