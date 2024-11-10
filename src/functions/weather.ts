import { getWeatherForLocation } from '../lib/weather';
import { IFunction, IRequest } from '../types';

export const get_weather: IFunction = {
	type: 'function',
	function: {
		name: 'get_weather',
		description: 'Get the current weather for a location',
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
		},
	},
	async execute(args: any, req: IRequest) {
		const location = { longitude: args.longitude, latitude: args.latitude };

		if (!location.longitude || !location.latitude) {
			return '';
		}

		return await getWeatherForLocation(req.env, location);
	},
};
