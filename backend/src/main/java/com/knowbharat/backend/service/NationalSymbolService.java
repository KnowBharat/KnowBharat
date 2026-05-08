package com.knowbharat.backend.service;

import com.knowbharat.backend.entity.NationalSymbol;
import com.knowbharat.backend.repository.NationalSymbolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NationalSymbolService {

    @Autowired
    private NationalSymbolRepository repository;

    public List<NationalSymbol> getAllSymbols() {
        return repository.findAll();
    }
}