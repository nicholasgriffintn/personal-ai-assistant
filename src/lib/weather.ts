import { IWeather } from '../types';

export const getWeatherForLocation = async (env: any, location: { latitude: number; longitude: number }): Promise<string> => {
	try {
		if (!env.OPENWEATHERMAP_API_KEY) {
			throw new Error('Missing OPENWEATHERMAP_API_KEY variable');
		}

		const baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
		const url = `${baseUrl}?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${env.OPENWEATHERMAP_API_KEY}`;

		const weatherResponse = await fetch(url);

		if (!weatherResponse.ok) {
			throw new Error('Error fetching weather data');
		}

		const weatherData: IWeather = await weatherResponse.json();

		if (weatherData.cod !== 200) {
			return "Sorry, I couldn't find the weather for that location";
		}

		return `The weather in ${weatherData.name} is ${weatherData.weather[0].description} with a temperature of ${weatherData.main.temp}°C`;
	} catch (error) {
		console.error(error);
		return '';
	}
};
