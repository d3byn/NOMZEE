package com.example.foodapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.foodapp.entity.FoodItem;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {}
