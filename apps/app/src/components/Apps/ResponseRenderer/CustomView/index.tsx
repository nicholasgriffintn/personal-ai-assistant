import JsonView from "../JsonView";
import { TutorView } from "./Views/TutorView";
import { WebSearchView } from "./Views/WebSearchView";

export function CustomView({ data }: { data: any }) {
	const customData = data.data || data;

	if (data.name === "web_search") {
		return <WebSearchView data={customData} />;
	}

	if (data.name === "tutor") {
		return <TutorView data={customData} />;
	}

	console.log(
		"ResponseRenderer custom response -> it's on you now!",
		customData,
	);
	return <JsonView data={customData} />;
}
