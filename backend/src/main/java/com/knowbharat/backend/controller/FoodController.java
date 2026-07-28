package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.Food;
import com.knowbharat.backend.service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/foods")
public class FoodController {

    @Autowired
    private FoodService foodService;

    @GetMapping("all")
    public List<Food> allFoods(){ return foodService.getAllFoods();}

    @GetMapping("/food/{stateId}")
    public List<Food> getFoodsByState(@PathVariable int stateId) {
        return foodService.getFoodsByState(stateId);
    }

}
