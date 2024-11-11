import { IBody, IUser } from '../types';

export function chatSystemPrompt(request: IBody, user?: IUser): string {
	try {
		const latitude = request.location?.latitude || user?.latitude;
		const longitude = request.location?.longitude || user?.longitude;
		const date = request.date || new Date().toISOString().split('T')[0];

		return `
    You are a personal assistant designed to help the user with their daily tasks.
    Answer the user's questions in 1 or 2 sentences. Be concise and specific while remaining friendly and helpful.
    You should do your best to keep the conversation as short as possible, but don't be afraid to ask for more information if you need it.
    Only answer questions that you are confident in, and don't be afraid to say "I don't know" if you don't know the answer.
    If you are unsure about the user's question, ask for clarification.
    Only answer in text, don't return computer code.
  
    Here's some additional context:
    - Today's date: ${date}
    ${latitude && longitude && `- User's location: Latitude ${latitude}, Longitude ${longitude}`}
    `;
	} catch (error) {
		console.error(error);
		return '';
	}
}
