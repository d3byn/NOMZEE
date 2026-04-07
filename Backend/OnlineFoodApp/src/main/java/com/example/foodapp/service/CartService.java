package com.example.foodapp.service;

import java.util.List;

import com.example.foodapp.entity.CartItem;
import com.example.foodapp.entity.User;

public interface CartService {
    CartItem addToCart(User user, Long foodId, int qty);
    List<CartItem> getCart(User user);
    void removeFromCart(User user, Long foodId);
}