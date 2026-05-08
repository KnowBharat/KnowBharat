package com.knowbharat.backend.service;

import com.knowbharat.backend.entity.State;
import com.knowbharat.backend.repository.StateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable; // 🌟 ADD THIS
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StateService {

    @Autowired
    private StateRepository stateRepository;

    // 🟢 The first user hits the DB. Users 2 through 1,000,000 get the data from RAM instantly.
    @Cacheable("allStates")
    public List<State> getAllStates() {
        // 🛑 ORIGINAL
         return stateRepository.findAll();

//        System.out.println("fetching from DB... (If you see this twice, caching failed!)");
//        return stateRepository.findAll();
    }

    // 🟢 Caches specific states based on the name passed in.
    @Cacheable(value = "stateByName", key = "#name")
    public State getStateByName(String name) {
        // 🛑 ORIGINAL
         return stateRepository.findByName(name);

//        return stateRepository.findByName(name);
    }
}