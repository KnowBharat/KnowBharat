package com.knowbharat.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching; // 🌟 ADD THIS
import org.springframework.scheduling.annotation.EnableAsync; // 🌟 ADD THIS

@SpringBootApplication
@EnableCaching // 🌟 ACTIVATES CACHING
@EnableAsync   // 🌟 ACTIVATES BACKGROUND THREADS
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
}