package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.TouristPlace;
import com.knowbharat.backend.service.TouristPlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/places")
public class TouristPlaceController {

    @Autowired
    private TouristPlaceService placeService;

    @GetMapping("all")
    public List<TouristPlace> allFoods(){ return placeService.getAllTouristPlaces();}

    @GetMapping("/TouristPlace")
    public Optional<TouristPlace> getFood(@RequestParam Long stateid) {
        return placeService.getTouristPlaceById(stateid);
    }

    @GetMapping("/place/{stateId}")
    public List<TouristPlace> getPlacesByStateId(@PathVariable Long stateId) {
        return placeService.getTouristPlacesByStateId(stateId);
    }
}
