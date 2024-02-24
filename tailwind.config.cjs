import plugin from 'flowbite/plugin';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'],

	plugins: [plugin],

	darkMode: 'class',

	theme: {
		extend: {
			colors: {
				primary: {
					50: '#E6A1E9',
					100: '#E089E3',
					200: '#D972DE',
					300: '#D35AD8',
					400: '#CD42D3',
					500: '#C72BCD',
					600: '#C114C8',
					700: '#AD12B4',
					800: '#9A10A0',
					900: '#870E8C',
				}
			}
		}
	}
};