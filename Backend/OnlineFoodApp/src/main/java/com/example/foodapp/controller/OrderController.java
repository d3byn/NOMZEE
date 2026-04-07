package com.example.foodapp.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.foodapp.entity.Order;
import com.example.foodapp.entity.User;
import com.example.foodapp.service.OrderService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService service;

    @PostMapping("/place")
    public Order placeOrder(@RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        // Extract grand total sent from frontend (includes tax + delivery fee)
        Double grandTotal = null;
        if (body != null && body.containsKey("total")) {
            grandTotal = Double.parseDouble(body.get("total").toString());
        }
        return service.placeOrder(session, grandTotal);
    }
}
