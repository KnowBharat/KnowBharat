package com.knowbharat.backend.service;

import com.knowbharat.backend.entity.Food;
import com.knowbharat.backend.repository.FoodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodService {

    @Autowired
    private FoodRepository foodRepository;

    @Cacheable("allFoods")
    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    @Cacheable(value = "foodsByState", key = "#stateid")
    public List<Food> getFoodsByState(int stateid) {
        return foodRepository.findByStateId(stateid);
    }
}