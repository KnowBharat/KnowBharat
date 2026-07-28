package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.Festival;
import com.knowbharat.backend.service.FestivalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/festivals")
public class FestivalController {

    private final FestivalService festivalService;

    @Autowired
    public FestivalController(FestivalService festivalService) {
        this.festivalService = festivalService;
    }

    @GetMapping("/all")
    public List<Festival> getAllFestivals() {
        return festivalService.getAllFestivals();
    }

    @GetMapping("/festival/{stateId}")
    public List<Festival> getFestivalsByStateId(@PathVariable Long stateId) {
        return festivalService.getFestivalsByStateId(stateId);
    }

}
