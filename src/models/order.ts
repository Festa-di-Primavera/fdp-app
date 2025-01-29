export enum SauceType {
	KETCHUP = 'Ketchup',
	MAYO = 'Maionese',
}

export enum BaseIngredient {
	FORMAGGIO = 'Formaggio',
	INSALATA = 'Insalata',
	PEPERONI = 'Peperoni',
	CIPOLLA = 'Cipolla'
}

export enum ItemType {
	PANINO = 'Panino',
	PANINO_ONTO = 'Panino Onto',
	PATATINE = 'Patatine'
}

export interface OrderItem {
	type: ItemType;
	quantity: number;
	glutenFree?: boolean;
	removedIngredients?: BaseIngredient[];
	addedSauces?: SauceType[];
}

export interface Order {
	ticketId: string;
	name: string;
	items: OrderItem[];
	done: boolean;
	timestamp: number; // nuovo campo
}

export const DEFAULT_INGREDIENTS: Record<ItemType, BaseIngredient[]> = {
	[ItemType.PANINO]: [BaseIngredient.FORMAGGIO, BaseIngredient.INSALATA],
	[ItemType.PANINO_ONTO]: [BaseIngredient.FORMAGGIO, BaseIngredient.INSALATA, BaseIngredient.PEPERONI, BaseIngredient.CIPOLLA],
	[ItemType.PATATINE]: []
};
