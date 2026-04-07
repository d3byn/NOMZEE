package com.example.foodapp.service;

import java.util.List;

import com.example.foodapp.entity.FoodItem;

public interface FoodService {
    FoodItem addFood(FoodItem food);
    List<FoodItem> getAllFoods();
	FoodItem updateFood(Long id, FoodItem updated);
	void deleteFood(Long id);
}
