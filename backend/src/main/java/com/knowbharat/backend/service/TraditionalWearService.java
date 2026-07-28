package com.knowbharat.backend.service;

import com.knowbharat.backend.entity.TraditionalWear;
import com.knowbharat.backend.repository.TraditionalWearRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TraditionalWearService {

    private final TraditionalWearRepository traditionalWearRepository;

    @Autowired
    public TraditionalWearService(TraditionalWearRepository traditionalWearRepository) {
        this.traditionalWearRepository = traditionalWearRepository;
    }

    @Cacheable(value = "wearByState", key = "#stateId")
    public Optional<TraditionalWear> getTraditionalWearByStateId(Long stateId) {
        return traditionalWearRepository.findByStateId(stateId);
    }

    @Cacheable("allWears")
    public List<TraditionalWear> getAllTraditionalWears() {
        return traditionalWearRepository.findAll();
    }
}