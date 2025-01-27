// Generic function that given a string returns the enum value
export function getEnumValueFromString<T>(
    enumType: T,
    value: string
): T[keyof T] {
    return enumType[value as keyof T];
}

// Generic function that given an enum value returns the string
export function getStringFromEnumValue<T extends object>(
    enumType: T,
    value: T[keyof T]
): string {
    return (Object.keys(enumType) as Array<keyof T>).find(
        (key) => enumType[key] === value
    ) as string;
}
