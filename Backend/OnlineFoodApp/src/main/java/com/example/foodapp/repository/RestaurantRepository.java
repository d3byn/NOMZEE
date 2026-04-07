package com.example.foodapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.foodapp.entity.Restaurant;
import com.example.foodapp.entity.User;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

	List<Restaurant> findByOwner(User owner);}
