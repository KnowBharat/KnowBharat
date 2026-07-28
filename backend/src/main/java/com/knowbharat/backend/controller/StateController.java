package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.State;
import com.knowbharat.backend.service.StateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/states")
public class StateController {
    @Autowired
    private StateService stateService;

    @GetMapping("/all")
    public List<State> getAllStates() {
        return stateService.getAllStates();
    }

    @GetMapping("/state")
    public State getState(@RequestParam String name) {
        return stateService.getStateByName(name);
    }

}
