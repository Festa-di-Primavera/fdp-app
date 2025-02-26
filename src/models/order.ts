export enum BaseIngredient {
	INSALATA = 'Insalata',
	PEPERONI = 'Peperoni',
	CIPOLLA = 'Cipolla'
}

export enum ItemType {
	ONTO = 'ONTO',
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
	notes?: string;
}

export interface Order {
	ticketId: string;
	name: string;
	surname: string;
	items: OrderItem[];
	done: boolean | null;
	timestamp: number;
	email?: string;
}

export const DEFAULT_INGREDIENTS: Record<ItemType, BaseIngredient[]> = {
	[ItemType.BASIC]: [BaseIngredient.INSALATA],
	[ItemType.ONTO]: [BaseIngredient.INSALATA, BaseIngredient.PEPERONI, BaseIngredient.CIPOLLA],
};