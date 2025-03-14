import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoadingSpinner from ".";

describe("LoadingSpinner", () => {
	it("renders without crashing", () => {
		render(<LoadingSpinner />);
		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("displays the message when provided", () => {
		const testMessage = "Loading test data...";
		render(<LoadingSpinner message={testMessage} />);
		expect(screen.getByText(testMessage)).toBeInTheDocument();
	});

	it("displays progress percentage when provided", () => {
		const testProgress = 75;
		render(<LoadingSpinner progress={testProgress} />);
		expect(screen.getByText("75%")).toBeInTheDocument();
	});
});
