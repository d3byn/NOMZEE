package com.example.foodapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.foodapp.entity.Restaurant;
import com.example.foodapp.entity.Role;
import com.example.foodapp.entity.User;
import com.example.foodapp.service.RestaurantService;

import jakarta.servlet.http.HttpSession;


@RestController
@RequestMapping("/restaurant")
public class RestaurantController {

    @Autowired
    private RestaurantService service;

    @PostMapping("/add")
    public String add(@RequestBody Restaurant restaurant, HttpSession session) {

        User user = (User) session.getAttribute("user");

        if (user == null) return "Please login first";

        if (user.getRole() != Role.BUSINESS) {
            return "Only business users can add restaurant";
        }

        restaurant.setOwner(user);
        service.addRestaurant(restaurant);

        return "Restaurant added";
    }
    @GetMapping("/all")
    public List<Restaurant> getAllRestaurants() {
        return service.getAllRestaurants();
    }
    
    @GetMapping("/my")
    public List<Restaurant> getMyRestaurants(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) return List.of();
        return service.getRestaurantsByOwner(user);
    }
}