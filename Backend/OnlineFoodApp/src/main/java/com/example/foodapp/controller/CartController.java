package com.example.foodapp.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.foodapp.entity.CartItem;
import com.example.foodapp.entity.User;
import com.example.foodapp.service.CartService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private CartService service;

    @PostMapping("/add")
    public CartItem add(@RequestBody Map<String, Object> data, HttpSession session) {

        User user = (User) session.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("Please login first");
        }

        Long foodId = Long.parseLong(data.get("foodId").toString());
        int qty = Integer.parseInt(data.get("qty").toString());

        return service.addToCart(user, foodId, qty);
    }
    @GetMapping("/view")
    public List<CartItem> viewCart(HttpSession session) {

        User user = (User) session.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("Please login first");
        }

        return service.getCart(user);
    }
    @DeleteMapping("/remove/{foodId}")
    public String remove(@PathVariable Long foodId, HttpSession session) {

        User user = (User) session.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("Please login first");
        }

        service.removeFromCart(user, foodId);

        return "Item removed from cart";
    }
}
