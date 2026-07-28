package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.TraditionalWear;
import com.knowbharat.backend.service.TraditionalWearService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/wears")
public class TraditionalWearController {

    private final TraditionalWearService traditionalWearService;

    @Autowired
    public TraditionalWearController(TraditionalWearService traditionalWearService) {
        this.traditionalWearService = traditionalWearService;
    }

    @GetMapping("/all")
    public List<TraditionalWear> getAllTraditionalWears() {
        return traditionalWearService.getAllTraditionalWears();
    }

    @GetMapping("/wear/{stateId}")
    public Optional<TraditionalWear> getTraditionalWearByStateId(@PathVariable Long stateId) {
        return traditionalWearService.getTraditionalWearByStateId(stateId);
    }
}
