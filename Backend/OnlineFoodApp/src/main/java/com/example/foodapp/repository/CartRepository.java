package com.example.foodapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.foodapp.entity.CartItem;
import com.example.foodapp.entity.User;

import java.util.List;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser(User user);
}