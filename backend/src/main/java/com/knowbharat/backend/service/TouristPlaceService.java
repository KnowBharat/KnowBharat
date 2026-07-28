package com.knowbharat.backend.service;

import com.knowbharat.backend.entity.TouristPlace;
import com.knowbharat.backend.repository.TouristPlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TouristPlaceService {

    @Autowired
    private TouristPlaceRepository touristPlaceRepository;

    @Cacheable("allTouristPlaces")
    public List<TouristPlace> getAllTouristPlaces() {
        return touristPlaceRepository.findAll();
    }

    @Cacheable(value = "touristPlaceById", key = "#id")
    public Optional<TouristPlace> getTouristPlaceById(Long id) {
        return touristPlaceRepository.findById(id);
    }

    @Cacheable(value = "touristPlacesByState", key = "#stateId")
    public List<TouristPlace> getTouristPlacesByStateId(Long stateId) {
        return touristPlaceRepository.findByStateId(stateId);
    }
}