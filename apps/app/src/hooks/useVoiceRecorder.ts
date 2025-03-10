import { useRef, useState } from "react";

import { API_BASE_URL } from "../constants";
import { apiKeyService } from "../lib/api-key";

interface UseVoiceRecorderProps {
	onTranscribe: (data: {
		response: {
			content: string;
		};
	}) => void;
}

export function useVoiceRecorder({ onTranscribe }: UseVoiceRecorderProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];

			mediaRecorder.ondataavailable = (e) => {
				chunksRef.current.push(e.data);
			};

			mediaRecorder.onstop = async () => {
				try {
					setIsTranscribing(true);

					if (!chunksRef?.current) {
						throw new Error("No audio provided.");
					}

					const apiKey = await apiKeyService.getApiKey();

					if (!apiKey) {
						throw new Error("API key not found");
					}

					const formData = new FormData();
					const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
					formData.append("audio", audioBlob);

					const res = await fetch(`${API_BASE_URL}/chat/transcribe`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${apiKey}`,
							"x-user-email": "anonymous@undefined.computer",
						},
						credentials: "include",
						body: formData,
					});

					if (!res.ok) {
						console.error("Error fetching data from AI", res.statusText);
						throw new Error("Error fetching data from AI");
					}

					const data = await res.json();

					await onTranscribe(data);
				} finally {
					setIsTranscribing(false);
				}
			};

			mediaRecorder.start();
			setIsRecording(true);
		} catch (error) {
			console.error("Error starting recording:", error);
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			// biome-ignore lint/complexity/noForEach: It works
			mediaRecorderRef.current.stream
				.getTracks()
				.forEach((track) => track.stop());
			setIsRecording(false);
		}
	};

	return {
		isRecording,
		isTranscribing,
		startRecording,
		stopRecording,
	};
}
