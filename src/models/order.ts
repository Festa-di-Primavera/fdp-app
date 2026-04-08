export enum BaseIngredient {
    INSALATA = "Insalata",
    FORMAGGIO = "Formaggio",
    PEPERONI = "Peperoni",
    CIPOLLA = "Cipolla",

    // Hot Dog
    KETCHUP = "Ketchup",
}

export enum ItemType {
    BASIC = "BASIC",
    ONTO = "ONTO",
    VEGETARIANO = "VEGETARIANO",
    HOTDOG = "HOTDOG",
}

export interface OrderItem {
    type: ItemType;
    quantity: number;
    glutenFree?: boolean;
    removedIngredients?: BaseIngredient[];
    ready?: boolean;
    notes?: string;
}

export interface Order {
    ticketId: string;
    fiscalMatrixNumber: string;
    name: string;
    surname: string;
    items: OrderItem[];
    done: boolean | null;
    creationDate: Date;
    closeDate?: Date;
    email?: string;
    firebaseId?: string;
}

export const DEFAULT_INGREDIENTS: Record<ItemType, BaseIngredient[]> = {
    [ItemType.BASIC]: [BaseIngredient.INSALATA, BaseIngredient.FORMAGGIO],
    [ItemType.ONTO]: [
        BaseIngredient.INSALATA,
        BaseIngredient.FORMAGGIO,
        BaseIngredient.PEPERONI,
        BaseIngredient.CIPOLLA,
    ],
    [ItemType.VEGETARIANO]: [
        BaseIngredient.INSALATA,
        BaseIngredient.FORMAGGIO,
        BaseIngredient.PEPERONI,
        BaseIngredient.CIPOLLA,
    ],
    [ItemType.HOTDOG]: [BaseIngredient.KETCHUP],
};
