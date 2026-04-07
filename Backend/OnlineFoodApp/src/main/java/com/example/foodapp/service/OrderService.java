package com.example.foodapp.service;

import com.example.foodapp.entity.Order;
import com.example.foodapp.entity.User;

import jakarta.servlet.http.HttpSession;

public interface OrderService {
    Order placeOrder(User user);

	Order placeOrder(HttpSession session, Double grandTotal);
}
