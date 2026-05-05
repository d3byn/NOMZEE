package com.example.foodapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_approval")
public class RestaurantApproval {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	private Restaurant restaurant; // the restaurant awaiting approval

	@ManyToOne
	private User requestedBy; // the BUSINESS user who submitted it

	private String status = "PENDING"; // PENDING | APPROVED | REJECTED

	private String adminNote; // optional rejection reason from admin

	private LocalDateTime requestedAt = LocalDateTime.now();

	private LocalDateTime reviewedAt;

	// Getters & Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Restaurant getRestaurant() {
		return restaurant;
	}

	public void setRestaurant(Restaurant restaurant) {
		this.restaurant = restaurant;
	}

	public User getRequestedBy() {
		return requestedBy;
	}

	public void setRequestedBy(User requestedBy) {
		this.requestedBy = requestedBy;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getAdminNote() {
		return adminNote;
	}

	public void setAdminNote(String adminNote) {
		this.adminNote = adminNote;
	}

	public LocalDateTime getRequestedAt() {
		return requestedAt;
	}

	public void setRequestedAt(LocalDateTime requestedAt) {
		this.requestedAt = requestedAt;
	}

	public LocalDateTime getReviewedAt() {
		return reviewedAt;
	}

	public void setReviewedAt(LocalDateTime reviewedAt) {
		this.reviewedAt = reviewedAt;
	}
}