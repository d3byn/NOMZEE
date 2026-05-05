package com.example.foodapp.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.foodapp.entity.Restaurant;
import com.example.foodapp.entity.RestaurantApproval;
import com.example.foodapp.entity.Role;
import com.example.foodapp.entity.User;
import com.example.foodapp.repository.RestaurantApprovalRepository;
import com.example.foodapp.service.RestaurantService;

import jakarta.servlet.http.HttpSession;


@RestController
@RequestMapping("/restaurant")
public class RestaurantController {

	@Autowired
	private RestaurantApprovalRepository approvalRepo;
	
	@Autowired
	private RestaurantService service;
	 
	@PostMapping("/add")
	public Map<String, Object> add(@RequestBody Restaurant r, HttpSession session) {
	    User owner = (User) session.getAttribute("user");
	    r.setOwner(owner);
	    r.setStatus("PENDING");             // starts as PENDING — not approved yet
	    Restaurant saved = service.addRestaurant(r);
	 
	    // Create approval request record
	    RestaurantApproval approval = new RestaurantApproval();
	    approval.setRestaurant(saved);
	    approval.setRequestedBy(owner);
	    approval.setStatus("PENDING");
	    approvalRepo.save(approval);
	 
	    // Return restaurant + message to frontend
	    Map<String, Object> response = new HashMap<>();
	    response.put("restaurant", saved);
	    response.put("message", "Restaurant submitted for admin approval. You can add food items once approved.");
	    return response;
	}
	 
	
	@GetMapping("/my")
	public List<Restaurant> getMyRestaurants(HttpSession session) {
	    User user = (User) session.getAttribute("user");
	    if (user == null) return List.of();
	    return service.getRestaurantsByOwner(user);
	    // Frontend will filter by status and show PENDING / APPROVED / BLOCKED labels
	}
    
   
}