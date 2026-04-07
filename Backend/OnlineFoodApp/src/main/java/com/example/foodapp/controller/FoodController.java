package com.example.foodapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.foodapp.entity.FoodItem;
import com.example.foodapp.service.FoodService;

@RestController
@RequestMapping("/food")
public class FoodController {

    @Autowired
    private FoodService service;

    @PostMapping("/add")
    public FoodItem add(@RequestBody FoodItem food) {
        return service.addFood(food);
    }

    @GetMapping("/all")
    public List<FoodItem> getAll() {
        return service.getAllFoods();
    }
    
    @PutMapping("/update/{id}")
    public FoodItem updateFood(@PathVariable Long id, @RequestBody FoodItem updated) {
        return service.updateFood(id, updated);
    }
     
    @DeleteMapping("/delete/{id}")
    public String deleteFood(@PathVariable Long id) {
        service.deleteFood(id);
        return "Food item deleted successfully";
    }
}
