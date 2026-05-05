package com.example.foodapp.repository;

import com.example.foodapp.entity.RestaurantApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RestaurantApprovalRepository
        extends JpaRepository<RestaurantApproval, Long> {

    List<RestaurantApproval> findByStatus(String status);
    Optional<RestaurantApproval> findByRestaurantId(Long restaurantId);
}