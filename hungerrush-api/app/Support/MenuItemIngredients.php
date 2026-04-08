<?php

namespace App\Support;

class MenuItemIngredients
{
    public static function suggest(string $itemName, ?string $categoryName = null): string
    {
        $haystack = strtolower(trim($itemName.' '.($categoryName ?? '')));

        $rules = [
            [['beef burger', 'burger'], 'Beef patty, lettuce, tomato, onions, pickles, burger bun, cheese, house sauce'],
            [['chicken burger', 'crispy chicken'], 'Chicken fillet, lettuce, pickles, burger bun, mayo, cheddar cheese'],
            [['pizza', 'margherita'], 'Pizza dough, mozzarella cheese, tomato sauce, basil, olive oil'],
            [['pasta', 'spaghetti'], 'Pasta, garlic, olive oil, parmesan cheese, black pepper, parsley'],
            [['shawarma'], 'Marinated meat, garlic sauce, pickles, fries, bread wrap'],
            [['falafel'], 'Chickpeas, parsley, garlic, onion, cumin, coriander, pita bread'],
            [['salad', 'caesar'], 'Lettuce, cucumber, tomato, olive oil, lemon juice, salt, pepper'],
            [['sandwich'], 'Fresh bread, lettuce, tomato, cheese, house dressing'],
            [['fries', 'potato'], 'Potatoes, salt, black pepper, frying oil'],
            [['cola', 'soft drink', 'soda'], 'Carbonated water, sweetener, flavoring, natural color'],
            [['juice'], 'Fresh fruit blend, cold water, ice'],
            [['coffee'], 'Coffee beans, hot water, sugar'],
            [['cake', 'dessert'], 'Flour, sugar, eggs, butter, milk, vanilla'],
            [['ice cream'], 'Milk, cream, sugar, vanilla'],
        ];

        foreach ($rules as [$keywords, $ingredients]) {
            foreach ($keywords as $keyword) {
                if (str_contains($haystack, $keyword)) {
                    return $ingredients;
                }
            }
        }

        return 'Salt, pepper, olive oil, and chef special seasoning';
    }
}
