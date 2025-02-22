import plugin from 'flowbite/plugin';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'],

	plugins: [plugin],

	darkMode: 'class',

	theme: {
		extend: {
			colors: {
				primary: {
					50: '#e6f4eb',
					100: '#c2e3cc',
					200: '#9ed2ae',
					300: '#7ac18f',
					400: '#56b071',
					500: '#329d53',
					600: '#008b27',
					700: '#007a22',
					800: '#00691e',
					900: '#005819',
				}
			}
		}
	}
};