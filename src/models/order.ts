export enum BaseIngredient {
	FORMAGGIO = 'Formaggio',
	INSALATA = 'Insalata',
	PEPERONI = 'Peperoni',
	CIPOLLA = 'Cipolla'
}

export enum ItemType {
	PANINO = 'Panino',
	PANINO_ONTO = 'Panino Onto'
}

export interface OrderItem {
	type: ItemType;
	quantity: number;
	glutenFree?: boolean;
	removedIngredients?: BaseIngredient[];
	ready?: boolean;
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
	[ItemType.PANINO]: [BaseIngredient.FORMAGGIO, BaseIngredient.INSALATA],
	[ItemType.PANINO_ONTO]: [BaseIngredient.FORMAGGIO, BaseIngredient.INSALATA, BaseIngredient.PEPERONI, BaseIngredient.CIPOLLA]
};
