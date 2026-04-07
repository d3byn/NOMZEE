package com.example.foodapp.service.serviceimpl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.foodapp.entity.CartItem;
import com.example.foodapp.entity.FoodItem;
import com.example.foodapp.entity.User;
import com.example.foodapp.repository.CartRepository;
import com.example.foodapp.repository.FoodItemRepository;
import com.example.foodapp.service.CartService;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepo;

    @Autowired
    private FoodItemRepository foodRepo;

    @Override
    public CartItem addToCart(User user, Long foodId, int qty) {

        FoodItem food = foodRepo.findById(foodId).orElseThrow();

        List<CartItem> existing = cartRepo.findByUser(user);

        for (CartItem item : existing) {
            if (item.getFoodItem().getId().equals(foodId)) {
                item.setQuantity(item.getQuantity() + qty);
                return cartRepo.save(item);
            }
        }

        CartItem newItem = new CartItem();
        newItem.setUser(user);
        newItem.setFoodItem(food);
        newItem.setQuantity(qty);

        return cartRepo.save(newItem);
    }
    @Override
    public void removeFromCart(User user, Long foodId) {

        List<CartItem> items = cartRepo.findByUser(user);

        for (CartItem item : items) {
            if (item.getFoodItem().getId().equals(foodId)) {
                cartRepo.delete(item);
                return;
            }
        }

        throw new RuntimeException("Item not found in cart");
    }

    public List<CartItem> getCart(User user) {
        return cartRepo.findByUser(user);
    }
}
