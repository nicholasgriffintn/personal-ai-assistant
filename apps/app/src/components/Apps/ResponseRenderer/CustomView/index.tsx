import JsonView from "../JsonView";
import { WebSearchView } from "./Views/WebSearchView";

export function CustomView({ data }: { data: any }) {
	if (data.name === "web_search") {
		return <WebSearchView data={data} />;
	}

	console.log("ResponseRenderer custom response -> it's on you now!", data);
	return <JsonView data={data} />;
}
