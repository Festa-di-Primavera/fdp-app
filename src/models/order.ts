export enum BaseIngredient {
	FORMAGGIO = 'Formaggio',
	INSALATA = 'Insalata',
	PEPERONI = 'Peperoni',
	CIPOLLA = 'Cipolla'
}

export enum ItemType {
	// PANINO = 'Panino',
	// PANINO_ONTO = 'Panino Onto'
	ONTO = 'ONTO',
	VEGETARIANO = 'VEGETARIANO',
	BASIC = 'BASIC'
}

export enum Sauce {
	MAIONESE = 'MAIONESE',
	KETCHUP = 'KETCHUP',
	BBQ = 'BBQ',
}

export interface OrderItem {
	type: ItemType;
	quantity: number;
	glutenFree?: boolean;
	removedIngredients?: BaseIngredient[];
	sauce?: Sauce;
	ready?: boolean;
	notes?: string;	//TODO: Remove
}

export interface Order {
	ticketId: string;
	name: string;
	items: OrderItem[];
	done: boolean;
	timestamp: number;
	id?: string;
}

export const DEFAULT_INGREDIENTS: Record<ItemType, BaseIngredient[]> = {
	// [ItemType.PANINO]: [BaseIngredient.FORMAGGIO, BaseIngredient.INSALATA],
	// [ItemType.PANINO_ONTO]: [BaseIngredient.FORMAGGIO, BaseIngredient.INSALATA, BaseIngredient.PEPERONI, BaseIngredient.CIPOLLA]
	[ItemType.ONTO]: [],
	[ItemType.VEGETARIANO]: [],
	[ItemType.BASIC]: []
};