import { getWeatherForLocation } from '../apps/weather';
import { IFunction, IRequest } from '../../types';

export const get_weather: IFunction = {
	name: 'get_weather',
	description: 'Get the current weather for a location, only use this if the user has explicitly asked for the weather',
	parameters: {
		type: 'object',
		properties: {
			longitude: {
				type: 'number',
				description: 'The longitude to get the weather for',
			},
			latitude: {
				type: 'number',
				description: 'The latitude to get the weather for',
			},
		},
		required: ['longitude', 'latitude'],
	},
	function: async (chatId: string, args: any, req: IRequest, appUrl?: string) => {
		const location = { longitude: args.longitude || args.lat, latitude: args.latitude || args.lon };

		if (!location.longitude || !location.latitude) {
			return {
				status: 'error',
				name: 'get_weather',
				content: 'Missing location',
				data: {},
			};
		}

		const data = await getWeatherForLocation(req.env, location);
		return data;
	},
};
