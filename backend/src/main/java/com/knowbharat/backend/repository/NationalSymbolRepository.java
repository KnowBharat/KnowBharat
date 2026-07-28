package com.knowbharat.backend.repository;


import com.knowbharat.backend.entity.NationalSymbol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NationalSymbolRepository extends JpaRepository<NationalSymbol, String> {
}