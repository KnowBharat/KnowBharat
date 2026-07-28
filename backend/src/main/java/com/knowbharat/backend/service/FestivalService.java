package com.knowbharat.backend.service;

import com.knowbharat.backend.entity.Festival;
import com.knowbharat.backend.repository.FestivalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FestivalService {

    private final FestivalRepository festivalRepository;

    @Autowired
    public FestivalService(FestivalRepository festivalRepository) {
        this.festivalRepository = festivalRepository;
    }

    @Cacheable("allFestivals")
    public List<Festival> getAllFestivals() {
        return festivalRepository.findAll();
    }

    @Cacheable(value = "festivalsByState", key = "#stateId")
    public List<Festival> getFestivalsByStateId(Long stateId) {
        return festivalRepository.findByStateId(stateId);
    }
}