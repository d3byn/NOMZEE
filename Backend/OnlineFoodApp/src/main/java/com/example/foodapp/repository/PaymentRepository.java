package com.example.foodapp.repository;

import com.example.foodapp.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	Payment findByRazorpayOrderId(String orderId);
}