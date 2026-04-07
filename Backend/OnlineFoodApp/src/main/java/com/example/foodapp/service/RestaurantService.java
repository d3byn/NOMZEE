package com.example.foodapp.service;

import java.util.List;

import com.example.foodapp.entity.Restaurant;
import com.example.foodapp.entity.User;

public interface RestaurantService {
    Restaurant addRestaurant(Restaurant restaurant);

	List<Restaurant> getAllRestaurants();

	List<Restaurant> getRestaurantsByOwner(User owner);
}
