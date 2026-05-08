package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.NationalSymbol;
import com.knowbharat.backend.service.NationalSymbolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/symbols")
public class NationalSymbolController {

    @Autowired
    private NationalSymbolService symbolService;

    // This handles GET requests to http://localhost:8081/api/symbols
    @GetMapping
    public List<NationalSymbol> getAllSymbols() {
        return symbolService.getAllSymbols();
    }
}