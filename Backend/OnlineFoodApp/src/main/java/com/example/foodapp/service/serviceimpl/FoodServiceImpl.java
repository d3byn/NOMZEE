package com.example.foodapp.service.serviceimpl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

import com.example.foodapp.entity.FoodItem;
import com.example.foodapp.entity.Restaurant;
import com.example.foodapp.repository.FoodItemRepository;
import com.example.foodapp.repository.RestaurantRepository;
import com.example.foodapp.service.FoodService;

@Service
public class FoodServiceImpl implements FoodService {

	@Autowired
	private FoodItemRepository repo;
	
	@Autowired
	private RestaurantRepository restaurantRepo;

	public FoodItem addFood(FoodItem food) {
		// Fetch the restaurant and check it's APPROVED
		Restaurant restaurant = restaurantRepo.findById(food.getRestaurant().getId())
				.orElseThrow(() -> new RuntimeException("Restaurant not found"));

		if (!"APPROVED".equals(restaurant.getStatus())) {
			throw new RuntimeException("Restaurant is not approved yet. Please wait for admin approval.");
		}

		return repo.save(food);
	}

	public List<FoodItem> getAllFoods() {
		return repo.findAll();
	}

	public FoodItem updateFood(Long id, FoodItem updated) {
		FoodItem existing = repo.findById(id).orElseThrow();
		existing.setName(updated.getName());
		existing.setDescription(updated.getDescription());
		existing.setPrice(updated.getPrice());
		existing.setImageUrl(updated.getImageUrl());
		return repo.save(existing);
	}

	public void deleteFood(Long id) {
		repo.deleteById(id);

	}

}
