package com.example.foodapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.foodapp.entity.Order;
import com.example.foodapp.entity.User;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
}
