package com.example.foodapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.foodapp.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}